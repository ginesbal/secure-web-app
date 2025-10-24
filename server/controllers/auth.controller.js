// server/controllers/auth.controller.js - Authentication business logic

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
    USER_ROLES,
    ACTIVITY_STATUS,
    SECURITY_EVENT_TYPES,
    SEVERITY_LEVELS,
    HTTP_STATUS,
    VALIDATION_MESSAGES
} = require('../constants');
const {
    rotateSessionTokens,
    clearAuthCookies,
    generateAccessToken,
    setAuthCookies,
    storeCSRFToken,
    generateCSRFToken
} = require('../middleware/auth');
const { ConflictError, AuthenticationError } = require('../middleware/error-handler');

class AuthController {
    constructor(db, config, loggingService) {
        this.db = db;
        this.config = config;
        this.logger = loggingService;
    }

    /**
     * Register a new user
     */
    async register(req, res) {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await this.db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            await this.logger.logActivity(
                null,
                `Registration attempt with existing ${existingUser.username === username ? 'username' : 'email'}`,
                ACTIVITY_STATUS.FAILED,
                req.ip
            );

            throw new ConflictError(VALIDATION_MESSAGES.USER_EXISTS);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.config.bcryptRounds);

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const result = await this.db.run(
            `INSERT INTO users (username, email, password, role, verification_token)
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, USER_ROLES.USER, verificationToken]
        );

        await this.logger.logActivity(
            result.lastID,
            'User registered',
            ACTIVITY_STATUS.SUCCESS,
            req.ip
        );

        // In production, send verification email here
        // await emailService.sendVerificationEmail(email, verificationToken);

        res.status(HTTP_STATUS.CREATED).json({
            message: 'Registration successful. Please verify your email.',
            userId: result.lastID,
            // TODO: Remove this in production - only for demo
            verificationToken: this.config.nodeEnv === 'development' ? verificationToken : undefined
        });
    }

    /**
     * Verify email address
     */
    async verifyEmail(req, res) {
        const { token } = req.body;

        if (!token) {
            throw new AuthenticationError('Verification token required');
        }

        const user = await this.db.get(
            'SELECT * FROM users WHERE verification_token = ?',
            [token]
        );

        if (!user) {
            throw new AuthenticationError('Invalid verification token');
        }

        await this.db.run(
            'UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?',
            [user.id]
        );

        await this.logger.logActivity(
            user.id,
            'Email verified',
            ACTIVITY_STATUS.SUCCESS,
            req.ip
        );

        res.json({ message: 'Email verified successfully' });
    }

    /**
     * Login user
     */
    async login(req, res) {
        const { username, password } = req.body;

        // Check for account lockout due to too many failed attempts
        const suspiciousActivity = await this.logger.checkSuspiciousActivity(req.ip);
        if (suspiciousActivity.isSuspicious) {
            await this.logger.logSecurityEvent(
                SECURITY_EVENT_TYPES.BRUTE_FORCE,
                SEVERITY_LEVELS.HIGH,
                `Potential brute force attack: ${suspiciousActivity.failed_attempts} failed attempts`,
                req.ip,
                null,
                { username },
                true
            );

            throw new AuthenticationError(
                'Too many failed login attempts. Please try again later.'
            );
        }

        // Find user
        const user = await this.db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            await this.logger.logFailedLogin(username, req.ip, 'User not found');
            throw new AuthenticationError(VALIDATION_MESSAGES.INVALID_CREDENTIALS);
        }

        // Check if account is locked
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            await this.logger.logSecurityEvent(
                SECURITY_EVENT_TYPES.LOGIN_FAILURE,
                SEVERITY_LEVELS.MEDIUM,
                'Login attempt on locked account',
                req.ip,
                user.id,
                { username },
                true
            );

            throw new AuthenticationError(
                'Account is temporarily locked. Please try again later.'
            );
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            // Increment failed login attempts
            await this.db.run(
                'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
                [user.id]
            );

            // Lock account after 5 failed attempts
            if (user.failed_login_attempts + 1 >= 5) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                await this.db.run(
                    'UPDATE users SET account_locked_until = ? WHERE id = ?',
                    [lockUntil.toISOString(), user.id]
                );

                await this.logger.logSecurityEvent(
                    SECURITY_EVENT_TYPES.BRUTE_FORCE,
                    SEVERITY_LEVELS.HIGH,
                    'Account locked due to multiple failed login attempts',
                    req.ip,
                    user.id,
                    null,
                    true
                );
            }

            await this.logger.logFailedLogin(username, req.ip, 'Invalid password');
            throw new AuthenticationError(VALIDATION_MESSAGES.INVALID_CREDENTIALS);
        }

        // Check if email is verified (optional - can be enforced)
        // if (!user.email_verified) {
        //     throw new AuthenticationError('Please verify your email before logging in');
        // }

        // Reset failed login attempts
        await this.db.run(
            'UPDATE users SET failed_login_attempts = 0, last_login = datetime("now") WHERE id = ?',
            [user.id]
        );

        // Rotate session tokens (generates new tokens and stores them)
        const { accessToken, refreshToken, csrfToken, user: userData } =
            await rotateSessionTokens(this.db, user.id, this.config, res);

        await this.logger.logSuccessfulLogin(
            user.id,
            user.username,
            req.ip,
            req.headers['user-agent']
        );

        res.json({
            message: 'Login successful',
            user: {
                id: userData.id,
                username: userData.username,
                role: userData.role
            },
            // CSRF token is also set as a cookie (non-httpOnly)
            csrfToken
        });
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(req, res) {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new AuthenticationError('Refresh token required');
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, this.config.jwtRefreshSecret);

        // Check if session exists
        const session = await this.db.get(
            'SELECT * FROM sessions WHERE refresh_token = ? AND user_id = ?',
            [refreshToken, decoded.id]
        );

        if (!session) {
            clearAuthCookies(res);
            throw new AuthenticationError('Invalid refresh token');
        }

        // Get user
        const user = await this.db.get(
            'SELECT id, username, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user) {
            clearAuthCookies(res);
            throw new AuthenticationError('User not found');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(
            { id: user.id, username: user.username, role: user.role },
            this.config.jwtSecret
        );

        // Generate new CSRF token
        const newCsrfToken = generateCSRFToken();

        // Update session
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await this.db.run(
            'UPDATE sessions SET token = ?, expires_at = ?, last_activity = datetime("now") WHERE id = ?',
            [newAccessToken, expiresAt.toISOString(), session.id]
        );

        // Store new CSRF token
        await storeCSRFToken(this.db, user.id, newCsrfToken);

        // Set new cookies
        setAuthCookies(res, newAccessToken, refreshToken, newCsrfToken);

        res.json({
            message: 'Token refreshed successfully',
            csrfToken: newCsrfToken
        });
    }

    /**
     * Logout user
     */
    async logout(req, res) {
        const userId = req.user.id;

        // Delete session from database
        await this.db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

        // Delete CSRF tokens
        await this.db.run('DELETE FROM csrf_tokens WHERE user_id = ?', [userId]);

        await this.logger.logLogout(userId, req.ip);

        // Clear cookies
        clearAuthCookies(res);

        res.json({ message: 'Logout successful' });
    }

    /**
     * Get current user profile
     */
    async getProfile(req, res) {
        const user = await this.db.get(
            `SELECT id, username, email, role, created_at, email_verified, last_login
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        res.json(user);
    }
}

module.exports = AuthController;

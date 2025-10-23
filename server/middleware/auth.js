// server/middleware/auth.js - Secure authentication middleware with httpOnly cookies

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
    USER_ROLES,
    ACTIVITY_STATUS,
    SECURITY_EVENT_TYPES,
    SEVERITY_LEVELS,
    HTTP_STATUS,
    TOKEN_EXPIRY,
    COOKIE_OPTIONS,
    VALIDATION_MESSAGES
} = require('../constants');

/**
 * Generate JWT access token
 */
function generateAccessToken(payload, secret) {
    return jwt.sign(payload, secret, {
        expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN,
        issuer: 'secure-web-app',
        audience: 'secure-web-app-users'
    });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(payload, secret) {
    return jwt.sign(payload, secret, {
        expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN,
        issuer: 'secure-web-app',
        audience: 'secure-web-app-users'
    });
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Set authentication cookies
 */
function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
    // Set access token (httpOnly, short-lived)
    res.cookie('accessToken', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Set refresh token (httpOnly, long-lived)
    res.cookie('refreshToken', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Set CSRF token (NOT httpOnly - needs to be readable by JS)
    res.cookie('csrfToken', csrfToken, {
        ...COOKIE_OPTIONS,
        httpOnly: false, // Must be readable by client
        maxAge: TOKEN_EXPIRY.CSRF_TOKEN
    });
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies(res) {
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.clearCookie('csrfToken', { ...COOKIE_OPTIONS, httpOnly: false });
}

/**
 * Middleware: Authenticate JWT token from cookie
 */
function authenticateToken(db, config, logActivity) {
    return async (req, res, next) => {
        try {
            // Get token from cookie (NOT from header or body)
            const token = req.cookies?.accessToken;

            if (!token) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    error: VALIDATION_MESSAGES.TOKEN_REQUIRED
                });
            }

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret, {
                issuer: 'secure-web-app',
                audience: 'secure-web-app-users'
            });

            // Check if session still exists in database
            const session = await db.get(
                'SELECT * FROM sessions WHERE user_id = ? AND token = ? AND expires_at > datetime("now")',
                [decoded.id, token]
            );

            if (!session) {
                clearAuthCookies(res);
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    error: VALIDATION_MESSAGES.INVALID_TOKEN
                });
            }

            // Attach user to request
            req.user = decoded;
            req.sessionId = session.id;

            // Log activity
            await logActivity(
                decoded.id,
                'API Access',
                ACTIVITY_STATUS.SUCCESS,
                req.ip
            );

            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                clearAuthCookies(res);
                await logActivity(
                    null,
                    'Invalid token attempt',
                    ACTIVITY_STATUS.FAILED,
                    req.ip
                );
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    error: VALIDATION_MESSAGES.INVALID_TOKEN
                });
            }
            next(error);
        }
    };
}

/**
 * Middleware: Validate CSRF token for state-changing operations
 */
function validateCSRF(db, logSecurityEvent) {
    return async (req, res, next) => {
        // Skip CSRF validation for:
        // - GET/HEAD/OPTIONS requests (read-only)
        // - Login/register endpoints (no existing session)
        // - Demo endpoints (for testing purposes)
        if (
            ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
            req.path === '/api/auth/login' ||
            req.path === '/api/auth/register' ||
            req.path.startsWith('/api/demo/')
        ) {
            return next();
        }

        try {
            // Get CSRF token from header
            const csrfToken = req.headers['x-csrf-token'];

            if (!csrfToken) {
                await logSecurityEvent(
                    SECURITY_EVENT_TYPES.CSRF_ATTEMPT,
                    SEVERITY_LEVELS.HIGH,
                    'Missing CSRF token',
                    req.ip,
                    req.user?.id,
                    null,
                    true
                );

                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    error: VALIDATION_MESSAGES.CSRF_TOKEN_REQUIRED
                });
            }

            // For authenticated users, validate CSRF token from database
            if (req.user) {
                const validToken = await db.get(
                    'SELECT * FROM csrf_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime("now")',
                    [csrfToken, req.user.id]
                );

                if (!validToken) {
                    await logSecurityEvent(
                        SECURITY_EVENT_TYPES.CSRF_ATTEMPT,
                        SEVERITY_LEVELS.HIGH,
                        'Invalid CSRF token for authenticated user',
                        req.ip,
                        req.user.id,
                        null,
                        true
                    );

                    return res.status(HTTP_STATUS.FORBIDDEN).json({
                        error: VALIDATION_MESSAGES.INVALID_CSRF
                    });
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware: Role-based authorization
 */
function authorize(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                error: VALIDATION_MESSAGES.TOKEN_REQUIRED
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized access attempt
            console.log(
                `[AUTH] Unauthorized access attempt by ${req.user.username} (${req.user.role}) to ${req.path}`
            );

            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: VALIDATION_MESSAGES.INSUFFICIENT_PERMISSIONS
            });
        }

        next();
    };
}

/**
 * Store CSRF token in database
 */
async function storeCSRFToken(db, userId, token) {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.CSRF_TOKEN);

    await db.run(
        'INSERT INTO csrf_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        [token, userId, expiresAt]
    );
}

/**
 * Rotate session tokens on login
 */
async function rotateSessionTokens(db, userId, config, res) {
    // Delete old sessions for this user
    await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

    // Generate new tokens
    const user = await db.get('SELECT id, username, role FROM users WHERE id = ?', [userId]);

    const accessToken = generateAccessToken(
        { id: user.id, username: user.username, role: user.role },
        config.jwtSecret
    );

    const refreshToken = generateRefreshToken(
        { id: user.id },
        config.jwtRefreshSecret
    );

    const csrfToken = generateCSRFToken();

    // Store new session
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.SESSION_TIMEOUT);

    await db.run(
        'INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, accessToken, refreshToken, res.req.ip, res.req.headers['user-agent'], expiresAt]
    );

    // Store CSRF token
    await storeCSRFToken(db, user.id, csrfToken);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken, csrfToken);

    return { accessToken, refreshToken, csrfToken, user };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateCSRFToken,
    setAuthCookies,
    clearAuthCookies,
    authenticateToken,
    validateCSRF,
    authorize,
    storeCSRFToken,
    rotateSessionTokens
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const DOMPurify = require('isomorphic-dompurify');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database setup
let db;

async function initializeDatabase() {
    // Ensure database directory exists
    const dbDir = path.join(__dirname, '..', 'database');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = await open({
        filename: path.join(dbDir, 'security_demo.db'),
        driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'User',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            email_verified BOOLEAN DEFAULT 0,
            verification_token TEXT,
            reset_token TEXT,
            reset_token_expires DATETIME
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            refresh_token TEXT UNIQUE NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            ip_address TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS csrf_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS security_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            ip_address TEXT,
            user_id INTEGER,
            payload TEXT,
            blocked BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `);

    // Clean up expired sessions periodically
    setInterval(async () => {
        try {
            await db.run('DELETE FROM sessions WHERE expires_at < datetime("now")');
            await db.run('DELETE FROM csrf_tokens WHERE expires_at < datetime("now")');
        } catch (error) {
            console.error('Session cleanup error:', error);
        }
    }, 3600000); // Run every hour

    // Seed demo users if they don't exist
    const demoUsers = [
        { username: 'admin', email: 'admin@secure.com', password: 'admin123', role: 'Admin' },
        { username: 'moderator', email: 'mod@secure.com', password: 'mod123', role: 'Moderator' },
        { username: 'user', email: 'user@secure.com', password: 'user123', role: 'User' },
        { username: 'guest', email: 'guest@secure.com', password: 'guest123', role: 'Guest' }
    ];

    for (const user of demoUsers) {
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', user.username);
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await db.run(
                'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
                [user.username, user.email, hashedPassword, user.role, 1]
            );
        }
    }

    console.log('✅ Database initialized successfully');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Swagger documentation
if (NODE_ENV === 'development') {
    const swaggerPath = path.join(__dirname, '..', 'docs', 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = YAML.load(swaggerPath);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
}

// Rate limiting middleware
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', generalLimiter);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// IMPROVED Input sanitization middleware - only for specific fields
// const sanitizeInput = (req, res, next) => {
//     if (req.body) {
//         // Only sanitize fields that will be displayed as HTML
//         const fieldsToSanitize = ['description', 'comment', 'message', 'title', 'bio'];

//         Object.keys(req.body).forEach(key => {
//             if (fieldsToSanitize.includes(key) && typeof req.body[key] === 'string') {
//                 // Remove dangerous HTML but keep text content
//                 req.body[key] = DOMPurify.sanitize(req.body[key], { ALLOWED_TAGS: [] });
//             }
//         });
//     }
//     next();
// };

// Import security middleware (add this with other requires at top)
const { sanitizeInput, validateCSRF, securityHeaders, requestLogger } = require('./middleware/security');

// Import demo routes (add this with other route imports)
const demoRoutes = require('./routes/demo');

// Apply security middleware (add after other middleware)
app.use(securityHeaders);
app.use(requestLogger);

// Apply demo routes (add with other routes)
app.use('/api/demo', demoRoutes);

// CSRF token generation and validation
const generateCSRFToken = async (userId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.run(
        'INSERT INTO csrf_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        [token, userId, expiresAt]
    );

    return token;
};

const validateCSRFToken = async (token, userId) => {
    if (!token) return false;

    const result = await db.get(
        'SELECT * FROM csrf_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime("now")',
        [token, userId]
    );
    return !!result;
};

// JWT middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // Log activity
        await logActivity(decoded.id, 'API Access', 'success', req.ip);

        next();
    } catch (error) {
        await logActivity(null, 'Invalid token attempt', 'failed', req.ip);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Enhanced authentication middleware with CSRF validation for state-changing operations
const authenticateWithCSRF = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // For state-changing operations, validate CSRF token
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const validCSRF = await validateCSRFToken(csrfToken, decoded.id);
            if (!validCSRF) {
                await logSecurityEvent('CSRF_ATTEMPT', 'high', 'Invalid CSRF token', req.ip, decoded.id, null, true);
                return res.status(403).json({ error: 'Invalid CSRF token' });
            }
        }

        await logActivity(decoded.id, 'API Access', 'success', req.ip);
        next();
    } catch (error) {
        await logActivity(null, 'Invalid token attempt', 'failed', req.ip);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Role-based access control middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            logActivity(req.user.id, `Unauthorized access attempt to ${req.path}`, 'blocked', req.ip);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Activity logging function
async function logActivity(userId, action, status, ipAddress, details = null) {
    try {
        await db.run(
            'INSERT INTO activity_logs (user_id, action, status, ip_address, details) VALUES (?, ?, ?, ?, ?)',
            [userId, action, status, ipAddress, details]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Security event logging
async function logSecurityEvent(eventType, severity, description, ipAddress, userId = null, payload = null, blocked = false) {
    try {
        await db.run(
            'INSERT INTO security_events (event_type, severity, description, ip_address, user_id, payload, blocked) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [eventType, severity, description, ipAddress, userId, payload, blocked]
        );
    } catch (error) {
        console.error('Error logging security event:', error);
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Security Demo API is running' });
});

// Authentication routes
app.post('/api/auth/register', sanitizeInput, async (req, res) => {
    try {
        const { username, email, password, captchaAnswer } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Simple CAPTCHA validation (for demo)
        if (captchaAnswer !== '10') {
            await logSecurityEvent('CAPTCHA_FAILURE', 'low', 'Failed CAPTCHA during registration', req.ip);
            return res.status(400).json({ error: 'CAPTCHA validation failed' });
        }

        // Check if user exists
        const existingUser = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user (with parameterized query - SQL injection safe)
        const result = await db.run(
            'INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, verificationToken]
        );

        await logActivity(result.lastID, 'User registered', 'success', req.ip);

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            verificationToken // In production, send this via email
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Email verification endpoint (NEW)
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token required' });
        }

        const user = await db.get(
            'SELECT * FROM users WHERE verification_token = ?',
            [token]
        );

        if (!user) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        await db.run(
            'UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?',
            [user.id]
        );

        await logActivity(user.id, 'Email verified', 'success', req.ip);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user (parameterized query - SQL injection safe)
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            await logActivity(null, `Failed login attempt for username: ${username}`, 'failed', req.ip);
            await logSecurityEvent('LOGIN_FAILURE', 'medium', `Invalid username: ${username}`, req.ip);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            await logActivity(user.id, 'Failed login - incorrect password', 'failed', req.ip);
            await logSecurityEvent('LOGIN_FAILURE', 'medium', 'Invalid password', req.ip, user.id);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Store session
        await db.run(
            'INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, accessToken, refreshToken, req.ip, req.headers['user-agent'], new Date(Date.now() + 3600000)]
        );

        // Generate CSRF token
        const csrfToken = await generateCSRFToken(user.id);

        await logActivity(user.id, 'User logged in', 'success', req.ip);

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            csrfToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Check if session exists
        const session = await db.get(
            'SELECT * FROM sessions WHERE refresh_token = ? AND user_id = ?',
            [refreshToken, decoded.id]
        );

        if (!session) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Get user
        const user = await db.get('SELECT * FROM users WHERE id = ?', decoded.id);

        // Generate new access token
        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Update session
        await db.run(
            'UPDATE sessions SET token = ?, expires_at = ? WHERE id = ?',
            [accessToken, new Date(Date.now() + 3600000), session.id]
        );

        res.json({ accessToken });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // Remove session
        await db.run('DELETE FROM sessions WHERE user_id = ?', req.user.id);
        // Remove CSRF tokens
        await db.run('DELETE FROM csrf_tokens WHERE user_id = ?', req.user.id);
        await logActivity(req.user.id, 'User logged out', 'success', req.ip);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, username, email, role, created_at, email_verified FROM users WHERE id = ?',
            req.user.id
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.get('/api/users', authenticateToken, authorize(['Admin', 'Moderator']), async (req, res) => {
    try {
        const users = await db.all(
            'SELECT id, username, email, role, created_at, email_verified FROM users'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Activity logs
app.get('/api/activity', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM activity_logs';
        let params = [];

        // Users can only see their own logs, admins can see all
        if (req.user.role !== 'Admin') {
            query += ' WHERE user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const logs = await db.all(query, params);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// Security events (Admin only)
app.get('/api/security-events', authenticateToken, authorize(['Admin']), async (req, res) => {
    try {
        const events = await db.all(
            'SELECT * FROM security_events ORDER BY created_at DESC LIMIT 100'
        );
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch security events' });
    }
});

// Security statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM security_events WHERE blocked = 1) as attacks_blocked,
                (SELECT COUNT(*) FROM activity_logs WHERE action LIKE '%logged in%' AND status = 'success') as successful_logins,
                (SELECT COUNT(*) FROM activity_logs WHERE action LIKE '%login%' AND status = 'failed') as failed_logins,
                (SELECT COUNT(*) FROM users) as total_users
        `);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Vulnerability demonstration endpoints (with toggleable security)
// These are intentionally vulnerable for demonstration purposes
app.post('/api/demo/xss', async (req, res) => {
    const { input, protection } = req.body;

    let result = {
        original: input,
        processed: input,
        vulnerable: false,
        message: 'Input processed safely'
    };

    if (protection) {
        // Sanitize input to prevent XSS
        result.processed = DOMPurify.sanitize(input);
        if (result.processed !== input) {
            await logSecurityEvent('XSS_ATTEMPT', 'high', 'XSS attack blocked', req.ip, req.user?.id, input, true);
            result.message = 'XSS attack detected and blocked!';
        }
    } else {
        // Vulnerable mode - would render unsanitized
        if (input.includes('<script>') || input.includes('onerror=')) {
            result.vulnerable = true;
            result.message = 'XSS vulnerability exploited! Script would execute!';
            await logSecurityEvent('XSS_ATTEMPT', 'high', 'XSS attack successful (demo mode)', req.ip, req.user?.id, input, false);
        }
    }

    res.json(result);
});

app.post('/api/demo/sql', async (req, res) => {
    const { input, protection } = req.body;

    let result = {
        query: '',
        vulnerable: false,
        message: 'Query executed safely'
    };

    if (protection) {
        // Parameterized query (safe)
        result.query = `SELECT * FROM users WHERE username = ?`;
        result.message = 'Parameterized query prevents SQL injection';
    } else {
        // Vulnerable concatenated query
        result.query = `SELECT * FROM users WHERE username = '${input}'`;

        // Check for SQL injection patterns
        const injectionPatterns = [
            /('|")\s*OR\s*('|")1('|")=('|")1/gi,
            /;\s*DROP\s+TABLE/gi,
            /UNION\s+SELECT/gi,
            /--$/
        ];

        for (let pattern of injectionPatterns) {
            if (pattern.test(input)) {
                result.vulnerable = true;
                result.message = 'SQL Injection successful! Database compromised!';
                await logSecurityEvent('SQL_INJECTION', 'critical', 'SQL injection successful (demo mode)', req.ip, req.user?.id, input, false);
                break;
            }
        }
    }

    res.json(result);
});

app.post('/api/demo/csrf', authenticateToken, async (req, res) => {
    const { csrfToken, protection } = req.body;

    let result = {
        vulnerable: false,
        message: 'CSRF token validated successfully'
    };

    if (protection) {
        // Validate CSRF token
        const valid = await validateCSRFToken(csrfToken, req.user.id);
        if (!valid) {
            result.vulnerable = true;
            result.message = 'Invalid CSRF token! Request blocked!';
            await logSecurityEvent('CSRF_ATTEMPT', 'high', 'CSRF attack blocked', req.ip, req.user.id, null, true);
            return res.status(403).json(result);
        }
    } else {
        // Vulnerable mode - no CSRF protection
        result.vulnerable = true;
        result.message = 'No CSRF protection! Forged request would succeed!';
        await logSecurityEvent('CSRF_ATTEMPT', 'high', 'CSRF attack successful (demo mode)', req.ip, req.user?.id, null, false);
    }

    res.json(result);
});

app.post('/api/demo/path-traversal', async (req, res) => {
    const { path, protection } = req.body;

    let result = {
        requestedPath: path,
        vulnerable: false,
        message: 'Path validated successfully'
    };

    if (protection) {
        // Validate and sanitize path
        if (path.includes('../') || path.includes('..\\')) {
            result.message = 'Path traversal attempt blocked!';
            await logSecurityEvent('PATH_TRAVERSAL', 'high', 'Path traversal blocked', req.ip, req.user?.id, path, true);
            return res.status(403).json(result);
        }
    } else {
        // Vulnerable mode
        if (path.includes('../') || path.includes('..\\')) {
            result.vulnerable = true;
            result.message = 'Path traversal successful! System files exposed!';
            await logSecurityEvent('PATH_TRAVERSAL', 'high', 'Path traversal successful (demo mode)', req.ip, req.user?.id, path, false);
        }
    }

    res.json(result);
});

// Serve React app for all other routes in production
if (NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Log error as security event if it looks suspicious
    if (err.message && (err.message.includes('injection') || err.message.includes('attack'))) {
        logSecurityEvent('ERROR', 'medium', err.message, req.ip, req.user?.id);
    }

    res.status(500).json({
        error: NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Security Demo API running on port ${PORT}`);
            console.log(`📊 Environment: ${NODE_ENV}`);
            console.log(`🔐 Security features enabled`);
            console.log(`\n   Available endpoints:`);
            console.log(`   - POST /api/auth/register`);
            console.log(`   - POST /api/auth/verify-email`);
            console.log(`   - POST /api/auth/login`);
            console.log(`   - POST /api/auth/refresh`);
            console.log(`   - POST /api/auth/logout`);
            console.log(`   - GET  /api/users/profile`);
            console.log(`   - GET  /api/activity`);
            console.log(`   - GET  /api/stats`);
            console.log(`   - POST /api/demo/xss`);
            console.log(`   - POST /api/demo/sql`);
            console.log(`   - POST /api/demo/csrf`);
            console.log(`   - POST /api/demo/path-traversal`);
            if (NODE_ENV === 'development') {
                console.log(`   - GET  /api-docs (Swagger UI)`);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
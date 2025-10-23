# Before/After Code Comparison

Visual examples of the major security fixes.

---

## 1. Token Storage

### ❌ BEFORE (Insecure - localStorage)

```javascript
// client/src/contexts/AuthContext.jsx
const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
    });

    const { accessToken, refreshToken } = response.data;

    // 🚨 XSS VULNERABILITY: Any XSS can steal these!
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setToken(accessToken);
    return { success: true };
};
```

### ✅ AFTER (Secure - httpOnly Cookies)

```javascript
// client/src/contexts/AuthContext-fixed.jsx
const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
    });

    // ✅ Tokens are set as httpOnly cookies by server
    // ✅ JavaScript cannot access them (XSS protection)
    // ✅ Automatically sent with requests

    const { user, csrfToken } = response.data;
    setCsrfToken(csrfToken); // Only CSRF token is readable
    setUser(user);

    return { success: true };
};

// server/middleware/auth.js
function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,      // ✅ JavaScript cannot read
        secure: true,        // ✅ HTTPS only in production
        sameSite: 'strict',  // ✅ CSRF protection
        maxAge: 15 * 60 * 1000
    });
    // ... same for refreshToken
}
```

---

## 2. Environment Secrets

### ❌ BEFORE (Dangerous Defaults)

```javascript
// server/index.js
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

// 🚨 If .env is missing, uses predictable secrets!
// 🚨 Anyone can generate valid tokens
```

### ✅ AFTER (Fail-Safe)

```javascript
// server/config/env-validator.js
function validateEnvironment() {
    const missing = [];

    for (const varName of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
        if (!process.env[varName]) {
            missing.push(varName);
        } else if (isInsecureSecret(process.env[varName])) {
            throw new Error(`Insecure secret: ${varName}`);
        }
    }

    if (missing.length > 0) {
        // ✅ Server refuses to start!
        throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
}

// ✅ Check if secret is too weak
function isInsecureSecret(value) {
    return value.length < 32 || /secret|change|default/i.test(value);
}
```

---

## 3. CSRF Protection

### ❌ BEFORE (Fake Protection)

```javascript
// server/routes/demo.js
router.post('/csrf', (req, res) => {
    const { csrfToken, protection } = req.body;

    if (protection) {
        const validToken = 'valid-csrf-token-123456'; // 🚨 Hardcoded!

        if (csrfToken !== validToken) {
            // This doesn't protect anything
        }
    }
});

// Client never sends CSRF tokens anyway!
```

### ✅ AFTER (Real Protection)

```javascript
// server/middleware/auth.js
function validateCSRF(db, logSecurityEvent) {
    return async (req, res, next) => {
        // Skip for read-only operations
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }

        const csrfToken = req.headers['x-csrf-token'];

        if (!csrfToken) {
            await logSecurityEvent(/*...*/);
            return res.status(403).json({ error: 'CSRF token required' });
        }

        // ✅ Validate against database
        const validToken = await db.get(
            'SELECT * FROM csrf_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime("now")',
            [csrfToken, req.user.id]
        );

        if (!validToken) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        next();
    };
}

// client/src/services/api-fixed.js
api.interceptors.request.use(config => {
    // ✅ Automatically adds CSRF token to requests
    if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return config;
});
```

---

## 4. Input Validation

### ❌ BEFORE (Minimal)

```javascript
// server/index.js
app.post('/api/auth/register', async (req, res) => {
    const { password } = req.body;

    // 🚨 Only checks length!
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password too short' });
    }

    // Accepts "password123" - terrible!
});
```

### ✅ AFTER (Comprehensive)

```javascript
// server/middleware/validation.js
function isValidPassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }

    const requirements = [];

    // ✅ Check uppercase
    if (!/[A-Z]/.test(password)) {
        requirements.push('one uppercase letter');
    }

    // ✅ Check lowercase
    if (!/[a-z]/.test(password)) {
        requirements.push('one lowercase letter');
    }

    // ✅ Check number
    if (!/\d/.test(password)) {
        requirements.push('one number');
    }

    // ✅ Check special char
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        requirements.push('one special character');
    }

    // ✅ Check against common passwords
    const weakPasswords = [
        'password', 'password123', '12345678', 'qwerty'
    ];

    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        return { valid: false, message: 'Password is too common' };
    }

    if (requirements.length > 0) {
        return {
            valid: false,
            message: `Password must contain: ${requirements.join(', ')}`
        };
    }

    return { valid: true };
}
```

---

## 5. Architecture

### ❌ BEFORE (Monolithic)

```javascript
// server/index.js - ONE FILE WITH EVERYTHING
const app = express();

// Middleware setup
// Database initialization
// Helper functions
// Authentication logic
// Route handlers
// Error handling
// Server startup

// 823 lines of mixed concerns! 😱
```

### ✅ AFTER (Layered)

```
server/
├── config/
│   └── env-validator.js          # ✅ Configuration
├── constants.js                   # ✅ Shared constants
├── middleware/
│   ├── auth.js                    # ✅ Authentication
│   ├── validation.js              # ✅ Input validation
│   ├── error-handler.js           # ✅ Error handling
│   └── security.js                # ✅ Security headers
├── services/
│   ├── database.js                # ✅ Data access
│   └── logging.js                 # ✅ Logging
├── controllers/
│   └── auth.controller.js         # ✅ Business logic
├── routes/
│   └── auth.routes.js             # ✅ Route definitions
└── index-refactored.js            # ✅ App composition

Each file has ONE responsibility!
```

---

## 6. Error Handling

### ❌ BEFORE (Inconsistent)

```javascript
// server/index.js
app.post('/api/auth/login', async (req, res) => {
    try {
        // ... logic
    } catch (error) {
        console.error('Login error:', error);

        // 🚨 Exposes internal errors
        res.status(500).json({ error: 'Login failed' });
    }
});

// Errors handled differently everywhere
```

### ✅ AFTER (Centralized)

```javascript
// server/middleware/error-handler.js
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401); // ✅ Proper HTTP status
    }
}

function sendErrorResponse(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const errorResponse = {
        error: err.message
    };

    // ✅ Don't expose internals in production
    if (isProduction && !err.isOperational) {
        errorResponse.error = 'Internal server error';
    }

    // ✅ Stack traces only in development
    if (!isProduction) {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
}

// Usage in controller
async login(req, res) {
    if (!user) {
        // ✅ Throw proper error
        throw new AuthenticationError('Invalid credentials');
    }
}
```

---

## 7. Session Management

### ❌ BEFORE (No Rotation)

```javascript
// server/index.js
app.post('/api/auth/login', async (req, res) => {
    // ... verify password ...

    // Generate token
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // 🚨 No cleanup of old sessions
    // 🚨 Session fixation vulnerability
    await db.run(
        'INSERT INTO sessions (user_id, token, ...) VALUES (?, ?, ...)',
        [user.id, accessToken, ...]
    );
});
```

### ✅ AFTER (With Rotation)

```javascript
// server/middleware/auth.js
async function rotateSessionTokens(db, userId, config, res) {
    // ✅ Delete ALL old sessions for this user
    await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

    // ✅ Generate NEW tokens
    const accessToken = generateAccessToken(/*...*/);
    const refreshToken = generateRefreshToken(/*...*/);
    const csrfToken = generateCSRFToken();

    // ✅ Store new session
    await db.run(
        'INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [/*...*/]
    );

    // ✅ Store CSRF token
    await storeCSRFToken(db, userId, csrfToken);

    // ✅ Set cookies
    setAuthCookies(res, accessToken, refreshToken, csrfToken);

    return { accessToken, refreshToken, csrfToken, user };
}
```

---

## 8. Database Performance

### ❌ BEFORE (No Indexes)

```sql
-- server/index.js
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    -- ... other fields
);

-- 🚨 Queries on username/email will be SLOW!
-- 🚨 No indexes except primary key
```

### ✅ AFTER (With Indexes)

```javascript
// server/services/database.js
async createIndexes() {
    await this.db.exec(`
        -- ✅ Optimize user lookups
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

        -- ✅ Optimize session queries
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

        -- ✅ Optimize activity log queries
        CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs(user_id);

        -- ... and more
    `);
}
```

---

## 9. Account Protection

### ❌ BEFORE (No Protection)

```javascript
// server/index.js
app.post('/api/auth/login', async (req, res) => {
    // ... verify password ...

    if (!validPassword) {
        // 🚨 Unlimited attempts allowed!
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});
```

### ✅ AFTER (Lockout Protection)

```javascript
// server/controllers/auth.controller.js
async login(req, res) {
    const { username, password } = req.body;

    // ✅ Check for brute force
    const suspiciousActivity = await this.logger.checkSuspiciousActivity(req.ip);
    if (suspiciousActivity.isSuspicious) {
        throw new AuthenticationError('Too many failed attempts');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        // ✅ Increment failed attempts
        await this.db.run(
            'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
            [user.id]
        );

        // ✅ Lock after 5 failed attempts
        if (user.failed_login_attempts + 1 >= 5) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            await this.db.run(
                'UPDATE users SET account_locked_until = ? WHERE id = ?',
                [lockUntil, user.id]
            );
        }

        throw new AuthenticationError('Invalid credentials');
    }

    // ✅ Reset on successful login
    await this.db.run(
        'UPDATE users SET failed_login_attempts = 0 WHERE id = ?',
        [user.id]
    );
}
```

---

## 10. Graceful Shutdown

### ❌ BEFORE (No Cleanup)

```javascript
// server/index.js
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// 🚨 If SIGTERM/SIGINT received:
// - Database connections left open
// - Active requests aborted
// - No cleanup
```

### ✅ AFTER (Proper Shutdown)

```javascript
// server/middleware/error-handler.js
function setupGracefulShutdown(server, db) {
    const shutdown = async (signal) => {
        console.log(`${signal} received. Starting graceful shutdown...`);

        // ✅ Stop accepting new connections
        server.close(async () => {
            console.log('HTTP server closed');

            try {
                // ✅ Close database
                if (db) {
                    await db.close();
                }

                console.log('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        });

        // ✅ Force shutdown after timeout
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Lines of Code** | 823 (monolith) | ~150 per file (modular) |
| **Token Storage** | localStorage | httpOnly cookies |
| **CSRF Protection** | Fake | Real |
| **Validation** | Minimal | Comprehensive |
| **Error Handling** | Scattered | Centralized |
| **Architecture** | Monolithic | Layered |
| **Database** | No indexes | 20+ indexes |
| **Secrets** | Hardcoded defaults | Required & validated |
| **Session Security** | No rotation | Full rotation |
| **Account Protection** | None | Lockout after 5 attempts |
| **Shutdown** | Abrupt | Graceful |
| **Production Ready** | ❌ No | ✅ Much closer |

---

**The refactored codebase is production-ready (with PostgreSQL swap), secure, maintainable, and follows industry best practices.**

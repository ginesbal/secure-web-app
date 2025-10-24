// server/constants.js - Centralized constants to eliminate magic strings

const USER_ROLES = {
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    USER: 'User',
    GUEST: 'Guest'
};

const ACTIVITY_STATUS = {
    SUCCESS: 'success',
    FAILED: 'failed',
    BLOCKED: 'blocked'
};

const SECURITY_EVENT_TYPES = {
    XSS_ATTEMPT: 'XSS_ATTEMPT',
    SQL_INJECTION: 'SQL_INJECTION',
    CSRF_ATTEMPT: 'CSRF_ATTEMPT',
    PATH_TRAVERSAL: 'PATH_TRAVERSAL',
    BRUTE_FORCE: 'BRUTE_FORCE',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    CAPTCHA_FAILURE: 'CAPTCHA_FAILURE',
    INVALID_TOKEN: 'INVALID_TOKEN',
    ERROR: 'ERROR'
};

const SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
};

const TOKEN_EXPIRY = {
    ACCESS_TOKEN: '15m',      // 15 minutes for access token
    REFRESH_TOKEN: '7d',      // 7 days for refresh token
    CSRF_TOKEN: 3600000,      // 1 hour in milliseconds
    SESSION_TIMEOUT: 3600000  // 1 hour in milliseconds
};

const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
};

const RATE_LIMITS = {
    LOGIN: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 5
    },
    GENERAL: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 100
    },
    REGISTRATION: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3
    }
};

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const VALIDATION_MESSAGES = {
    REQUIRED_FIELDS: 'All required fields must be provided',
    INVALID_EMAIL: 'Invalid email format',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    USERNAME_INVALID: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
    CAPTCHA_FAILED: 'CAPTCHA validation failed',
    USER_EXISTS: 'Username or email already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_REQUIRED: 'Authentication token required',
    INVALID_TOKEN: 'Invalid or expired token',
    CSRF_TOKEN_REQUIRED: 'CSRF token required',
    INVALID_CSRF: 'Invalid CSRF token',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
};

module.exports = {
    USER_ROLES,
    ACTIVITY_STATUS,
    SECURITY_EVENT_TYPES,
    SEVERITY_LEVELS,
    HTTP_STATUS,
    TOKEN_EXPIRY,
    PASSWORD_REQUIREMENTS,
    RATE_LIMITS,
    COOKIE_OPTIONS,
    VALIDATION_MESSAGES
};

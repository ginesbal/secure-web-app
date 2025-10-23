// server/middleware/validation.js - Comprehensive input validation

const validator = require('validator');
const { PASSWORD_REQUIREMENTS, VALIDATION_MESSAGES, HTTP_STATUS } = require('../constants');

/**
 * Validation error class
 */
class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.statusCode = HTTP_STATUS.BAD_REQUEST;
    }
}

/**
 * Validate username format
 */
function isValidUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // 3-30 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'Password is required' };
    }

    if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
        return {
            valid: false,
            message: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`
        };
    }

    if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
        return {
            valid: false,
            message: `Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`
        };
    }

    const requirements = [];

    if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        requirements.push('one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        requirements.push('one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
        requirements.push('one number');
    }

    if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        requirements.push('one special character');
    }

    if (requirements.length > 0) {
        return {
            valid: false,
            message: `Password must contain at least ${requirements.join(', ')}`
        };
    }

    // Check against common weak passwords
    const weakPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'letmein', 'monkey', '1234567890', 'password1', 'admin123'
    ];

    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        return {
            valid: false,
            message: 'Password is too common. Please choose a stronger password'
        };
    }

    return { valid: true };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    return email && validator.isEmail(email);
}

/**
 * Sanitize string input
 */
function sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
        return '';
    }

    // Trim whitespace
    let sanitized = input.trim();

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized;
}

/**
 * Middleware: Validate registration input
 */
const validateRegistration = (req, res, next) => {
    try {
        const { username, email, password, captchaAnswer } = req.body;

        // Check required fields
        if (!username || !email || !password) {
            throw new ValidationError(VALIDATION_MESSAGES.REQUIRED_FIELDS);
        }

        // Validate username
        if (!isValidUsername(username)) {
            throw new ValidationError(VALIDATION_MESSAGES.USERNAME_INVALID, 'username');
        }

        // Validate email
        if (!isValidEmail(email)) {
            throw new ValidationError(VALIDATION_MESSAGES.INVALID_EMAIL, 'email');
        }

        // Validate password
        const passwordCheck = isValidPassword(password);
        if (!passwordCheck.valid) {
            throw new ValidationError(passwordCheck.message, 'password');
        }

        // Validate CAPTCHA (basic check - in production use real CAPTCHA)
        if (!captchaAnswer || captchaAnswer !== '10') {
            throw new ValidationError(VALIDATION_MESSAGES.CAPTCHA_FAILED, 'captchaAnswer');
        }

        // Sanitize inputs
        req.body.username = sanitizeString(username, 30);
        req.body.email = validator.normalizeEmail(email);

        next();
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(error.statusCode).json({
                error: error.message,
                field: error.field
            });
        }
        next(error);
    }
};

/**
 * Middleware: Validate login input
 */
const validateLogin = (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new ValidationError(VALIDATION_MESSAGES.REQUIRED_FIELDS);
        }

        // Sanitize username (could be email or username)
        req.body.username = sanitizeString(username, 255);

        next();
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(error.statusCode).json({
                error: error.message,
                field: error.field
            });
        }
        next(error);
    }
};

/**
 * Middleware: Validate general input fields
 */
const validateInput = (allowedFields = []) => {
    return (req, res, next) => {
        try {
            if (!req.body) {
                return next();
            }

            // Remove any fields not in allowedFields
            if (allowedFields.length > 0) {
                const sanitized = {};
                for (const field of allowedFields) {
                    if (req.body[field] !== undefined) {
                        sanitized[field] = req.body[field];
                    }
                }
                req.body = sanitized;
            }

            // Sanitize string fields
            for (const [key, value] of Object.entries(req.body)) {
                if (typeof value === 'string') {
                    req.body[key] = sanitizeString(value);
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate query parameters
 */
const validateQueryParams = (allowedParams = []) => {
    return (req, res, next) => {
        try {
            const sanitized = {};

            for (const param of allowedParams) {
                if (req.query[param] !== undefined) {
                    const value = req.query[param];

                    if (typeof value === 'string') {
                        sanitized[param] = sanitizeString(value, 100);
                    } else {
                        sanitized[param] = value;
                    }
                }
            }

            req.query = sanitized;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    ValidationError,
    isValidUsername,
    isValidPassword,
    isValidEmail,
    sanitizeString,
    validateRegistration,
    validateLogin,
    validateInput,
    validateQueryParams
};

// server/config/env-validator.js - Validate environment variables on startup

const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
];

const optionalEnvVars = {
    PORT: '3001',
    CLIENT_URL: 'http://localhost:3000',
    DATABASE_PATH: './database/security_demo.db',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '100',
    BCRYPT_ROUNDS: '10',
    SESSION_TIMEOUT_HOURS: '1'
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required variable is missing
 */
function validateEnvironment() {
    const missing = [];
    const insecure = [];

    // Check required variables
    for (const varName of requiredEnvVars) {
        const value = process.env[varName];

        if (!value) {
            missing.push(varName);
        } else {
            // Check for insecure default values
            if (varName.includes('SECRET') && isInsecureSecret(value)) {
                insecure.push(varName);
            }
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `CRITICAL: Missing required environment variables: ${missing.join(', ')}\n` +
            `Please set these variables in your .env file or environment.\n` +
            `See .env.example for reference.`
        );
    }

    if (insecure.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(
            `CRITICAL: Insecure secrets detected in production: ${insecure.join(', ')}\n` +
            `These variables contain default or weak values that must be changed before deployment.\n` +
            `Use a secure random generator: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
        );
    }

    // Warn about insecure secrets in development
    if (insecure.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn(
            `\n⚠️  WARNING: Insecure secrets detected: ${insecure.join(', ')}\n` +
            `   These are acceptable for development but MUST be changed for production.\n`
        );
    }

    // Set optional variables with defaults
    for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[varName]) {
            process.env[varName] = defaultValue;
        }
    }

    console.log('✅ Environment validation passed');
}

/**
 * Check if a secret value is insecure (default, weak, or predictable)
 */
function isInsecureSecret(value) {
    const insecurePatterns = [
        /secret/i,
        /change/i,
        /example/i,
        /default/i,
        /password/i,
        /test/i,
        /demo/i,
        /your-/i,
        /replace/i
    ];

    // Check if too short
    if (value.length < 32) {
        return true;
    }

    // Check against common insecure patterns
    return insecurePatterns.some(pattern => pattern.test(value));
}

/**
 * Get validated config object
 */
function getConfig() {
    return {
        nodeEnv: process.env.NODE_ENV,
        port: parseInt(process.env.PORT, 10),
        clientUrl: process.env.CLIENT_URL,
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        databasePath: process.env.DATABASE_PATH,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
        sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS, 10),
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
        }
    };
}

module.exports = {
    validateEnvironment,
    getConfig
};

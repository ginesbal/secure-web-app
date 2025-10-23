// server/middleware/error-handler.js - Centralized error handling

const { HTTP_STATUS } = require('../constants');

/**
 * Custom error classes
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, HTTP_STATUS.BAD_REQUEST);
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, HTTP_STATUS.CONFLICT);
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
    }
}

/**
 * Error logging middleware
 */
function logError(err, req, res, next) {
    // Log error details
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        user: req.user?.username || 'anonymous',
        error: {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode || HTTP_STATUS.SERVER_ERROR
        }
    };

    // Only log stack traces for non-operational errors
    if (!err.isOperational) {
        errorLog.stack = err.stack;
        console.error('[ERROR - NON-OPERATIONAL]', JSON.stringify(errorLog, null, 2));
    } else {
        console.error('[ERROR]', JSON.stringify(errorLog, null, 2));
    }

    next(err);
}

/**
 * Error response middleware
 */
function sendErrorResponse(err, req, res, next) {
    const statusCode = err.statusCode || HTTP_STATUS.SERVER_ERROR;
    const isProduction = process.env.NODE_ENV === 'production';

    // Base error response
    const errorResponse = {
        error: err.message || 'Internal server error',
        statusCode
    };

    // Add field information for validation errors
    if (err.field) {
        errorResponse.field = err.field;
    }

    // Add stack trace in development mode
    if (!isProduction && err.stack) {
        errorResponse.stack = err.stack;
    }

    // Add error type
    if (!isProduction) {
        errorResponse.type = err.name;
    }

    // Don't expose internal errors in production
    if (isProduction && !err.isOperational) {
        errorResponse.error = 'Internal server error';
        errorResponse.message = 'An unexpected error occurred. Please try again later.';
    }

    res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
    const error = new NotFoundError(
        `Route not found: ${req.method} ${req.originalUrl}`
    );
    next(error);
}

/**
 * Unhandled rejection handler
 */
function handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[UNHANDLED REJECTION]', {
            timestamp: new Date().toISOString(),
            reason: reason,
            promise: promise
        });

        // In production, you might want to:
        // 1. Log to external service
        // 2. Send alert
        // 3. Gracefully shutdown if critical
    });
}

/**
 * Uncaught exception handler
 */
function handleUncaughtException() {
    process.on('uncaughtException', (error) => {
        console.error('[UNCAUGHT EXCEPTION]', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });

        // Gracefully shutdown
        console.error('Shutting down due to uncaught exception...');
        process.exit(1);
    });
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server, db) {
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);

        // Stop accepting new connections
        server.close(async () => {
            console.log('HTTP server closed');

            try {
                // Close database connection
                if (db) {
                    await db.close();
                }

                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        });

        // Force shutdown after timeout
        setTimeout(() => {
            console.error('❌ Forced shutdown after timeout');
            process.exit(1);
        }, 30000); // 30 seconds
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
    // Error classes
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,

    // Middleware
    logError,
    sendErrorResponse,
    asyncHandler,
    notFoundHandler,

    // Process handlers
    handleUnhandledRejection,
    handleUncaughtException,
    setupGracefulShutdown
};

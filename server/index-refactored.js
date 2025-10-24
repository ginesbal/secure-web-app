// server/index-refactored.js - Refactored server with proper architecture
// This is the FIXED version - rename to index.js to use it

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Import configuration and validation
const { validateEnvironment, getConfig } = require('./config/env-validator');
const { HTTP_STATUS } = require('./constants');

// Import services
const DatabaseService = require('./services/database');
const LoggingService = require('./services/logging');

// Import middleware
const { sanitizeInput } = require('./middleware/security');
const { authenticateToken, validateCSRF } = require('./middleware/auth');
const {
    logError,
    sendErrorResponse,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException,
    setupGracefulShutdown
} = require('./middleware/error-handler');

// Import controllers
const AuthController = require('./controllers/auth.controller');

// Import routes
const setupAuthRoutes = require('./routes/auth.routes');
const demoRoutes = require('./routes/demo');

// Validate environment before starting
try {
    validateEnvironment();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

// Get validated configuration
const config = getConfig();

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (REQUIRED for httpOnly cookies)
app.use(cookieParser());

// CORS configuration
app.use(cors({
    origin: config.clientUrl,
    credentials: true, // REQUIRED for cookies
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Serve static files in production
if (config.nodeEnv === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// Swagger documentation (development only)
if (config.nodeEnv === 'development') {
    const swaggerPath = path.join(__dirname, '..', 'docs', 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = YAML.load(swaggerPath);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        console.log('📚 Swagger documentation available at /api-docs');
    }
}

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing Secure Web App...\n');

        // Initialize database
        const dbService = new DatabaseService(config);
        const db = await dbService.initialize();

        // Initialize logging service
        const loggingService = new LoggingService(db);

        // Initialize controllers
        const authController = new AuthController(db, config, loggingService);

        // Create middleware instances with dependencies
        const authenticateTokenMiddleware = authenticateToken(
            db,
            config,
            loggingService.logActivity.bind(loggingService)
        );

        const validateCSRFMiddleware = validateCSRF(
            db,
            loggingService.logSecurityEvent.bind(loggingService)
        );

        // Apply global middleware
        app.use(sanitizeInput);
        app.use(validateCSRFMiddleware);

        // Setup routes
        app.use('/api/auth', setupAuthRoutes(authController, authenticateTokenMiddleware));
        app.use('/api/demo', demoRoutes);

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.status(HTTP_STATUS.OK).json({
                status: 'OK',
                message: 'Security Demo API is running',
                timestamp: new Date().toISOString(),
                environment: config.nodeEnv
            });
        });

        // Serve React app for all other routes in production
        if (config.nodeEnv === 'production') {
            app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
            });
        }

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(logError);
        app.use(sendErrorResponse);

        // Start server
        const server = app.listen(config.port, () => {
            console.log('\n✅ Server started successfully!\n');
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📊 Environment: ${config.nodeEnv}`);
            console.log(`🔐 Security features enabled`);
            console.log(`🍪 httpOnly cookies: ENABLED`);
            console.log(`🛡️  CSRF protection: ENABLED`);
            console.log(`🔒 Rate limiting: ENABLED`);
            console.log(`\n📍 Available endpoints:`);
            console.log(`   - POST   /api/auth/register`);
            console.log(`   - POST   /api/auth/verify-email`);
            console.log(`   - POST   /api/auth/login`);
            console.log(`   - POST   /api/auth/refresh`);
            console.log(`   - POST   /api/auth/logout`);
            console.log(`   - GET    /api/auth/profile`);
            console.log(`   - GET    /api/health`);
            console.log(`   - POST   /api/demo/xss`);
            console.log(`   - POST   /api/demo/sql`);
            console.log(`   - POST   /api/demo/csrf`);
            console.log(`   - POST   /api/demo/path-traversal`);

            if (config.nodeEnv === 'development') {
                console.log(`\n📚 Documentation:`);
                console.log(`   - Swagger UI: http://localhost:${config.port}/api-docs`);
            }

            console.log('\n');
        });

        // Setup graceful shutdown
        setupGracefulShutdown(server, dbService);

        return server;
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
}

// Start the application
if (require.main === module) {
    initializeApp();
}

module.exports = app;

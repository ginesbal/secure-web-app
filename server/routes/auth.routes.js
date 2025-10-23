// server/routes/auth.routes.js - Authentication routes

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../constants');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/error-handler');

/**
 * Setup authentication routes
 * @param {Object} authController - Authentication controller instance
 * @param {Function} authenticateToken - Authentication middleware
 * @returns {express.Router}
 */
function setupAuthRoutes(authController, authenticateToken) {
    // Rate limiters
    const loginLimiter = rateLimit({
        windowMs: RATE_LIMITS.LOGIN.WINDOW_MS,
        max: RATE_LIMITS.LOGIN.MAX_REQUESTS,
        message: 'Too many login attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    });

    const registerLimiter = rateLimit({
        windowMs: RATE_LIMITS.REGISTRATION.WINDOW_MS,
        max: RATE_LIMITS.REGISTRATION.MAX_REQUESTS,
        message: 'Too many registration attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
    });

    // Public routes
    router.post(
        '/register',
        registerLimiter,
        validateRegistration,
        asyncHandler((req, res) => authController.register(req, res))
    );

    router.post(
        '/verify-email',
        asyncHandler((req, res) => authController.verifyEmail(req, res))
    );

    router.post(
        '/login',
        loginLimiter,
        validateLogin,
        asyncHandler((req, res) => authController.login(req, res))
    );

    router.post(
        '/refresh',
        asyncHandler((req, res) => authController.refreshToken(req, res))
    );

    // Protected routes
    router.post(
        '/logout',
        authenticateToken,
        asyncHandler((req, res) => authController.logout(req, res))
    );

    router.get(
        '/profile',
        authenticateToken,
        asyncHandler((req, res) => authController.getProfile(req, res))
    );

    return router;
}

module.exports = setupAuthRoutes;

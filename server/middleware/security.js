const DOMPurify = require('isomorphic-dompurify');
const crypto = require('crypto');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        const fieldsToSanitize = ['description', 'comment', 'message', 'title', 'bio'];
        
        Object.keys(req.body).forEach(key => {
            if (fieldsToSanitize.includes(key) && typeof req.body[key] === 'string') {
                req.body[key] = DOMPurify.sanitize(req.body[key], { ALLOWED_TAGS: [] });
            }
        });
    }
    next();
};

// CSRF token validation
const validateCSRF = async (req, res, next) => {
    // Skip CSRF for GET requests and API demo endpoints
    if (req.method === 'GET' || req.path.includes('/demo/')) {
        return next();
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.headers['x-csrf-token'] || req.body.csrfToken;
        
        // For demo purposes, check if token exists
        if (!token && req.path !== '/api/auth/login' && req.path !== '/api/auth/register') {
            return res.status(403).json({ 
                error: 'CSRF token required',
                message: 'This request requires a valid CSRF token for security' 
            });
        }
    }
    next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:;"
    );
    next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    next();
};

module.exports = {
    sanitizeInput,
    validateCSRF,
    securityHeaders,
    requestLogger
};
#!/usr/bin/env node
// setup-secure-env.js - Generate secure environment configuration

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Secure Web App - Environment Setup\n');

// Generate secure secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

// Create .env content
const envContent = `# Server Configuration
NODE_ENV=development
PORT=3001

# Client URL (update for production)
CLIENT_URL=http://localhost:3000

# JWT Secrets - GENERATED SECURELY
# DO NOT COMMIT THESE TO GIT!
# Regenerate for production deployment
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}

# Database
DATABASE_PATH=./database/security_demo.db

# Security Settings
BCRYPT_ROUNDS=10
SESSION_TIMEOUT_HOURS=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional - configure when needed)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# CAPTCHA (Optional - configure when needed)
# RECAPTCHA_SITE_KEY=your-recaptcha-site-key
# RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
`;

// Determine where to write .env file
// If running from server directory, write to current directory
// If running from root, write to server directory
const serverDir = __dirname.includes('server') ? __dirname : path.join(__dirname, 'server');
const envPath = path.join(serverDir, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
    console.log('⚠️  WARNING: .env file already exists!');
    console.log(`   Location: ${envPath}`);
    console.log('\nOptions:');
    console.log('1. Delete the existing .env and run this script again');
    console.log('2. Manually update your .env with the secrets below:\n');
    console.log('JWT_SECRET=' + jwtSecret);
    console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
    console.log('\nNOTE: Add NODE_ENV=development as the first line\n');
    process.exit(0);
}

// Write .env file
try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created secure .env file');
    console.log(`   Location: ${envPath}\n`);

    console.log('🔑 Generated Secrets:');
    console.log('   JWT_SECRET: ' + jwtSecret.substring(0, 20) + '...');
    console.log('   JWT_REFRESH_SECRET: ' + jwtRefreshSecret.substring(0, 20) + '...\n');

    console.log('📋 Next Steps:');
    console.log('   1. Install cookie-parser: npm install cookie-parser');
    console.log('   2. Replace server files (see MIGRATION.md)');
    console.log('   3. Delete old database: rm database/security_demo.db');
    console.log('   4. Start server: npm run dev\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   - DO NOT commit .env to git (it\'s in .gitignore)');
    console.log('   - Regenerate secrets for production deployment');
    console.log('   - Keep these secrets secure!\n');

} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
}

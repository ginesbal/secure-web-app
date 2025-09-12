// FILE: setup.js (root)


const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Security Demo Setup Script');
console.log('=============================\n');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 16) {
    console.error('❌ Node.js 16 or higher is required. Current version:', nodeVersion);
    process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Create directory structure
const directories = [
    'client/src/components',
    'client/src/pages',
    'client/src/contexts',
    'client/src/utils',
    'client/src/services',
    'client/public',
    'server/routes',
    'server/middleware',
    'server/db',
    'server/utils',
    'database',
    'docs',
    'tests',
    'nginx',
    '.github/workflows'
];

console.log('\n📁 Creating directory structure...');
directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   ✅ Created: ${dir}`);
    }
});

// Create .env file from example
console.log('\n🔐 Setting up environment variables...');
if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('   ✅ Created .env file from .env.example');
    } else {
        // Create basic .env file
        const envContent = `NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
DATABASE_PATH=./database/security_demo.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=10
SESSION_TIMEOUT_HOURS=1`;
        
        fs.writeFileSync('.env', envContent);
        console.log('   ✅ Created .env file with default values');
    }
} else {
    console.log('   ℹ️  .env file already exists');
}

// Create package.json files if they don't exist
console.log('\n📦 Checking package.json files...');

// Server package.json
const serverPackageJson = {
    "name": "secure-web-app-server",
    "version": "1.0.0",
    "description": "Backend server with security demonstrations",
    "main": "index.js",
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js",
        "test": "jest --coverage",
        "lint": "eslint ."
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.2",
        "sqlite3": "^5.1.6",
        "sqlite": "^5.1.1",
        "express-rate-limit": "^7.1.5",
        "validator": "^13.11.0",
        "isomorphic-dompurify": "^2.3.0",
        "dotenv": "^16.3.1",
        "swagger-ui-express": "^5.0.0",
        "yamljs": "^0.3.0"
    },
    "devDependencies": {
        "nodemon": "^3.0.2",
        "jest": "^29.7.0",
        "supertest": "^6.3.3",
        "eslint": "^8.55.0"
    },
    "engines": {
        "node": ">=16.0.0"
    }
};

if (!fs.existsSync('server/package.json')) {
    fs.writeFileSync('server/package.json', JSON.stringify(serverPackageJson, null, 2));
    console.log('   ✅ Created server/package.json');
}

// Client package.json
const clientPackageJson = {
    "name": "secure-web-app-client",
    "version": "1.0.0",
    "description": "Frontend security demonstration dashboard",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "test": "vitest",
        "lint": "eslint src"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.1",
        "axios": "^1.6.2",
        "dompurify": "^3.0.6"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.2.0",
        "vite": "^5.0.7",
        "tailwindcss": "^3.3.6",
        "autoprefixer": "^10.4.16",
        "postcss": "^8.4.32",
        "vitest": "^1.0.4",
        "eslint": "^8.55.0",
        "eslint-plugin-react": "^7.33.2"
    }
};

if (!fs.existsSync('client/package.json')) {
    fs.writeFileSync('client/package.json', JSON.stringify(clientPackageJson, null, 2));
    console.log('   ✅ Created client/package.json');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
console.log('   This may take a few minutes...\n');

try {
    // Install root dependencies
    console.log('   Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Install client dependencies
    if (fs.existsSync('client/package.json')) {
        console.log('\n   Installing client dependencies...');
        execSync('cd client && npm install', { stdio: 'inherit' });
    }
    
    // Install server dependencies
    if (fs.existsSync('server/package.json')) {
        console.log('\n   Installing server dependencies...');
        execSync('cd server && npm install', { stdio: 'inherit' });
    }
    
    console.log('\n✅ All dependencies installed successfully!');
} catch (error) {
    console.error('\n❌ Failed to install dependencies:', error.message);
    console.log('   Please run "npm run install:all" manually');
}

// Initialize database
console.log('\n🗄️  Initializing database...');
const dbPath = path.join(process.cwd(), 'database', 'security_demo.db');
if (!fs.existsSync(dbPath)) {
    console.log('   Database will be created on first server start');
} else {
    console.log('   ✅ Database already exists');
}

// Create index.html for client if it doesn't exist
const indexHtmlPath = path.join(process.cwd(), 'client', 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Security Demo - Web Application Security Portfolio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    fs.writeFileSync(indexHtmlPath, indexHtmlContent);
    console.log('   ✅ Created client/index.html');
}

// Final instructions
console.log('\n');
console.log('╔════════════════════════════════════════════╗');
console.log('║       Setup Complete!                      ║');
console.log('╠════════════════════════════════════════════╣');
console.log('║                                            ║');
console.log('║  To start the application:                 ║');
console.log('║     npm run dev                            ║');
console.log('║                                            ║');
console.log('║  The app will be available at:             ║');
console.log('║     Frontend: http://localhost:3000        ║');
console.log('║     Backend:  http://localhost:3001        ║');
console.log('║   API Docs: http://localhost:3001/api-docs ║');
console.log('║                                            ║');
console.log('║  Test Credentials:                         ║');
console.log('║     Admin:     admin / admin123            ║');
console.log('║     Moderator: moderator / mod123          ║');
console.log('║     User:      user / user123              ║');
console.log('║     Guest:     guest / guest123            ║');
console.log('║                                            ║');
console.log('╚════════════════════════════════════════════╝');
console.log('\n📚 For more information, check the README.md file');
console.log('🐛 Report issues at: https://github.com/yourusername/secure-web-app/issues\n');
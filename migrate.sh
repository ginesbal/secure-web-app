#!/bin/bash
# migrate.sh - Automated Migration Script for Linux/Mac
# Run with: bash migrate.sh

echo -e "\033[36m🔐 Secure Web App - Automated Migration\033[0m"
echo -e "\033[36m========================================\n\033[0m"

# Check if running from project root
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo -e "\033[31m❌ Error: Please run this script from the project root directory\033[0m"
    echo -e "\033[33m   Current directory: $(pwd)\033[0m"
    exit 1
fi

echo -e "\033[33mStep 1: Generating secure environment variables...\033[0m"
node setup-secure-env.js
if [ $? -ne 0 ]; then
    echo -e "\n\033[31m❌ Failed to generate environment file\033[0m"
    exit 1
fi

echo -e "\n\033[33mStep 2: Installing cookie-parser dependency...\033[0m"
cd server
npm install cookie-parser --save
if [ $? -ne 0 ]; then
    echo -e "\n\033[31m❌ Failed to install cookie-parser\033[0m"
    cd ..
    exit 1
fi
cd ..

echo -e "\n\033[33mStep 3: Backing up and replacing server files...\033[0m"
if [ -f "server/index-refactored.js" ]; then
    if [ -f "server/index.js" ]; then
        mv server/index.js server/index-OLD-BACKUP.js
        echo -e "   \033[32m✓ Backed up: server/index.js → server/index-OLD-BACKUP.js\033[0m"
    fi
    mv server/index-refactored.js server/index.js
    echo -e "   \033[32m✓ Activated: server/index-refactored.js → server/index.js\033[0m"
else
    echo -e "   \033[33m⚠️  server/index-refactored.js not found, skipping...\033[0m"
fi

echo -e "\n\033[33mStep 4: Backing up and replacing client files...\033[0m"

# AuthContext
if [ -f "client/src/contexts/AuthContext-fixed.jsx" ]; then
    if [ -f "client/src/contexts/AuthContext.jsx" ]; then
        mv client/src/contexts/AuthContext.jsx client/src/contexts/AuthContext-OLD-BACKUP.jsx
        echo -e "   \033[32m✓ Backed up: AuthContext.jsx → AuthContext-OLD-BACKUP.jsx\033[0m"
    fi
    mv client/src/contexts/AuthContext-fixed.jsx client/src/contexts/AuthContext.jsx
    echo -e "   \033[32m✓ Activated: AuthContext-fixed.jsx → AuthContext.jsx\033[0m"
else
    echo -e "   \033[33m⚠️  AuthContext-fixed.jsx not found, skipping...\033[0m"
fi

# API service
if [ -f "client/src/services/api-fixed.js" ]; then
    if [ -f "client/src/services/api.js" ]; then
        mv client/src/services/api.js client/src/services/api-OLD-BACKUP.js
        echo -e "   \033[32m✓ Backed up: api.js → api-OLD-BACKUP.js\033[0m"
    fi
    mv client/src/services/api-fixed.js client/src/services/api.js
    echo -e "   \033[32m✓ Activated: api-fixed.js → api.js\033[0m"
else
    echo -e "   \033[33m⚠️  api-fixed.js not found, skipping...\033[0m"
fi

echo -e "\n\033[33mStep 5: Deleting old database (to get new schema)...\033[0m"
if [ -f "database/security_demo.db" ]; then
    rm database/security_demo.db
    echo -e "   \033[32m✓ Deleted: database/security_demo.db\033[0m"
    echo -e "   \033[90m(Will be recreated with indexes on server start)\033[0m"
else
    echo -e "   \033[90mℹ️  No existing database found\033[0m"
fi

echo -e "\n\033[32m✅ Migration Complete!\033[0m"
echo -e "\n\033[36m========================================\033[0m"
echo -e "\033[36mNext Steps:\033[0m"
echo -e "\033[36m========================================\n\033[0m"

echo -e "\033[97m1. Start the server:\033[0m"
echo -e "   \033[90mcd server\033[0m"
echo -e "   \033[90mnpm run dev\n\033[0m"

echo -e "\033[97m2. In a new terminal, start the client:\033[0m"
echo -e "   \033[90mcd client\033[0m"
echo -e "   \033[90mnpm run dev\n\033[0m"

echo -e "\033[97m3. Open browser to: http://localhost:3000\n\033[0m"

echo -e "\033[97m4. Login with new credentials:\033[0m"
echo -e "   \033[90mUsername: admin\033[0m"
echo -e "   \033[90mPassword: Admin123!\n\033[0m"

echo -e "\033[33mDemo Users:\033[0m"
echo -e "   \033[90madmin      → Admin123!\033[0m"
echo -e "   \033[90mmoderator  → Mod123!\033[0m"
echo -e "   \033[90muser       → User123!\033[0m"
echo -e "   \033[90mguest      → Guest123!\n\033[0m"

echo -e "\033[36m📚 Documentation:\033[0m"
echo -e "   \033[90m- MIGRATION.md          (This guide)\033[0m"
echo -e "   \033[90m- SECURITY_FIXES.md     (All improvements)\033[0m"
echo -e "   \033[90m- BEFORE_AFTER_EXAMPLES.md (Code comparisons)\n\033[0m"

echo -e "\033[33m⚠️  IMPORTANT:\033[0m"
echo -e "   \033[90m- Your .env file contains SECRET KEYS\033[0m"
echo -e "   \033[90m- DO NOT commit .env to git\033[0m"
echo -e "   \033[90m- Regenerate secrets for production\n\033[0m"

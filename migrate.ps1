# migrate.ps1 - Automated Migration Script for Windows
# Run with: .\migrate.ps1

Write-Host "🔐 Secure Web App - Automated Migration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running from project root
if (-not (Test-Path "server") -or -not (Test-Path "client")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Generating secure environment variables..." -ForegroundColor Yellow
node setup-secure-env.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to generate environment file" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Installing cookie-parser dependency..." -ForegroundColor Yellow
Push-Location server
npm install cookie-parser --save
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to install cookie-parser" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`nStep 3: Backing up and replacing server files..." -ForegroundColor Yellow
if (Test-Path "server\index-refactored.js") {
    if (Test-Path "server\index.js") {
        Move-Item "server\index.js" "server\index-OLD-BACKUP.js" -Force
        Write-Host "   ✓ Backed up: server\index.js → server\index-OLD-BACKUP.js" -ForegroundColor Green
    }
    Move-Item "server\index-refactored.js" "server\index.js" -Force
    Write-Host "   ✓ Activated: server\index-refactored.js → server\index.js" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  server\index-refactored.js not found, skipping..." -ForegroundColor Yellow
}

Write-Host "`nStep 4: Backing up and replacing client files..." -ForegroundColor Yellow

# AuthContext
if (Test-Path "client\src\contexts\AuthContext-fixed.jsx") {
    if (Test-Path "client\src\contexts\AuthContext.jsx") {
        Move-Item "client\src\contexts\AuthContext.jsx" "client\src\contexts\AuthContext-OLD-BACKUP.jsx" -Force
        Write-Host "   ✓ Backed up: AuthContext.jsx → AuthContext-OLD-BACKUP.jsx" -ForegroundColor Green
    }
    Move-Item "client\src\contexts\AuthContext-fixed.jsx" "client\src\contexts\AuthContext.jsx" -Force
    Write-Host "   ✓ Activated: AuthContext-fixed.jsx → AuthContext.jsx" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  AuthContext-fixed.jsx not found, skipping..." -ForegroundColor Yellow
}

# API service
if (Test-Path "client\src\services\api-fixed.js") {
    if (Test-Path "client\src\services\api.js") {
        Move-Item "client\src\services\api.js" "client\src\services\api-OLD-BACKUP.js" -Force
        Write-Host "   ✓ Backed up: api.js → api-OLD-BACKUP.js" -ForegroundColor Green
    }
    Move-Item "client\src\services\api-fixed.js" "client\src\services\api.js" -Force
    Write-Host "   ✓ Activated: api-fixed.js → api.js" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  api-fixed.js not found, skipping..." -ForegroundColor Yellow
}

Write-Host "`nStep 5: Deleting old database (to get new schema)..." -ForegroundColor Yellow
if (Test-Path "database\security_demo.db") {
    Remove-Item "database\security_demo.db" -Force
    Write-Host "   ✓ Deleted: database\security_demo.db" -ForegroundColor Green
    Write-Host "   (Will be recreated with indexes on server start)" -ForegroundColor Gray
} else {
    Write-Host "   ℹ️  No existing database found" -ForegroundColor Gray
}

Write-Host "`n✅ Migration Complete!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Start the server:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   npm run dev`n" -ForegroundColor Gray

Write-Host "2. In a new terminal, start the client:" -ForegroundColor White
Write-Host "   cd client" -ForegroundColor Gray
Write-Host "   npm run dev`n" -ForegroundColor Gray

Write-Host "3. Open browser to: http://localhost:3000`n" -ForegroundColor White

Write-Host "4. Login with new credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: Admin123!`n" -ForegroundColor Gray

Write-Host "Demo Users:" -ForegroundColor Yellow
Write-Host "   admin      → Admin123!" -ForegroundColor Gray
Write-Host "   moderator  → Mod123!" -ForegroundColor Gray
Write-Host "   user       → User123!" -ForegroundColor Gray
Write-Host "   guest      → Guest123!`n" -ForegroundColor Gray

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - MIGRATION.md          (This guide)" -ForegroundColor Gray
Write-Host "   - SECURITY_FIXES.md     (All improvements)" -ForegroundColor Gray
Write-Host "   - BEFORE_AFTER_EXAMPLES.md (Code comparisons)`n" -ForegroundColor Gray

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   - Your .env file contains SECRET KEYS" -ForegroundColor Gray
Write-Host "   - DO NOT commit .env to git" -ForegroundColor Gray
Write-Host "   - Regenerate secrets for production`n" -ForegroundColor Gray

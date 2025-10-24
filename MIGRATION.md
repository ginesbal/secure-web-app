# Quick Migration Guide

Follow these steps to activate all security improvements.

## Prerequisites

- Node.js 16+ installed
- npm 7+ installed
- Git (for version control)

---

## Step-by-Step Migration

### 1. Generate Secure Environment Variables

Run the setup script from the project root:

```powershell
# Windows PowerShell
node setup-secure-env.js
```

```bash
# Linux/Mac
node setup-secure-env.js
```

This creates a `.env` file in the `server/` directory with secure random secrets.

**Manual Alternative:**
```powershell
# Generate secrets manually
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Then create `server/.env`:
```env
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
JWT_SECRET=<paste-first-secret-here>
JWT_REFRESH_SECRET=<paste-second-secret-here>
DATABASE_PATH=./database/security_demo.db
BCRYPT_ROUNDS=10
```

---

### 2. Install Missing Dependency

```powershell
cd server
npm install cookie-parser --save
```

---

### 3. Backup and Replace Server Files

```powershell
# Backup old server file
cd server
mv index.js index-OLD-BACKUP.js

# Activate new secure server
mv index-refactored.js index.js
```

**Linux/Mac:**
```bash
cd server
mv index.js index-OLD-BACKUP.js
mv index-refactored.js index.js
```

---

### 4. Backup and Replace Client Files

```powershell
# Backup old auth context
cd ..\client\src\contexts
mv AuthContext.jsx AuthContext-OLD-BACKUP.jsx
mv AuthContext-fixed.jsx AuthContext.jsx

# Backup old API service
cd ..\services
mv api.js api-OLD-BACKUP.js
mv api-fixed.js api.js
```

**Linux/Mac:**
```bash
cd ../client/src/contexts
mv AuthContext.jsx AuthContext-OLD-BACKUP.jsx
mv AuthContext-fixed.jsx AuthContext.jsx

cd ../services
mv api.js api-OLD-BACKUP.js
mv api-fixed.js api.js
```

---

### 5. Delete Old Database (Get New Schema)

The new version has database indexes and additional fields.

```powershell
cd ..\..\..\..
rm database\security_demo.db
```

**Linux/Mac:**
```bash
cd ../../../..
rm database/security_demo.db
```

---

### 6. Start the Server

```powershell
cd server
npm run dev
```

You should see:
```
🚀 Initializing Secure Web App...

✅ Environment validation passed
✅ Database initialized successfully
✅ Server started successfully!

🚀 Server running on port 3001
📊 Environment: development
🔐 Security features enabled
🍪 httpOnly cookies: ENABLED
🛡️  CSRF protection: ENABLED
🔒 Rate limiting: ENABLED
```

---

### 7. Start the Client (Separate Terminal)

```powershell
# Open a new terminal
cd client
npm run dev
```

---

### 8. Test the New Security Features

1. **Open browser:** http://localhost:3000

2. **Login with demo account:**
   - Username: `admin`
   - Password: `Admin123!`

3. **Check httpOnly cookies:**
   - Open DevTools → Application → Cookies
   - You should see `accessToken`, `refreshToken` (with HttpOnly flag ✓)
   - `csrfToken` should be readable (no HttpOnly flag)

4. **Test account lockout:**
   - Logout
   - Try logging in with wrong password 5 times
   - 6th attempt should lock account for 30 minutes

5. **Test password validation:**
   - Try registering with weak password "password123"
   - Should be rejected with clear error message

---

## Verification Checklist

After migration, verify:

- [ ] Server starts without errors
- [ ] Environment validation passes
- [ ] Database initializes with new schema
- [ ] Login works and sets httpOnly cookies
- [ ] Tokens NOT visible in localStorage
- [ ] CSRF token is sent with POST requests
- [ ] Failed login attempts are tracked
- [ ] Account locks after 5 failed attempts
- [ ] Demo users have new stronger passwords (Admin123!, etc.)

---

## Demo User Credentials

The new version has stronger password requirements:

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | Admin |
| moderator | Mod123! | Moderator |
| user | User123! | User |
| guest | Guest123! | Guest |

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Not a common password

---

## Troubleshooting

### "Missing required environment variables"

**Solution:** Run `node setup-secure-env.js` from project root

### "Cannot find module 'cookie-parser'"

**Solution:** Run `npm install cookie-parser` in server directory

### "Login returns 401 Unauthorized"

**Cause:** Old server file is still running

**Solution:**
1. Stop the server (Ctrl+C)
2. Verify `server/index.js` is the refactored version
3. Restart: `npm run dev`

### "Tokens still in localStorage"

**Cause:** Old client files are still being used

**Solution:** Verify you replaced:
- `client/src/contexts/AuthContext.jsx`
- `client/src/services/api.js`

### "Database error: no such column"

**Cause:** Old database schema doesn't have new fields

**Solution:** Delete old database:
```powershell
rm database/security_demo.db
```
Then restart server to create new schema.

### "CORS error in browser"

**Cause:** Server CORS not configured for credentials

**Solution:** The new `index.js` has this. Verify you replaced the server file.

---

## Rollback (If Needed)

If something goes wrong, rollback:

```powershell
# Restore server
cd server
mv index.js index-NEW-VERSION.js
mv index-OLD-BACKUP.js index.js

# Restore client
cd ..\client\src\contexts
mv AuthContext.jsx AuthContext-NEW-VERSION.jsx
mv AuthContext-OLD-BACKUP.jsx AuthContext.jsx

cd ..\services
mv api.js api-NEW-VERSION.js
mv api-OLD-BACKUP.js api.js

# Restart servers
```

---

## Next Steps

After successful migration:

1. **Review** `SECURITY_FIXES.md` for all improvements
2. **Read** `BEFORE_AFTER_EXAMPLES.md` to understand changes
3. **Test** all security features thoroughly
4. **Update** your README (see `README_ADDITION.md`)
5. **Delete** old backup files once confident
6. **Consider** additional improvements (PostgreSQL, real CAPTCHA, etc.)

---

## Questions?

- Check `SECURITY_FIXES.md` for detailed explanations
- Check `BEFORE_AFTER_EXAMPLES.md` for code comparisons
- Review commit history for incremental changes

**Important:** These security improvements follow industry best practices. Take time to understand each change!

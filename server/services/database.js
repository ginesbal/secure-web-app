// server/services/database.js - Database service layer with proper initialization

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../constants');

class DatabaseService {
    constructor(config) {
        this.config = config;
        this.db = null;
    }

    /**
     * Initialize database connection and schema
     */
    async initialize() {
        try {
            // Ensure database directory exists
            const dbDir = path.dirname(this.config.databasePath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Open database connection
            this.db = await open({
                filename: this.config.databasePath,
                driver: sqlite3.Database
            });

            // Enable foreign keys
            await this.db.run('PRAGMA foreign_keys = ON');

            // Create tables
            await this.createTables();

            // Create indexes for performance
            await this.createIndexes();

            // Seed demo users
            await this.seedDemoUsers();

            // Schedule cleanup
            this.scheduleCleanup();

            console.log('✅ Database initialized successfully');

            return this.db;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create database tables
     */
    async createTables() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT '${USER_ROLES.USER}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                email_verified BOOLEAN DEFAULT 0,
                verification_token TEXT,
                reset_token TEXT,
                reset_token_expires DATETIME,
                last_login DATETIME,
                failed_login_attempts INTEGER DEFAULT 0,
                account_locked_until DATETIME,
                CHECK (role IN ('${USER_ROLES.ADMIN}', '${USER_ROLES.MODERATOR}', '${USER_ROLES.USER}', '${USER_ROLES.GUEST}'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                refresh_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                ip_address TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                CHECK (status IN ('success', 'failed', 'blocked'))
            );

            CREATE TABLE IF NOT EXISTS csrf_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS security_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT,
                ip_address TEXT,
                user_id INTEGER,
                payload TEXT,
                blocked BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                CHECK (severity IN ('low', 'medium', 'high', 'critical'))
            );

            CREATE TABLE IF NOT EXISTS password_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        `);
    }

    /**
     * Create database indexes for performance optimization
     */
    async createIndexes() {
        await this.db.exec(`
            -- User indexes
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
            CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

            -- Session indexes
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
            CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
            CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

            -- Activity log indexes
            CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_activity_status ON activity_logs(status);

            -- CSRF token indexes
            CREATE INDEX IF NOT EXISTS idx_csrf_token ON csrf_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_csrf_user_id ON csrf_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_csrf_expires_at ON csrf_tokens(expires_at);

            -- Security event indexes
            CREATE INDEX IF NOT EXISTS idx_security_event_type ON security_events(event_type);
            CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
            CREATE INDEX IF NOT EXISTS idx_security_created_at ON security_events(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_security_ip ON security_events(ip_address);
            CREATE INDEX IF NOT EXISTS idx_security_blocked ON security_events(blocked);

            -- Password history indexes
            CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
        `);
    }

    /**
     * Seed demo users for testing
     */
    async seedDemoUsers() {
        const demoUsers = [
            {
                username: 'admin',
                email: 'admin@secure.com',
                password: 'Admin123!',
                role: USER_ROLES.ADMIN
            },
            {
                username: 'moderator',
                email: 'mod@secure.com',
                password: 'Mod123!',
                role: USER_ROLES.MODERATOR
            },
            {
                username: 'user',
                email: 'user@secure.com',
                password: 'User123!',
                role: USER_ROLES.USER
            },
            {
                username: 'guest',
                email: 'guest@secure.com',
                password: 'Guest123!',
                role: USER_ROLES.GUEST
            }
        ];

        for (const user of demoUsers) {
            const existingUser = await this.db.get(
                'SELECT * FROM users WHERE username = ?',
                user.username
            );

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash(
                    user.password,
                    this.config.bcryptRounds
                );

                await this.db.run(
                    `INSERT INTO users (username, email, password, role, email_verified)
                     VALUES (?, ?, ?, ?, ?)`,
                    [user.username, user.email, hashedPassword, user.role, 1]
                );

                console.log(`   ✓ Created demo user: ${user.username} (password: ${user.password})`);
            }
        }
    }

    /**
     * Schedule periodic cleanup of expired data
     */
    scheduleCleanup() {
        // Clean up expired sessions and tokens every hour
        setInterval(async () => {
            try {
                const now = new Date().toISOString();

                // Delete expired sessions
                const sessionsDeleted = await this.db.run(
                    'DELETE FROM sessions WHERE expires_at < ?',
                    [now]
                );

                // Delete expired CSRF tokens
                const csrfDeleted = await this.db.run(
                    'DELETE FROM csrf_tokens WHERE expires_at < ?',
                    [now]
                );

                // Delete old activity logs (keep last 90 days)
                const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
                const logsDeleted = await this.db.run(
                    'DELETE FROM activity_logs WHERE created_at < ?',
                    [ninetyDaysAgo]
                );

                // Delete old security events (keep last 90 days)
                const eventsDeleted = await this.db.run(
                    'DELETE FROM security_events WHERE created_at < ?',
                    [ninetyDaysAgo]
                );

                if (
                    sessionsDeleted.changes > 0 ||
                    csrfDeleted.changes > 0 ||
                    logsDeleted.changes > 0 ||
                    eventsDeleted.changes > 0
                ) {
                    console.log(
                        `[CLEANUP] Deleted: ${sessionsDeleted.changes} sessions, ` +
                        `${csrfDeleted.changes} CSRF tokens, ` +
                        `${logsDeleted.changes} logs, ` +
                        `${eventsDeleted.changes} events`
                    );
                }
            } catch (error) {
                console.error('[CLEANUP] Error during cleanup:', error);
            }
        }, 3600000); // Run every hour
    }

    /**
     * Get database connection
     */
    getConnection() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            await this.db.close();
            console.log('✅ Database connection closed');
        }
    }

    /**
     * Run database vacuum for optimization
     */
    async vacuum() {
        await this.db.run('VACUUM');
        console.log('✅ Database vacuumed');
    }
}

module.exports = DatabaseService;

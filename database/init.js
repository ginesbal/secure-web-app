// =====================================
// FILE: database/init.js
// =====================================
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    const dbPath = path.join(__dirname, 'security_demo.db');
    
    // Create database
    const db = new sqlite3.Database(dbPath);
    
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    return new Promise((resolve, reject) => {
        db.exec(schema, async (err) => {
            if (err) {
                console.error('Error creating schema:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Database schema created successfully');
            
            // Hash passwords for demo users
            const users = [
                { username: 'admin', email: 'admin@securitydemo.com', password: 'admin123', role: 'Admin' },
                { username: 'moderator', email: 'mod@securitydemo.com', password: 'mod123', role: 'Moderator' },
                { username: 'john_user', email: 'john@example.com', password: 'user123', role: 'User' },
                { username: 'jane_user', email: 'jane@example.com', password: 'user456', role: 'User' },
                { username: 'guest_user', email: 'guest@example.com', password: 'guest123', role: 'Guest' }
            ];
            
            for (const user of users) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                db.run(
                    `INSERT OR IGNORE INTO users (username, email, password, role, email_verified) 
                     VALUES (?, ?, ?, ?, 1)`,
                    [user.username, user.email, hashedPassword, user.role],
                    (err) => {
                        if (err) console.error(`Error inserting ${user.username}:`, err);
                        else console.log(`✅ Created user: ${user.username}`);
                    }
                );
            }
            
            // Insert sample security events
            const securityEvents = [
                ['XSS_ATTEMPT', 'high', 'XSS attack blocked in comment field', '192.168.1.100', 1, '<script>alert("XSS")</script>', 1],
                ['SQL_INJECTION', 'critical', 'SQL injection attempt detected', '192.168.1.101', null, "' OR '1'='1", 1],
                ['BRUTE_FORCE', 'medium', 'Multiple failed login attempts', '192.168.1.102', null, 'Password guessing', 1],
                ['CSRF_ATTEMPT', 'high', 'Cross-site request forgery attempt', '192.168.1.103', 2, 'Forged POST request', 1]
            ];
            
            securityEvents.forEach(event => {
                db.run(
                    `INSERT INTO security_events (event_type, severity, description, ip_address, user_id, payload, blocked) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    event,
                    (err) => {
                        if (err) console.error('Error inserting security event:', err);
                    }
                );
            });
            
            setTimeout(() => {
                db.close();
                resolve();
            }, 2000);
        });
    });
}

if (require.main === module) {
    initializeDatabase()
        .then(() => console.log('✅ Database initialization complete'))
        .catch(err => console.error('❌ Database initialization failed:', err));
}

module.exports = initializeDatabase;
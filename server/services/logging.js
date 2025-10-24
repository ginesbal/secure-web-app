// server/services/logging.js - Activity and security event logging

const { ACTIVITY_STATUS, SECURITY_EVENT_TYPES, SEVERITY_LEVELS } = require('../constants');

class LoggingService {
    constructor(db) {
        this.db = db;
    }

    /**
     * Log user activity
     */
    async logActivity(userId, action, status, ipAddress, details = null) {
        try {
            await this.db.run(
                `INSERT INTO activity_logs (user_id, action, status, ip_address, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, action, status, ipAddress, details]
            );
        } catch (error) {
            console.error('[LOGGING] Error logging activity:', error);
            // Don't throw - logging failures shouldn't break the application
        }
    }

    /**
     * Log security event
     */
    async logSecurityEvent(
        eventType,
        severity,
        description,
        ipAddress,
        userId = null,
        payload = null,
        blocked = false
    ) {
        try {
            await this.db.run(
                `INSERT INTO security_events (event_type, severity, description, ip_address, user_id, payload, blocked)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    eventType,
                    severity,
                    description,
                    ipAddress,
                    userId,
                    payload ? JSON.stringify(payload) : null,
                    blocked ? 1 : 0
                ]
            );

            // Log critical events to console for immediate visibility
            if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
                console.warn(`[SECURITY - ${severity.toUpperCase()}] ${eventType}: ${description}`, {
                    ip: ipAddress,
                    userId,
                    blocked
                });
            }
        } catch (error) {
            console.error('[LOGGING] Error logging security event:', error);
        }
    }

    /**
     * Log failed login attempt
     */
    async logFailedLogin(username, ipAddress, reason = 'Invalid credentials') {
        await this.logActivity(
            null,
            `Failed login attempt: ${username}`,
            ACTIVITY_STATUS.FAILED,
            ipAddress,
            reason
        );

        await this.logSecurityEvent(
            SECURITY_EVENT_TYPES.LOGIN_FAILURE,
            SEVERITY_LEVELS.MEDIUM,
            `Failed login for: ${username} - ${reason}`,
            ipAddress,
            null,
            { username, reason },
            true
        );
    }

    /**
     * Log successful login
     */
    async logSuccessfulLogin(userId, username, ipAddress, userAgent) {
        await this.logActivity(
            userId,
            'User logged in',
            ACTIVITY_STATUS.SUCCESS,
            ipAddress,
            `User agent: ${userAgent}`
        );
    }

    /**
     * Log logout
     */
    async logLogout(userId, ipAddress) {
        await this.logActivity(
            userId,
            'User logged out',
            ACTIVITY_STATUS.SUCCESS,
            ipAddress
        );
    }

    /**
     * Get activity logs for a user
     */
    async getActivityLogs(userId = null, limit = 50, offset = 0) {
        let query = 'SELECT * FROM activity_logs';
        const params = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.all(query, params);
    }

    /**
     * Get security events
     */
    async getSecurityEvents(filters = {}, limit = 100, offset = 0) {
        let query = 'SELECT * FROM security_events WHERE 1=1';
        const params = [];

        if (filters.eventType) {
            query += ' AND event_type = ?';
            params.push(filters.eventType);
        }

        if (filters.severity) {
            query += ' AND severity = ?';
            params.push(filters.severity);
        }

        if (filters.blocked !== undefined) {
            query += ' AND blocked = ?';
            params.push(filters.blocked ? 1 : 0);
        }

        if (filters.ipAddress) {
            query += ' AND ip_address = ?';
            params.push(filters.ipAddress);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.all(query, params);
    }

    /**
     * Get security statistics
     */
    async getSecurityStats() {
        const stats = await this.db.get(`
            SELECT
                (SELECT COUNT(*) FROM security_events WHERE blocked = 1) as attacks_blocked,
                (SELECT COUNT(*) FROM activity_logs WHERE action LIKE '%logged in%' AND status = 'success') as successful_logins,
                (SELECT COUNT(*) FROM activity_logs WHERE action LIKE '%login%' AND status = 'failed') as failed_logins,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM sessions WHERE expires_at > datetime('now')) as active_sessions
        `);

        return stats;
    }

    /**
     * Check for suspicious activity patterns
     */
    async checkSuspiciousActivity(ipAddress, timeWindowMinutes = 15) {
        const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();

        const suspiciousActivity = await this.db.get(
            `SELECT
                COUNT(*) as total_attempts,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_attempts
             FROM activity_logs
             WHERE ip_address = ? AND created_at > ?`,
            [ipAddress, since]
        );

        // Flag as suspicious if more than 5 failed attempts in the time window
        return {
            isSuspicious: suspiciousActivity.failed_attempts >= 5,
            ...suspiciousActivity
        };
    }
}

module.exports = LoggingService;

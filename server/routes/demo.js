// server/routes/demo.js
const express = require('express');
const router = express.Router();
const DOMPurify = require('isomorphic-dompurify');

/* -------------------------------------------------------
   Helper: classify XSS impact by payload signature
   ------------------------------------------------------- */
function classifyXssImpact(input) {
    const signatures = [
        {
            pattern: /<script[\s\S]*?<\/script>/gi,
            impact:
                'Script tag XSS — arbitrary JS would run as the page loads. Because it executes in your site’s origin, it can read cookies/DOM and send authenticated requests as the user.'
        },
        {
            pattern: /<img[^>]*onerror/gi,
            impact:
                'Image onerror XSS — the onerror handler would fire and execute attacker JS. Event handlers run in the page context, enabling cookie/token theft and DOM manipulation.'
        },
        {
            pattern: /<svg[^>]*onload/gi,
            impact:
                'SVG onload XSS — the onload event would auto-fire on render, executing JS. SVG is parsed like HTML, so the code inherits your origin and can exfiltrate session data.'
        },
        {
            pattern: /on\w+\s*=/gi,
            impact:
                'Event-handler XSS — inline handlers (e.g., onclick) would execute when triggered. Since they run in your origin, they can read sensitive data and perform actions as the user.'
        },
        {
            pattern: /javascript:/gi,
            impact:
                'javascript: URL XSS — navigating/clicking would execute JS in the page context. This bypasses normal content flow and can steal credentials or redirect silently.'
        },
        {
            pattern: /<iframe/gi,
            impact:
                'Injected iframe — user would see attacker-controlled content. This enables clickjacking or credential capture because the overlay can mimic trusted UI.'
        }
    ];

    const match = signatures.find(s => s.pattern.test(input));
    return match ? match.impact : null;
}

/* -------------------------------------------------------
   Helper: classify SQLi impact by payload signature
   ------------------------------------------------------- */
function classifySqlImpact(input) {
    const signatures = [
        {
            pattern: /(?:'|"|`)?\s*or\s*(?:'|"|`)?1(?:'|"|`)?\s*=\s*(?:'|"|`)?1/gi,
            impact:
                'Auth bypass — the WHERE clause becomes a tautology (always true). Because input is treated as code, the query returns rows without validating real credentials.'
        },
        {
            pattern: /union\s+select/gi,
            impact:
                'Data extraction — UNION would append results from attacker-chosen SELECTs. The response could leak columns from other tables because the DB merges result sets.'
        },
        {
            pattern: /;\s*drop\s+table/gi,
            impact:
                'Destructive DDL — a stacked statement would drop a table. If multi-statements are allowed, the DB executes the attacker’s command, causing permanent data loss.'
        },
        {
            pattern: /;\s*delete\s+from/gi,
            impact:
                'Data deletion — a stacked DELETE would remove rows. The DB runs it after the original query, wiping data because input is executed, not just compared.'
        },
        {
            pattern: /--|#|\/\*/g,
            impact:
                'Query truncation — comment markers would cut off the rest of the clause. This can nullify password checks or trailing predicates so the injected query compiles.'
        },
        {
            pattern: /(exec|execute)\s*\(/gi,
            impact:
                'Procedure execution — injected EXEC would run stored procedures. With sufficient privileges, this alters system state or calls dangerous routines.'
        },
        {
            pattern: /xp_cmdshell/gi,
            impact:
                'OS command execution — xp_cmdshell would run shell commands on the DB host. This pivots SQLi into server takeover because commands execute at OS level.'
        },
        {
            pattern: /;\s*select/gi,
            impact:
                'Stacked queries — extra SELECTs would run and may return sensitive data. Apps that forward multiple result sets or verbose errors can leak internal info.'
        }
    ];

    const match = signatures.find(s => s.pattern.test(input));
    return match ? match.impact : null;
}

/* =======================================================
   XSS Demo Endpoint
   ======================================================= */
router.post('/xss', (req, res) => {
    const { input, protection } = req.body;

    const result = {
        original: input,
        processed: input,
        vulnerable: false,
        message: 'Input processed safely'
    };

    if (protection) {
        // Strict sanitize: strip all tags
        result.processed = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        if (result.processed !== input) {
            result.message = 'XSS blocked — malicious markup removed.';
        } else {
            result.message = 'Clean input — nothing harmful detected.';
        }
    } else {
        const impact = classifyXssImpact(input);
        if (impact) {
            result.vulnerable = true;
            result.message = impact;
        } else {
            result.message = 'No obvious XSS pattern detected.';
        }
    }

    res.json(result);
});

/* =======================================================
   SQL Injection Demo Endpoint
   ======================================================= */
router.post('/sql', (req, res) => {
    const { input, protection } = req.body;

    const result = {
        query: '',
        vulnerable: false,
        message: 'Query executed safely'
    };

    if (protection) {
        // Safe: parameterized query
        result.query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        result.message = 'SQLi blocked — parameterized query used.';
    } else {
        // Vulnerable: string concatenation
        result.query = `SELECT * FROM users WHERE username = '${input}' AND password = 'password'`;

        const impact = classifySqlImpact(input);
        if (impact) {
            result.vulnerable = true;
            result.message = impact;
        } else {
            result.message = 'No obvious SQLi pattern detected.';
        }
    }

    res.json(result);
});

/* =======================================================
   CSRF Demo Endpoint
   ======================================================= */
router.post('/csrf', (req, res) => {
    const { csrfToken, protection } = req.body;

    const result = {
        vulnerable: false,
        message: 'Request validated successfully'
    };

    if (protection) {
        const validToken = 'valid-csrf-token-123456';

        if (!csrfToken || csrfToken !== validToken) {
            result.vulnerable = false;
            result.message = 'CSRF blocked — invalid/missing token.';
        } else {
            result.message = 'Valid CSRF token — request accepted.';
        }
    } else {
        result.vulnerable = true;
        result.message =
            'No CSRF protection — a malicious site could trigger state-changing requests using the victim’s session because the server cannot verify intent.';
    }

    res.json(result);
});

/* =======================================================
   Path Traversal Demo Endpoint
   ======================================================= */
router.post('/path-traversal', (req, res) => {
    const { path, protection } = req.body;

    const result = {
        requestedPath: path,
        vulnerable: false,
        message: 'Path validated successfully'
    };

    if (protection) {
        const pathTraversalPatterns = [
            /\.\.\//,      // ../
            /\.\.\\/,      // ..\
            /%2e%2e/gi,    // URL-encoded ..
            /%252e%252e/gi // double-encoded ..
        ];

        if (pathTraversalPatterns.some(p => p.test(path))) {
            result.message =
                'Path traversal blocked — traversal sequences detected and stripped before file access.';
            result.vulnerable = false;
        } else {
            result.message = 'Path is clean — no traversal sequences found.';
        }
    } else {
        if (path.includes('../') || path.includes('..\\')) {
            result.vulnerable = true;
            result.message =
                'Path traversal — ../ escapes the intended directory. An attacker could read sensitive files (e.g., /etc/passwd, config files) because the file resolver trusts user paths.';
        } else {
            result.message = 'No traversal pattern detected.';
        }
    }

    res.json(result);
});

module.exports = router;

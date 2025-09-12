import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
        strength: [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length,
        details: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        }
    };
};

export const detectSQLInjection = (input) => {
    const patterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /('|")\s*OR\s*('|")1('|")=('|")1/gi,
        /;\s*--/g,
        /xp_cmdshell/gi,
        /(<|>|'|"|;|{|}|\||\\)/g
    ];

    return patterns.some(pattern => pattern.test(input));
};

export const detectXSS = (input) => {
    const patterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]*onerror[^>]*>/gi,
        /<svg[^>]*onload[^>]*>/gi
    ];

    return patterns.some(pattern => pattern.test(input));
};

export const generateCSRFToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

export const encodeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

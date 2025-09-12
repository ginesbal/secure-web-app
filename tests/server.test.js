// =====================================
// FILE: tests/server.test.js
// =====================================
const request = require('supertest');
const app = require('../server/index');

describe('Authentication Endpoints', () => {
    test('POST /api/auth/register', async () => {
        const newUser = {
            username: 'testuser_' + Date.now(),
            email: `test_${Date.now()}@example.com`,
            password: 'Test123!@#',
            captchaAnswer: '10'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('message');
    });

    test('POST /api/auth/login with valid credentials', async () => {
        const credentials = {
            username: 'admin',
            password: 'admin123'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('csrfToken');
    });

    test('POST /api/auth/login with invalid credentials', async () => {
        const credentials = {
            username: 'admin',
            password: 'wrongpassword'
        };

        const response = await request(app)
            .post('/api/auth/login')
            .send(credentials);

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('error');
    });
});

describe('Security Demo Endpoints', () => {
    test('XSS Protection', async () => {
        const payload = {
            input: '<script>alert("XSS")</script>',
            protection: true
        };

        const response = await request(app)
            .post('/api/demo/xss')
            .send(payload);

        expect(response.statusCode).toBe(200);
        expect(response.body.processed).not.toContain('<script>');
    });

    test('SQL Injection Protection', async () => {
        const payload = {
            input: "' OR '1'='1",
            protection: true
        };

        const response = await request(app)
            .post('/api/demo/sql')
            .send(payload);

        expect(response.statusCode).toBe(200);
        expect(response.body.vulnerable).toBe(false);
    });
});

describe('Rate Limiting', () => {
    test('Should block after too many requests', async () => {
        const attempts = 10;
        const responses = [];

        for (let i = 0; i < attempts; i++) {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'test', password: 'test' });
            responses.push(response.statusCode);
        }

        expect(responses.filter(code => code === 429).length).toBeGreaterThan(0);
    });
});

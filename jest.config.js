module.exports = {
    projects: [
        {
            displayName: 'client',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/client/src/**/*.test.{js,jsx}'],
            transform: {
                '^.+\\.(js|jsx)$': 'babel-jest'
            },
            moduleNameMapper: {
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
            },
            setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js']
        },
        {
            displayName: 'server',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/server/**/*.test.js'],
            coveragePathIgnorePatterns: ['/node_modules/']
        }
    ],
    collectCoverageFrom: [
        'client/src/**/*.{js,jsx}',
        'server/**/*.js',
        '!**/*.config.js',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/build/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};
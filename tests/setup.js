process.env.NODE_ENV = 'test';
const jwt = require('jsonwebtoken');

// Mock database connection
jest.mock('../../config/database', () => ({
    execute: jest.fn()
}));

// Mock multer
jest.mock('multer', () => {
    return jest.fn(() => ({
        single: jest.fn(() => (req, res, next) => {
            req.file = {
                filename: 'test-image.jpg',
                mimetype: 'image/jpeg'
            };
            next();
        })
    }));
});

// Mock jwt
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mocked-token')
}));

global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
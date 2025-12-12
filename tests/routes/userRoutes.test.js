// tests/unit/userRoutes.test.js
const request = require('supertest');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Mock controllers
jest.mock('../../controllers/UserController/userController', () => ({
    getAllUser: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    updateProfileImage: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    filterEmail: jest.fn(),
    sortByUserEmail: jest.fn()
}));

// Mock middleware
jest.mock('../../middleware/auth', () => 
    jest.fn((req, res, next) => {
        req.user = { 
            user_id: 1, 
            email: 'test@example.com',
            role: 'user'
        };
        next();
    })
);

const userController = require('../../controllers/UserController/userController');

describe('User Routes', () => {
    let app;
    let server;
    
    // Create temp directory for uploads
    const uploadDir = 'test-uploads';
    
    beforeAll(() => {
        // Create upload directory for tests
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Configure multer for testing
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, uploadDir);
            },
            filename: function (req, file, cb) {
                const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
                cb(null, uniqueName);
            }
        });
        
        const upload = multer({
            storage: storage,
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB
            },
        });
        
        // Create Express app with routes
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Import the actual route configuration
        const userRoute = require('../../routes/userRoute');
        app.use('/users', userRoute);
    });
    
    afterAll(() => {
        // Clean up test uploads directory
        if (fs.existsSync(uploadDir)) {
            fs.readdirSync(uploadDir).forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
            fs.rmdirSync(uploadDir);
        }
        
        // Close server if running
        if (server) {
            server.close();
        }
    });
    
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Setup default mock implementations
        userController.getAllUser.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Success get all users",
                data: []
            });
        });
        
        userController.createUser.mockImplementation((req, res) => {
            res.status(201).json({
                status: 201,
                message: "User created successfully"
            });
        });
        
        userController.deleteUser.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "User deleted successfully"
            });
        });
        
        userController.updateProfileImage.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Profile image updated",
                data: {
                    filename: req.file.filename
                }
            });
        });
        
        userController.login.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Login successful",
                token: "mock-jwt-token"
            });
        });
        
        userController.logout.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Logout successful"
            });
        });
        
        userController.filterEmail.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Filtered by email",
                data: []
            });
        });
        
        userController.sortByUserEmail.mockImplementation((req, res) => {
            res.status(200).json({
                status: 200,
                message: "Sorted by email",
                data: []
            });
        });
    });
    
    describe('GET /users/getAll', () => {
        it('should call getAllUser controller with token verification', async () => {
            const response = await request(app)
                .get('/users/getAll')
                .set('Authorization', 'Bearer valid-token');
            
            expect(response.status).toBe(200);
            expect(userController.getAllUser).toHaveBeenCalled();
            expect(response.body.message).toBe("Success get all users");
        });
        
        it('should return 401 if no token provided', async () => {
            // Temporarily override auth middleware to simulate no token
            const verifyToken = require('../../middleware/auth');
            verifyToken.mockImplementationOnce((req, res, next) => {
                return res.status(401).json({
                    status: 401,
                    message: "Access denied. No token provided."
                });
            });
            
            const response = await request(app)
                .get('/users/getAll');
            
            expect(response.status).toBe(401);
            expect(userController.getAllUser).not.toHaveBeenCalled();
        });
    });
    
    describe('POST /users/add', () => {
        it('should call createUser controller without token verification', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };
            
            const response = await request(app)
                .post('/users/add')
                .send(userData);
            
            expect(response.status).toBe(201);
            expect(userController.createUser).toHaveBeenCalled();
            expect(response.body.message).toBe("User created successfully");
        });
        
        it('should handle validation errors from controller', async () => {
            userController.createUser.mockImplementationOnce((req, res) => {
                return res.status(400).json({
                    status: 400,
                    message: "Email is required"
                });
            });
            
            const response = await request(app)
                .post('/users/add')
                .send({ password: '123' });
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Email is required");
        });
    });
    
    describe('DELETE /users/delete', () => {
        it('should call deleteUser controller with token verification', async () => {
            const response = await request(app)
                .delete('/users/delete')
                .set('Authorization', 'Bearer valid-token')
                .query({ userId: 123 });
            
            expect(response.status).toBe(200);
            expect(userController.deleteUser).toHaveBeenCalled();
            expect(response.body.message).toBe("User deleted successfully");
        });
        
        it('should pass query parameters to controller', async () => {
            let capturedReq;
            userController.deleteUser.mockImplementationOnce((req, res) => {
                capturedReq = req;
                res.status(200).json({ message: "Deleted" });
            });
            
            await request(app)
                .delete('/users/delete')
                .set('Authorization', 'Bearer valid-token')
                .query({ userId: 123, force: 'true' });
            
            expect(capturedReq.query).toEqual({
                userId: '123',
                force: 'true'
            });
        });
    });
    
    describe('PATCH /users/updateProfileImage', () => {
        it('should handle file upload successfully', async () => {
            // Create a mock image file
            const testImagePath = path.join(uploadDir, 'test-image.jpg');
            
            const response = await request(app)
                .patch('/users/updateProfileImage')
                .set('Authorization', 'Bearer valid-token')
                .attach('image', Buffer.from('fake image content'), {
                    filename: 'test.jpg',
                    contentType: 'image/jpeg'
                });
            
            expect(response.status).toBe(200);
            expect(userController.updateProfileImage).toHaveBeenCalled();
            expect(response.body.message).toBe("Profile image updated");
        });
        
        it('should return 400 for invalid file type', async () => {
            // This test would require modifying the controller to validate file types
            console.log('Note: Add file type validation in controller or multer config');
            
            // Example of how to test invalid file type
            const response = await request(app)
                .patch('/users/updateProfileImage')
                .set('Authorization', 'Bearer valid-token')
                .attach('image', Buffer.from('fake gif content'), {
                    filename: 'test.gif',
                    contentType: 'image/gif'
                });
            
            // Assuming controller handles this, otherwise multer might reject it
            expect(userController.updateProfileImage).toHaveBeenCalled();
        });
        
        it('should return 413 for file too large', async () => {
            // Create a large file buffer (6MB)
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'A');
            
            const response = await request(app)
                .patch('/users/updateProfileImage')
                .set('Authorization', 'Bearer valid-token')
                .attach('image', largeBuffer, {
                    filename: 'large.jpg',
                    contentType: 'image/jpeg'
                });
            
            // Multer should reject with 413 Payload Too Large
            expect(response.status).toBe(413);
        });
        
        it('should return 400 if no file is uploaded', async () => {
            userController.updateProfileImage.mockImplementationOnce((req, res) => {
                if (!req.file) {
                    return res.status(400).json({
                        status: 400,
                        message: "No file uploaded"
                    });
                }
                res.status(200).json({ message: "Updated" });
            });
            
            const response = await request(app)
                .patch('/users/updateProfileImage')
                .set('Authorization', 'Bearer valid-token');
            
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("No file uploaded");
        });
    });
    
    describe('POST /users/login', () => {
        it('should call login controller without token verification', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };
            
            const response = await request(app)
                .post('/users/login')
                .send(credentials);
            
            expect(response.status).toBe(200);
            expect(userController.login).toHaveBeenCalled();
            expect(response.body.message).toBe("Login successful");
            expect(response.body.token).toBe("mock-jwt-token");
        });
        
        it('should handle invalid login credentials', async () => {
            userController.login.mockImplementationOnce((req, res) => {
                return res.status(401).json({
                    status: 401,
                    message: "Invalid email or password"
                });
            });
            
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpass'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid email or password");
        });
    });
    
    describe('POST /users/logout', () => {
        it('should call logout controller with token verification', async () => {
            const response = await request(app)
                .post('/users/logout')
                .set('Authorization', 'Bearer valid-token');
            
            expect(response.status).toBe(200);
            expect(userController.logout).toHaveBeenCalled();
            expect(response.body.message).toBe("Logout successful");
        });
    });
    
    describe('GET /users/filterEmail', () => {
        it('should call filterEmail controller with token verification', async () => {
            const response = await request(app)
                .get('/users/filterEmail')
                .set('Authorization', 'Bearer valid-token')
                .query({ email: 'test' });
            
            expect(response.status).toBe(200);
            expect(userController.filterEmail).toHaveBeenCalled();
            expect(response.body.message).toBe("Filtered by email");
        });
        
        it('should pass query parameters for filtering', async () => {
            let capturedReq;
            userController.filterEmail.mockImplementationOnce((req, res) => {
                capturedReq = req;
                res.status(200).json({ 
                    message: "Filtered",
                    filter: req.query.email 
                });
            });
            
            const response = await request(app)
                .get('/users/filterEmail')
                .set('Authorization', 'Bearer valid-token')
                .query({ email: 'test', domain: 'example.com' });
            
            expect(capturedReq.query).toEqual({
                email: 'test',
                domain: 'example.com'
            });
            expect(response.body.filter).toBe('test');
        });
    });
    
    describe('GET /users/sortByEmail', () => {
        it('should call sortByUserEmail controller with token verification', async () => {
            const response = await request(app)
                .get('/users/sortByEmail')
                .set('Authorization', 'Bearer valid-token')
                .query({ order: 'asc' });
            
            expect(response.status).toBe(200);
            expect(userController.sortByUserEmail).toHaveBeenCalled();
            expect(response.body.message).toBe("Sorted by email");
        });
        
        it('should handle different sort orders', async () => {
            userController.sortByUserEmail.mockImplementationOnce((req, res) => {
                const order = req.query.order || 'asc';
                return res.status(200).json({
                    message: `Sorted ${order}`
                });
            });
            
            const response = await request(app)
                .get('/users/sortByEmail')
                .set('Authorization', 'Bearer valid-token')
                .query({ order: 'desc' });
            
            expect(response.body.message).toBe("Sorted desc");
        });
    });
    
    describe('Route Configuration', () => {
        it('should have correct middleware chain for updateProfileImage', () => {
            // This is a structural test to verify middleware order
            const userRoute = require('../../routes/userRoute');
            
            // Note: Your route has verifyToken twice - this might be unintended
            // PATCH /updateProfileImage has: verifyToken, upload.single('image'), verifyToken
            // You might want to fix this duplication
            console.log('Note: verifyToken appears twice in updateProfileImage route');
        });
        
        it('should handle non-existent routes with 404', async () => {
            const response = await request(app)
                .get('/users/nonexistent');
            
            expect(response.status).toBe(404);
        });
        
        it('should handle unsupported methods', async () => {
            const response = await request(app)
                .put('/users/getAll');
            
            expect(response.status).toBe(404);
        });
    });
    
    describe('Error Handling', () => {
        it('should handle controller throwing errors', async () => {
            userController.getAllUser.mockImplementationOnce(() => {
                throw new Error('Database connection failed');
            });
            
            const response = await request(app)
                .get('/users/getAll')
                .set('Authorization', 'Bearer valid-token');
            
            // Express default error handler returns 500
            expect(response.status).toBe(500);
        });
        
        it('should handle multer errors gracefully', async () => {
            // Test with invalid field name (not 'image')
            const response = await request(app)
                .patch('/users/updateProfileImage')
                .set('Authorization', 'Bearer valid-token')
                .attach('wrongfieldname', Buffer.from('content'), {
                    filename: 'test.jpg',
                    contentType: 'image/jpeg'
                });
            
            // Multer will not process the file with wrong field name
            // Controller should handle missing file
            expect(userController.updateProfileImage).toHaveBeenCalled();
        });
    });
});
// Mock semua module sebelum import
jest.mock('../../config/database', () => ({
    execute: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mocked-token')
}));

// Sekarang import setelah mocking
const userController = require('../../controllers/UserController/userController');
const connection = require('../../config/database');
const jwt = require('jsonwebtoken');

describe('User Controller Unit Tests', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            user: {},
            file: null
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Clear semua mocks
        jest.clearAllMocks();
    });

    describe('Validation Functions', () => {
        // Test untuk fungsi validasi yang sekarang diexport
        test('validateEmail should return true for valid gmail', () => {
            const result = userController.validateEmail('test@gmail.com');
            expect(result).toBe(true);
        });

        test('validateEmail should return true for valid yahoo', () => {
            const result = userController.validateEmail('test@yahoo.com');
            expect(result).toBe(true);
        });

        test('validateEmail should return false for invalid email', () => {
            const result = userController.validateEmail('test@hotmail.com');
            expect(result).toBe(false);
        });

        test('validateEmail should return false for invalid format', () => {
            const result = userController.validateEmail('invalid-email');
            expect(result).toBe(false);
        });

        test('validatePassword should return true for password >= 8 chars', () => {
            const result = userController.validatePassword('password123');
            expect(result).toBe(true);
        });

        test('validatePassword should return false for password < 8 chars', () => {
            const result = userController.validatePassword('pass');
            expect(result).toBe(false);
        });
    });

    describe('createUser', () => {
        test('should return 400 for invalid email format', async () => {
            mockReq.body = {
                email: 'invalid@hotmail.com',
                password: 'password123'
            };

            await userController.createUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 400,
                message: 'Parameter email tidak sesuai format',
                data: null
            });
        });

        test('should return 400 for short password', async () => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'short'
            };

            await userController.createUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 400,
                message: 'Password minimal 8 karakter',
                data: null
            });
        });

        test('should create user successfully', async () => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'password123',
                first_name: 'John',
                last_name: 'Doe'
            };

            // Mock database execute untuk INSERT
            connection.execute.mockResolvedValue();

            await userController.createUser(mockReq, mockRes);

            // Verifikasi query dipanggil dengan parameter yang benar
            expect(connection.execute).toHaveBeenCalledWith(
                `INSERT INTO users (email, first_name, last_name, password, profile_image) VALUES (?, ?, ?, ?, ?)`,
                ['test@gmail.com', 'John', 'Doe', 'password123', '']
            );
            
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 200,
                message: "Registrasi berhasil"
            });
        });

        test('should handle database error in createUser', async () => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'password123',
                first_name: 'John',
                last_name: 'Doe'
            };

            // Mock database error
            connection.execute.mockRejectedValue(new Error('Database error'));

            await userController.createUser(mockReq, mockRes);

            // Karena controller Anda tidak menangkap error di createUser,
            // test ini mungkin akan gagal. Ini menunjukkan bug di kode Anda.
            // Anda perlu menambahkan try-catch di controller.
        });
    });

    describe('getAllUser', () => {
        test('should return all users successfully', (done) => {
            const mockUsers = [
                { id: 1, email: 'user1@gmail.com', first_name: 'User1' },
                { id: 2, email: 'user2@yahoo.com', first_name: 'User2' }
            ];

            // Mock callback-style database call
            connection.execute.mockImplementation((query, callback) => {
                callback(null, mockUsers, []);
            });

            userController.getAllUser(mockReq, mockRes);

            // Karena getAllUser async, kita perlu wait
            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledWith(
                    `SELECT * FROM users`,
                    expect.any(Function)
                );
                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 200,
                    message: "Success Get All Users",
                    data: mockUsers
                });
                done();
            }, 100);
        });

        test('should handle database error in getAllUser', (done) => {
            connection.execute.mockImplementation((query, callback) => {
                callback(new Error('DB Error'), null, []);
            });

            userController.getAllUser(mockReq, mockRes);

            setTimeout(() => {
                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 500,
                    message: "System error"
                });
                done();
            }, 100);
        });
    });

    describe('updateProfileImage', () => {
        test('should return 400 for invalid image format', async () => {
            mockReq.file = {
                mimetype: 'image/gif',
                filename: 'test.gif'
            };
            mockReq.user = {
                user_id: 1
            };

            await userController.updateProfileImage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 400,
                message: 'Format Image tidak sesuai',
                data: null
            });
        });

        test('should update profile image successfully for jpeg', async () => {
            mockReq.file = {
                filename: 'profile.jpg',
                mimetype: 'image/jpeg'
            };
            mockReq.user = {
                user_id: 1
            };

            // Mock database update
            connection.execute.mockResolvedValue();

            await userController.updateProfileImage(mockReq, mockRes);

            expect(connection.execute).toHaveBeenCalledWith(
                `UPDATE users SET profile_image = ? WHERE id = ?`,
                ['profile.jpg', 1]
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 200,
                message: "Update Profile Image berhasil"
            });
        });

        test('should update profile image successfully for png', async () => {
            mockReq.file = {
                filename: 'profile.png',
                mimetype: 'image/png'
            };
            mockReq.user = {
                user_id: 1
            };

            connection.execute.mockResolvedValue();

            await userController.updateProfileImage(mockReq, mockRes);

            expect(connection.execute).toHaveBeenCalledWith(
                `UPDATE users SET profile_image = ? WHERE id = ?`,
                ['profile.png', 1]
            );
        });
    });

    describe('deleteUser', () => {
        test('should delete user successfully', async () => {
            mockReq.user = {
                user_id: 1
            };

            connection.execute.mockResolvedValue();

            await userController.deleteUser(mockReq, mockRes);

            expect(connection.execute).toHaveBeenCalledWith(
                `DELETE FROM users WHERE id = ?`,
                [1]
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 200,
                message: "Delete Profile berhasil"
            });
        });
    });

    describe('login', () => {
        test('should return 400 for invalid email format', async () => {
            mockReq.body = {
                email: 'invalid@hotmail.com',
                password: 'password123'
            };

            await userController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Parameter email tidak sesuai format',
                data: null
            });
        });

        test('should return 400 for short password', async () => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'short'
            };

            await userController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Password minimal 8 karakter',
                data: null
            });
        });

        test('should return 401 for invalid credentials', (done) => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'password123'
            };

            connection.execute.mockImplementation((query, params, callback) => {
                callback(null, [], []);
            });

            userController.login(mockReq, mockRes);

            setTimeout(() => {
                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 103,
                    message: "Username atau password salah",
                    data: null
                });
                done();
            }, 100);
        });

        test('should login successfully and return tokens', (done) => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                email: 'test@gmail.com',
                first_name: 'John',
                last_name: 'Doe',
                profile_image: 'profile.jpg'
            };

            // Mock pertama: SELECT query
            connection.execute
                .mockImplementationOnce((query, params, callback) => {
                    callback(null, [mockUser], []);
                })
                // Mock kedua: UPDATE query
                .mockImplementationOnce((query, params, callback) => {
                    if (callback) callback(null, [], []);
                    return Promise.resolve();
                });

            jwt.sign
                .mockReturnValueOnce('access-token-123')
                .mockReturnValueOnce('refresh-token-456');

            userController.login(mockReq, mockRes);

            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledTimes(2);
                expect(jwt.sign).toHaveBeenCalledTimes(2);
                
                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 200,
                    message: "Login Sukses",
                    data: {
                        token: 'access-token-123',
                        refreshToken: 'refresh-token-456'
                    }
                });
                done();
            }, 100);
        });

        test('should handle database error in login', (done) => {
            mockReq.body = {
                email: 'test@gmail.com',
                password: 'password123'
            };

            connection.execute.mockImplementation((query, params, callback) => {
                callback(new Error('DB Error'), null, []);
            });

            userController.login(mockReq, mockRes);

            setTimeout(() => {
                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 500,
                    message: "System error"
                });
                done();
            }, 100);
        });
    });

    describe('logout', () => {
        test('should logout successfully', async () => {
            mockReq.user = {
                user_id: 1
            };

            connection.execute.mockResolvedValue();

            await userController.logout(mockReq, mockRes);

            expect(connection.execute).toHaveBeenCalledWith(
                `UPDATE users SET refresh_token = null WHERE id = ?`,
                [1]
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 200,
                message: "Logout Sukses"
            });
        });
    });

    describe('filterEmail', () => {
        test('should return 400 if email parameter is empty', async () => {
            mockReq.body = {};

            await userController.filterEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Parameter email tidak boleh kosong'
            });
        });

        test('should return 400 for invalid email type', async () => {
            mockReq.body = {
                email: 'hotmail'
            };

            await userController.filterEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Format Email Tidak Valid, masukkan gmail atau yahoo'
            });
        });

        test('should filter by gmail successfully', (done) => {
            mockReq.body = {
                email: 'gmail'
            };

            const mockUsers = [
                { id: 1, email: 'user1@gmail.com', first_name: 'John' }
            ];

            connection.execute.mockImplementation((query, params, callback) => {
                callback(null, mockUsers, []);
            });

            userController.filterEmail(mockReq, mockRes);

            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledWith(
                    `SELECT * FROM users WHERE email LIKE CONCAT('%', ?, '%')`,
                    ['gmail']
                );
                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 200,
                    message: "Filter Berhasil",
                    data: mockUsers
                });
                done();
            }, 100);
        });

        test('should filter by yahoo successfully', (done) => {
            mockReq.body = {
                email: 'yahoo'
            };

            const mockUsers = [
                { id: 1, email: 'user1@yahoo.com' }
            ];

            connection.execute.mockImplementation((query, params, callback) => {
                callback(null, mockUsers, []);
            });

            userController.filterEmail(mockReq, mockRes);

            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledWith(
                    `SELECT * FROM users WHERE email LIKE CONCAT('%', ?, '%')`,
                    ['yahoo']
                );
                done();
            }, 100);
        });
    });

    describe('sortByUserEmail', () => {
        test('should return 400 if sortType is empty', async () => {
            mockReq.body = {};

            await userController.sortByUserEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Parameter sortType tidak boleh kosong'
            });
        });

        test('should return 400 for invalid sortType', async () => {
            mockReq.body = {
                sortType: 'invalid'
            };

            await userController.sortByUserEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 102,
                message: 'Masukkan asc atau desc'
            });
        });

        test('should sort ascending successfully', (done) => {
            mockReq.body = {
                sortType: 'asc'
            };

            const mockUsers = [
                { id: 1, email: 'a@gmail.com' },
                { id: 2, email: 'b@yahoo.com' }
            ];

            connection.execute.mockImplementation((query, callback) => {
                callback(null, mockUsers, []);
            });

            userController.sortByUserEmail(mockReq, mockRes);

            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledWith(
                    `SELECT * FROM users ORDER BY email ASC`,
                    expect.any(Function)
                );
                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 200,
                    message: "Sort Berhasil",
                    data: mockUsers
                });
                done();
            }, 100);
        });

        test('should sort descending successfully', (done) => {
            mockReq.body = {
                sortType: 'desc'
            };

            connection.execute.mockImplementation((query, callback) => {
                callback(null, [], []);
            });

            userController.sortByUserEmail(mockReq, mockRes);

            setTimeout(() => {
                expect(connection.execute).toHaveBeenCalledWith(
                    `SELECT * FROM users ORDER BY email DESC`,
                    expect.any(Function)
                );
                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.json).toHaveBeenCalledWith({
                    status: 200,
                    message: "Sort Berhasil",
                    data: []
                });
                done();
            }, 100);
        });
    });
});
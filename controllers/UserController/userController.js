const multer = require('multer');
const path = require('path');

const connection = require('../../config/database');
const jwt = require('jsonwebtoken');

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    if (password.length < 8) {
        return false;
    } else {
        return true;
    }
}

const createUser = async (req, res) => {
    console.log('Create User Endpoint');

    // Validate email and password
    if (!validateEmail(req.body.email)) {
        return res.status(400).json({
            status: 102,
            message: 'Parameter email tidak sesuai format',
            data: null
        });
    } else if (!validatePassword(req.body.password)) {
        return res.status(400).json({
            status: 102,
            message: 'Password minimal 8 karakter',
            data: null
        });
    } else {
        //Inser new User to db
        await connection.execute(
            `INSERT INTO users (email, first_name, last_name, password, profile_image) 
       VALUES (?, ?, ?, ?, ?)`,
            [
                req.body.email,
                req.body.first_name,
                req.body.last_name,
                req.body.password,
                ''
            ]
        );

        return res.status(200).json({
            status: 0,
            message: "Registrasi berhasil",
            // date: null
        });
    }
}

const getAllUser = async (req, res) => {
    console.log('Get All User Endpoint');

    connection.execute(
        `SELECT * FROM users`,
        (error, rows, fields) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    status: 999,
                    message: "System error"
                });
            }
            console.log(rows);
            const result = rows

            res.status(200).json({
                status: 200,
                message: "Sukses",
                data: result
            });
        }
    );
}

const getUser = async (req, res) => {
    console.log('Get User Endpoint');
}

const updateProfileImage = async (req, res) => {
    console.log('Update User Endpoint');
    console.log('req.file ', req.file);
    const userData = req.user;
    // Validasi img must jpeg/jpg/png
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
            status: 102,
            message: 'Format Image tidak sesuai',
            data: null
        });
    } else {
        connection.execute(
            `UPDATE users 
        SET profile_image = ?
        WHERE id = ?`,
            [
                req.file.filename,
                userData.user_id
            ]
        );
    }

    return res.status(200).json({
        status: 0,
        message: "Update Profile Image berhasil",
        data: {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image: req.file.filename
        }
    });

}

const deleteUser = async (req, res) => {
    console.log('Delete User Endpoint');
}

const login = async (req, res) => {
    console.log('Login Endpoint');
    const secretKey = 'testing_secret_key_7243795';

    // Validate email and password
    if (!validateEmail(req.body.email)) {
        return res.status(400).json({
            status: 102,
            message: 'Parameter email tidak sesuai format',
            data: null
        });
    } else if (!validatePassword(req.body.password)) {
        return res.status(400).json({
            status: 102,
            message: 'Password minimal 8 karakter',
            data: null
        });
    } else {
        connection.execute(
            `SELECT * FROM users WHERE email = ? AND password = ?`,
            [req.body.email, req.body.password],
            (error, rows, fields) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({
                        status: 999,
                        message: "System error"
                    });
                }

                //Jika data tidak ditemukan
                if (rows.length === 0) {
                    return res.status(401).json({
                        status: 103,
                        message: "Username atau password salah",
                        data: null
                    });
                } else {
                    const user = rows[0];

                    // Buat JWT token
                    const token = jwt.sign(
                        {
                            user_id: user.id,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            profile_image: user.profile_image
                        },
                        secretKey,
                        { expiresIn: '12h' } // Token berlaku 12 jam
                    );

                    // Login berhasil
                    res.status(200).json({
                        status: 0,
                        message: "Login Sukses",
                        data: {
                            token: token,
                        }
                    });
                }
            }
        );
    }
}

module.exports = {
    createUser,
    getAllUser,
    getUser,
    updateProfileImage,
    deleteUser,
    login
}
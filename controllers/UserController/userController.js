const multer = require('multer');
const path = require('path');

const connection = require('../../config/database');

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Folder penyimpanan
    },
    filename: function (req, file, cb) {
        // Nama file: timestamp + original name
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
    //     await connection.execute(
    //         `INSERT INTO users (email, first_name, last_name, password, profile_image) 
    //    VALUES (?, ?, ?, ?, ?)`,
    //         [
    //             req.body.email,
    //             req.body.first_name,
    //             req.body.last_name,
    //             req.body.password,
    //             ''
    //         ]
    //     );

    //     return res.status(200).json({
    //         status: 0,
    //         message: "Registrasi berhasil silahkan login",
    //         date: null
    //     });
    }
}

const getAllUser = async (req, res) => {
    console.log('Get All User Endpoint');
}

const getUser = async (req, res) => {
    console.log('Get User Endpoint');
}

const updateUser = async (req, res) => {
    console.log('Update User Endpoint');
}

const deleteUser = async (req, res) => {
    console.log('Delete User Endpoint');
}

const login = async (req, res) => {
    console.log('Delete User Endpoint');
}

module.exports = {
    createUser,
    getAllUser,
    getUser,
    updateUser,
    deleteUser,
    login
}
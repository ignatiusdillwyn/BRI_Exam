const connection = require('../config/database'); // Sesuaikan dengan path database Anda
const multer = require('multer');
const path = require('path');

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

//Registration
const registration = async (req, res) => {
  let response

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
      message: "Registrasi berhasil silahkan login",
      date: null
    });
  }
}

const login = async (req, res) => {
  const jwt = require('jsonwebtoken');
  const secretKey = 'nutech9123';

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

const profile = async (req, res) => {
  const userData = req.user;
  return res.status(200).json({
    status: 0,
    message: "Sukses",
    data: {
      user_id: userData.user_id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      profile_image: userData.profile_image   
    }
  });
}

const updateProfile = async (req, res) => {
  const userData = req.user;
  await connection.execute(
    `UPDATE users 
     SET first_name = ?, last_name = ?
     WHERE id = ?`,
    [
      req.body.first_name,
      req.body.last_name,
      userData.user_id // dari token
    ]
  );

  return res.status(200).json({
    status: 0,
    message: "Update Pofile berhasil",
    data: {
      user_id: userData.user_id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      profile_image: userData.profile_image
    }
  });
}

const updateProfileImage = async (req, res) => {
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

module.exports = {
  registration,
  login,
  profile,
  updateProfile,
  updateProfileImage
}
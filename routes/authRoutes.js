const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk menyimpan file
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

router.post('/registration', 
  authController.registration
);

router.post('/login', 
  authController.login
);  

router.get('/profile', 
  verifyToken,
  authController.profile
);

router.put('/profile/update', 
  verifyToken,
  authController.updateProfile
);

router.put('/profile/image', 
  upload.single('image'),
  verifyToken,
  authController.updateProfileImage
);


module.exports = router;
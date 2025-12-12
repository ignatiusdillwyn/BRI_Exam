const express = require('express');
const userController = require('../../controllers/UserController/userController');
const verifyToken = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

const userRoute = require('express').Router();

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

userRoute.get('/getAll', verifyToken, userController.getAllUser);
userRoute.post('/add', userController.createUser);
userRoute.delete('/delete', verifyToken, userController.deleteUser);
userRoute.patch('/updateProfileImage', verifyToken, upload.single('image'), verifyToken, userController.updateProfileImage);

userRoute.post('/login', userController.login);
userRoute.post('/logout', verifyToken, userController.logout);
userRoute.get('/filterEmail', verifyToken, userController.filterEmail);
userRoute.get('/sortByEmail', verifyToken, userController.sortByUserEmail);

module.exports = userRoute;
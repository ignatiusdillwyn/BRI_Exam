const express = require('express');
const router = express.Router();
const productController = require('../../controllers/ProductController/productController');
const verifyToken = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

const productRoute = require('express').Router();

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

productRoute.get('/getAll', verifyToken, productController.getAllProduct);
productRoute.post('/add', verifyToken, productController.createProduct);
productRoute.delete('/delete', verifyToken, productController.deleteProduct);
productRoute.patch('/update', verifyToken, productController.updateProduct);
productRoute.patch('/updateProductImage', verifyToken, upload.single('image'), productController.updateProductImage);
productRoute.get('/search', verifyToken, productController.getProduct);

module.exports = productRoute;
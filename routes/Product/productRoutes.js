const express = require('express');
const router = express.Router();
const productController = require('../../controllers/ProductController/productController');
const verifyToken = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

const productRoute = require('express').Router();

productRoute.get('/getAll', productController.getAllProduct);
productRoute.post('/add', productController.createProduct);
productRoute.delete('/delete', productController.deleteProduct);
productRoute.patch('/update', productController.updateProduct);
productRoute.get('/search', productController.getProduct);

module.exports = productRoute;
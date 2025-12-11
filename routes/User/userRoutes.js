const express = require('express');
const router = express.Router();
const userController = require('../../controllers/UserController/userController');
const verifyToken = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

const userRoute = require('express').Router();

userRoute.get('/getAll', userController.getAllUser);
userRoute.post('/add', userController.createUser);
userRoute.delete('/delete', userController.deleteUser);
userRoute.patch('/update', userController.updateUser);
userRoute.get('/search', userController.getUser);

userRoute.post('/login', userController.getUser);

module.exports = userRoute;
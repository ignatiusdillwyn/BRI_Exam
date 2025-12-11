const express = require('express');
const router = express.Router();
const informationController = require('../controllers/informationController');
const verifyToken = require('../middleware/auth');

router.get('/banner', 
  informationController.banner
);

router.get('/services', 
  verifyToken,
  informationController.services
);  

module.exports = router;
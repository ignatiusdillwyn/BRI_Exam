const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const verifyToken = require('../middleware/auth');

router.get('/balance', 
  verifyToken,
  transactionController.userBalance
);

router.post('/topup', 
  verifyToken,
  transactionController.topUp
);

router.post('/transaction', 
  verifyToken,
  transactionController.transaction
);

router.get('/transaction/history', 
  verifyToken,
  transactionController.transactionHistory
);

module.exports = router;
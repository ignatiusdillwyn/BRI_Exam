const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      status: 108,
      message: "Token tidak valid atau kadaluarsa"
    });
  }

  try {
    const decoded = jwt.verify(token, 'nutech9123');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 108,
      message: "Token tidak valid atau kadaluarsa"
    });
  }
};

module.exports = verifyToken;
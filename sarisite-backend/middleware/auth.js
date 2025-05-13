// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Giriş kontrolü (token doğrulama)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
}

// Sadece adminler erişebilir
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekiyor' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin
};

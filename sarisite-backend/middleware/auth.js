// middleware/auth.js
const jwt = require('jsonwebtoken');


// Giriş kontrolü (token doğrulama)
function authenticateToken(req, res, next) {
  console.log('Authorization Header:', req.headers['authorization']);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token
// --- DEBUG İÇİN EKLENDİ ---
  console.log('---------------------------------');
  console.log('GELEN HEADER:', authHeader);
  console.log('ÇIKARTILAN TOKEN:', token);
  console.log('KULLANILAN JWT SECRET:', process.env.JWT_SECRET);
  console.log('---------------------------------');
  // --- DEBUG SONU ---
  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT DOĞRULAMA HATASI:', err.message);
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

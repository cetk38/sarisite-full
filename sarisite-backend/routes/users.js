const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth'); // Kimlik doğrulama için

// GET /api/users/me -> Giriş yapmış kullanıcının bilgilerini getirir (BU ZATEN VARDI)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Veritabanından şifre HARİÇ kullanıcı bilgilerini çekiyoruz.
    const userResult = await pool.query(
      'SELECT name, email, phone_number FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// --- YENİ EKLENEN KISIM ---
// GET /api/users/me/ads -> Giriş yapmış kullanıcının ilanlarını getirir
// ?active=true -> yayındakileri, ?active=false -> yayında olmayanları
router.get('/me/ads', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  // URL'den gelen 'active' parametresini alıyoruz. Örn: /me/ads?active=true
  const { active } = req.query;

  // 'active' parametresi 'true' ise true, değilse false olarak ayarla
  const isActive = active === 'true';

  try {
    const adsResult = await pool.query(
      `SELECT * FROM ads WHERE user_id = $1 AND is_active = $2 ORDER BY created_at DESC`,
      [userId, isActive]
    );
    res.json(adsResult.rows);
  } catch (err) {
    console.error("Kullanıcının ilanları getirilirken hata:", err);
    res.status(500).json({ message: 'İlanlar getirilirken bir hata oluştu.' });
  }
});
// --- YENİ KISIM BİTTİ ---

module.exports = router;
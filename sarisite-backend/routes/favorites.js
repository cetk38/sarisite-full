// routes/favorites.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/favorites -> Giriş yapmış kullanıcının favori ilanlarını listeler
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as owner_name FROM favorites f
       JOIN ads a ON f.ad_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE f.user_id = $1 AND a.approved = TRUE AND a.is_active = TRUE
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Favori ilanlar getirilirken hata:', err);
    res.status(500).json({ message: 'Favori ilanlar getirilemedi.' });
  }
});

// POST /api/favorites -> Bir ilanı favorilere ekler
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { adId } = req.body;
  try {
    // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
    const adCheck = await pool.query('SELECT user_id FROM ads WHERE id = $1', [adId]);
    if (adCheck.rows.length === 0) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (adCheck.rows[0].user_id === userId) return res.status(400).json({ message: 'Kendi ilanınızı favorilere ekleyemezsiniz.' });

    // Zaten favoride mi diye kontrol et (UNIQUE constraint sayesinde aslında gerekmeyebilir ama güvende olmak iyidir)
    const exists = await pool.query('SELECT id FROM favorites WHERE user_id = $1 AND ad_id = $2', [userId, adId]);
    if (exists.rows.length > 0) return res.status(409).json({ message: 'Bu ilan zaten favorilerinizde.' });

    // Favorilere ekle
    await pool.query('INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2)', [userId, adId]);
    res.status(201).json({ message: 'İlan favorilere eklendi.' });
  } catch (err) {
    console.error('Favori eklenirken hata:', err);
    // Eğer UNIQUE constraint hatasıysa (kod 23505), daha anlaşılır bir mesaj gönder
    if (err.code === '23505') {
        return res.status(409).json({ message: 'Bu ilan zaten favorilerinizde.' });
    }
    res.status(500).json({ message: 'İlan favorilere eklenemedi.' });
  }
});

// DELETE /api/favorites/:adId -> Bir ilanı favorilerden çıkarır
router.delete('/:adId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { adId } = req.params;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2', [userId, adId]);
    res.json({ message: 'İlan favorilerden kaldırıldı.' });
  } catch (err) {
    console.error('Favori kaldırılırken hata:', err);
    res.status(500).json({ message: 'İlan favorilerden kaldırılamadı.' });
  }
});

// GET /api/favorites/check/:adId -> Belirli bir ilanın favoride olup olmadığını kontrol eder
router.get('/check/:adId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { adId } = req.params;
    try {
        const result = await pool.query('SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND ad_id = $2)', [userId, adId]);
        res.json({ isFavorite: result.rows[0].exists });
    } catch (err) {
        console.error('Favori durumu kontrol edilirken hata:', err);
        res.status(500).json({ message: 'Favori durumu kontrol edilemedi.' });
    }
});


module.exports = router;
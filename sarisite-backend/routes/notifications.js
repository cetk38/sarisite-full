// routes/notifications.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications -> Giriş yapmış kullanıcının bildirimlerini getirir
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, // En yeni en üste
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Bildirimler getirilirken hata:', err);
    res.status(500).json({ message: 'Bildirimler getirilemedi.' });
  }
});

// PATCH /api/notifications/:id/read -> Tek bir bildirimi okundu olarak işaretler
router.patch('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ message: 'Bildirim okundu olarak işaretlendi.' });
  } catch (err) {
    console.error('Bildirim güncellenirken hata:', err);
    res.status(500).json({ message: 'Bildirim güncellenemedi.' });
  }
});

// GET /api/notifications/unread-count -> Okunmamış bildirim sayısını getirir
router.get('/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );
        res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Okunmamış bildirim sayısı alınırken hata:', err);
        res.status(500).json({ message: 'Sayı alınamadı.' });
    }
});

module.exports = router;
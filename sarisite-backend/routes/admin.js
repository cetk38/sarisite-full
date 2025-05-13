// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ✅ Onay bekleyen ilanları getir
router.get('/pending-ads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       WHERE approved = FALSE
       ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Bekleyen ilanlar alınamadı' });
  }
});

// ✅ İlanı onayla
router.patch('/ads/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const adId = req.params.id;
  try {
    await pool.query('UPDATE ads SET approved = TRUE WHERE id = $1', [adId]);
    res.json({ message: 'İlan başarıyla onaylandı' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlan onaylanırken hata oluştu' });
  }
});

// ✅ İlan sil
router.delete('/ads/:id', authenticateToken, requireAdmin, async (req, res) => {
  const adId = req.params.id;
  try {
    await pool.query('DELETE FROM ads WHERE id = $1', [adId]);
    res.json({ message: 'İlan silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlan silinirken hata oluştu' });
  }
});

// ✅ Yeni kategori ekle
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ message: 'Kategori eklendi', category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Kategori eklenirken hata oluştu' });
  }
});

// ✅ Yeni marka ekle (kategoriye bağlı)
router.post('/brands', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO brands (name, category_id) VALUES ($1, $2) RETURNING *',
      [name, category_id]
    );
    res.status(201).json({ message: 'Marka eklendi', brand: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Marka eklenirken hata oluştu' });
  }
});

module.exports = router;

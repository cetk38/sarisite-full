// routes/brands.js

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/brands?categoryId=... -> Seçilen kategoriye ait markaları getirir
router.get('/', async (req, res) => {
  const { categoryId } = req.query; // Parametreyi query'den alıyoruz
  if (!categoryId) {
    return res.status(400).json({ message: 'Kategori ID\'si gereklidir.' });
  }
  try {
    const result = await pool.query('SELECT * FROM brands WHERE category_id = $1 ORDER BY name', [categoryId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Markalar getirilemedi.' });
  }
});

module.exports = router;
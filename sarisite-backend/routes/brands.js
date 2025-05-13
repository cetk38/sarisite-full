// routes/brands.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Belirli kategoriye ait markaları getir
router.get('/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const result = await pool.query(
      'SELECT * FROM brands WHERE category_id = $1 ORDER BY name ASC',
      [categoryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Markalar alınamadı' });
  }
});

module.exports = router;

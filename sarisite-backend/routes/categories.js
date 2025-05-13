// routes/categories.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Tüm kategorileri getir (ör: Emlak, Vasıta, Elektronik)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Kategoriler alınamadı' });
  }
});

module.exports = router;

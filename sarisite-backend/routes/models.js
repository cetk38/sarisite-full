// routes/models.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ Belirli markaya ait modelleri getir
router.get('/:brandId', async (req, res) => {
  const brandId = req.params.brandId;
  try {
    const result = await pool.query(
      'SELECT * FROM models WHERE brand_id = $1 ORDER BY name ASC',
      [brandId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Modeller alınamadı' });
  }
});

module.exports = router;
// routes/models.js

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/models?brandId=... -> Seçilen markaya ait modelleri getirir
router.get('/', async (req, res) => {
  const { brandId } = req.query; // Parametreyi URL'den değil, query'den alıyoruz (?brandId=)
  if (!brandId) {
    return res.status(400).json({ message: 'Marka ID\'si gereklidir.' });
  }
  try {
    const result = await pool.query('SELECT * FROM models WHERE brand_id = $1 ORDER BY name', [brandId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Modeller getirilemedi.' });
  }
});

module.exports = router;
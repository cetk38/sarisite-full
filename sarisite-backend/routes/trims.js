// routes/trims.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/trims?variantId=... -> Seçilen varyanta ait donanımları getirir
router.get('/', async (req, res) => {
  const { variantId } = req.query;
  if (!variantId) {
    return res.status(400).json({ message: 'Varyant ID\'si gereklidir.' });
  }
  try {
    const result = await pool.query('SELECT * FROM trims WHERE variant_id = $1 ORDER BY name', [variantId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Donanımlar getirilemedi.' });
  }
});

module.exports = router;
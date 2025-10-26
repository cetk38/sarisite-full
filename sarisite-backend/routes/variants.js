// routes/variants.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/variants?modelId=... -> Seçilen modele ait varyantları/motorları getirir
router.get('/', async (req, res) => {
  const { modelId } = req.query;
  if (!modelId) {
    return res.status(400).json({ message: 'Model ID\'si gereklidir.' });
  }
  try {
    const result = await pool.query('SELECT * FROM model_variants WHERE model_id = $1 ORDER BY name', [modelId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Varyantlar getirilemedi.' });
  }
});

module.exports = router;
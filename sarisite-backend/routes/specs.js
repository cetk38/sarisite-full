// routes/specs.js (YENİ DOSYA)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/specs/:trimId -> Seçilen donanımın teknik verilerini getirir
router.get('/:trimId', async (req, res) => {
  const { trimId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM technical_specs WHERE trim_id = $1',
      [trimId]
    );
    // Eğer o donanım için teknik veri girilmemişse, boş bir obje döndür (hata verme)
    if (result.rows.length === 0) {
      return res.json({}); 
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Teknik özellikler hatası:', err);
    // Kritik bir hata değil, 500 yerine boş veri dönülebilir ama şimdilik loglayalım
    res.status(500).json({ message: 'Teknik veri alınamadı.' });
  }
});

module.exports = router;
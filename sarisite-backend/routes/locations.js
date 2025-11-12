// routes/locations.js (YENİ DOSYA)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/locations/cities -> Tüm şehirleri getirir
router.get('/cities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "city" ORDER BY "name"');
    res.json(result.rows);
  } catch (err) {
    console.error('Şehirler getirilemedi:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/locations/districts?cityId=38 -> Bir şehre ait ilçeleri getirir
router.get('/districts', async (req, res) => {
  const { cityId } = req.query;
  if (!cityId) {
    return res.status(400).json({ message: 'cityId gereklidir' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM "district" WHERE "city_id" = $1 ORDER BY "name"',
      [cityId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('İlçeler getirilemedi:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/locations/neighborhoods?districtId=123 -> Bir ilçeye ait mahalleleri getirir
router.get('/neighborhoods', async (req, res) => {
    const { districtId } = req.query;
    if (!districtId) {
      return res.status(400).json({ message: 'districtId gereklidir' });
    }
    try {
      // DÜZELTME: "name" yerine "area_name"i seçip, "name" olarak adlandırıyoruz
      const result = await pool.query(
        'SELECT "id", "area_name" AS "name" FROM "neighbourhood" WHERE "district_id" = $1 ORDER BY "name"',
        [districtId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Mahalleler getirilemedi:', err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;
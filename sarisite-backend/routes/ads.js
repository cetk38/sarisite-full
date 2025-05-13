// routes/ads.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ✅ Tüm onaylı ilanları getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       WHERE approved = TRUE
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlanlar getirilemedi' });
  }
});

// ✅ Kullanıcı ilan eklesin (onay bekleyecek)
router.post('/', authenticateToken, async (req, res) => {
  const {
    category_id,
    brand_id,
    model_id,
    price,
    year,
    fuel_type,
    condition,
    description,
    image_url
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ads
        (user_id, category_id, brand_id, model_id, price, year, fuel_type, condition, description, image_url)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.userId,
        category_id,
        brand_id,
        model_id,
        price,
        year,
        fuel_type,
        condition,
        description,
        image_url
      ]
    );

    res.status(201).json({ message: 'İlan eklendi, admin onayı bekleniyor.', ad: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlan eklenirken hata oluştu' });
  }
});

module.exports = router;

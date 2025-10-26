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
// routes/categories.js dosyasının içine ekleyin

// ✅ Sadece Ana Kategorileri Getir (parent_id'si NULL olanlar)
router.get('/main', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ana kategoriler getirilemedi' });
  }
});

// ✅ Belirli bir ana kategoriye ait Alt Kategorileri Getir
router.get('/sub/:parentId', async (req, res) => {
  const { parentId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM categories WHERE parent_id = $1 ORDER BY name', [parentId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Alt kategoriler getirilemedi' });
  }
});

// ✅ Belirli bir kategoriye ait özel form alanlarını getir
router.get('/:id/fields', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT field_name, field_label, field_type FROM category_fields WHERE category_id = $1 ORDER BY id', 
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Kategoriye özel alanlar getirilemedi.' });
  }
});

module.exports = router;

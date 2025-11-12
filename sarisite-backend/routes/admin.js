// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ✅ Onay bekleyen ilanları getir
router.get('/pending-ads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       WHERE approved = FALSE
       ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Bekleyen ilanlar alınamadı' });
  }
});
// Admin'in tek bir ilanı detaylı görmesi için (Marka/Model isimleri dahil!)
router.get('/ads/:id/details', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
            ads.*, 
            users.name AS owner_name,
            brands.name AS brand_name,
            models.name AS model_name,
            model_variants.name AS variant_name,
            trims.name AS trim_name,
            city.name AS city_name,
            district.name AS district_name,
            neighbourhood.area_name AS neighbourhood_name
          FROM ads
          JOIN users ON ads.user_id = users.id
          LEFT JOIN brands ON ads.brand_id = brands.id
          LEFT JOIN models ON ads.model_id = models.id
          LEFT JOIN model_variants ON ads.variant_id = model_variants.id
          LEFT JOIN trims ON ads.trim_id = trims.id
          LEFT JOIN "city" ON ads.city_id = "city".id
          LEFT JOIN "district" ON ads.district_id = "district".id
          LEFT JOIN "neighbourhood" ON ads.neighbourhood_id = "neighbourhood".id
          WHERE ads.id = $1 AND ads.approved = TRUE AND ads.is_active = TRUE
        `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'İlan bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`GET /admin/ads/${id}/details error:`, err);
    res.status(500).json({ message: 'İlan detayları getirilemedi.' });
  }
});
router.get('/all-ads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       ORDER BY ads.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Tüm ilanlar alınamadı' });
  }
});

// ✅ YENİ: Admin'in herhangi bir ilanın YAYIN DURUMUNU (is_active) değiştirmesi için
router.patch('/ads/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body; // { "isActive": true } veya { "isActive": false }

  // Admin olduğu için ilanın sahibini kontrol etmemize gerek yok
  try {
    const updatedAd = await pool.query(
      'UPDATE ads SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    if (updatedAd.rows.length === 0) {
      return res.status(404).json({ message: 'İlan bulunamadı.' });
    }
    res.json({ message: 'İlan durumu admin tarafından güncellendi.', ad: updatedAd.rows[0] });
  } catch (err) {
    console.error(`PATCH /admin/ads/${id}/status error:`, err);
    res.status(500).json({ message: 'İlan durumu güncellenemedi.' });
  }
});
// ✅ İlanı onayla
router.patch('/ads/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const adId = req.params.id;
  try {
    await pool.query('UPDATE ads SET approved = TRUE WHERE id = $1', [adId]);
    res.json({ message: 'İlan başarıyla onaylandı' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlan onaylanırken hata oluştu' });
  }
});

// ✅ İlan sil
router.delete('/ads/:id', authenticateToken, requireAdmin, async (req, res) => {
  const adId = req.params.id;
  try {
    await pool.query('DELETE FROM ads WHERE id = $1', [adId]);
    res.json({ message: 'İlan silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İlan silinirken hata oluştu' });
  }
});

// ✅ Yeni kategori ekle
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ message: 'Kategori eklendi', category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Kategori eklenirken hata oluştu' });
  }
});

// ✅ Yeni marka ekle (kategoriye bağlı)
router.post('/brands', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO brands (name, category_id) VALUES ($1, $2) RETURNING *',
      [name, category_id]
    );
    res.status(201).json({ message: 'Marka eklendi', brand: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Marka eklenirken hata oluştu' });
  }
});




module.exports = router;

const express = require('express');
const router = require('express').Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// --- SPESİFİK GET ROTALARI (PARAMETRESİZ VEYA FARKLI) EN BAŞA ---

// GET /api/ads/ -> Tüm onaylı VE AKTİF ilanları getirir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       WHERE ads.approved = TRUE AND ads.is_active = TRUE
       ORDER BY ads.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET / ads error:', err);
    res.status(500).json({ message: 'İlanlar getirilemedi' });
  }
});

// routes/ads.js -> Sadece bu router.get('/filter',...) bloğunu değiştirin

router.get('/filter', async (req, res) => {
  // Query parametrelerine city ve district eklendi ✅
  const { categoryId, brandId, modelId, variantId, trimId, city, district } = req.query;
  
  // Temel sorgu aynı
  let query = `
    SELECT ads.*, users.name AS owner_name FROM ads 
    JOIN users ON ads.user_id = users.id 
    WHERE ads.approved = TRUE AND ads.is_active = TRUE
  `;
  const params = [];
  let paramIndex = 1;

  // Sayısal ID'leri filtreleme (aynı)
  if (categoryId) { 
    query += ` AND ads.category_id = $${paramIndex++}`; 
    params.push(parseInt(categoryId, 10)); 
  }
  if (brandId) { 
    query += ` AND ads.brand_id = $${paramIndex++}`; 
    params.push(parseInt(brandId, 10)); 
  }
  if (modelId) { 
    query += ` AND ads.model_id = $${paramIndex++}`; 
    params.push(parseInt(modelId, 10)); 
  }
  if (variantId) { 
    query += ` AND ads.variant_id = $${paramIndex++}`; 
    params.push(parseInt(variantId, 10)); 
  }
  if (trimId) { 
    query += ` AND ads.trim_id = $${paramIndex++}`; 
    params.push(parseInt(trimId, 10)); 
  }

  // --- YENİ KONUM FİLTRELERİ EKLENDİ --- ✅
  // ILIKE ile büyük/küçük harf duyarsız ve kısmi eşleşme yapıyoruz
  if (city) { 
    query += ` AND ads.city ILIKE $${paramIndex++}`; 
    params.push(`%${city}%`); // Kısmi eşleşme için % karakterlerini ekle
  }
  if (district) { 
    query += ` AND ads.district ILIKE $${paramIndex++}`; 
    params.push(`%${district}%`); // Kısmi eşleşme için % karakterlerini ekle
  }
  // --- EKLEME BİTTİ ---
  
  // Sıralama aynı
  query += ` ORDER BY ads.created_at DESC`;

  try {
    // Debug logları aynı
    console.log("--- FİLTRELEME SORGUSU ---");
    console.log("Oluşturulan SQL:", query);
    console.log("Kullanılan Parametreler:", params); 
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /filter ads error:', err);
    res.status(500).json({ message: 'İlanlar filtrelenemedi.' });
  }
});

// GET /api/ads/search?q=... -> Açıklamada arama terimini içeren ilanları getirir
router.get('/search', async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.trim() === '') return res.json([]);
    try {
        const query = `SELECT ads.*, users.name AS owner_name FROM ads JOIN users ON ads.user_id = users.id WHERE ads.description ILIKE $1 AND ads.approved = TRUE AND ads.is_active = TRUE ORDER BY ads.created_at DESC LIMIT 20`;
        const params = [`%${searchTerm}%`];
        const result = await pool.query(query, params);
        res.json(result.rows);
      } catch (err) { console.error('GET /search ads error:', err); res.status(500).json({ message: 'Arama sırasında bir hata oluştu.' }); }
});

// GET /api/ads/public/:id -> Herkese açık, tek bir ilanın detaylarını getirir
router.get('/public/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT ads.*, users.name AS owner_name FROM ads
             JOIN users ON ads.user_id = users.id
             WHERE ads.id = $1 AND ads.approved = TRUE AND ads.is_active = TRUE`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'İlan bulunamadı veya artık yayında değil.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`GET /public/${id} ads error:`, err);
        res.status(500).json({ message: 'İlan detayları getirilemedi.' });
    }
});

// --- PARAMETRELİ GET ROTALARI ---

// GET /api/ads/:id -> Düzenlemek için tek bir ilanın tüm detaylarını getirir (Yetki Kontrollü)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const adResult = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
        if (adResult.rows.length === 0) { return res.status(404).json({ message: 'İlan bulunamadı.' }); }
        const ad = adResult.rows[0];
        if (ad.user_id !== userId && !req.user.isAdmin) { return res.status(403).json({ message: 'Bu ilanı görüntüleme yetkiniz yok.' }); }
        res.json(ad);
    } catch (err) { console.error(`GET /ads/${id} error:`, err); res.status(500).json({ message: 'İlan detayları getirilemedi.' }); }
});

// GET /api/ads/category/:categoryId -> Belirli bir kategoriye ait ilanları getirir (ESKİ YÖNTEM, /filter'a yönlendirilebilir ama şimdilik kalsın)
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ads.*, users.name AS owner_name FROM ads
       JOIN users ON ads.user_id = users.id
       WHERE approved = TRUE AND category_id = $1 AND is_active = TRUE
       ORDER BY created_at DESC`,
      [parseInt(categoryId, 10)] // Sayıya çevirdiğimizden emin olalım
    );
    res.json(result.rows);
  } catch (err) {
    console.error(`GET /category/${categoryId} ads error:`, err);
    res.status(500).json({ message: 'Kategoriye ait ilanlar getirilemedi' });
  }
});

// --- POST, PUT, PATCH, DELETE ROTALARI ---

// POST /api/ads -> Yeni ilan oluşturma (En güncel ve doğru hali)
// routes/ads.js -> Sadece bu router.post bloğunu değiştir

router.post('/', authenticateToken, async (req, res) => {
  console.log("Gelen İlan Verisi:", req.body); // Bu log kalsın, çok faydalı
  const {
    // Önceki alanlar (Doğru isimlerle)
    categoryId, brandId, modelId, variantId, trimId,
    price, description, details, image_urls,
    // YENİ KONUM ALANLARI ✅
    city, district, neighborhood, street_address, latitude, longitude
  } = req.body;

  // Gelen verileri uygun tiplere çevirelim
  const category_id_num = parseInt(categoryId, 10);
  const brand_id_num = parseInt(brandId, 10) || null;
  const model_id_num = parseInt(modelId, 10) || null;
  const variant_id_num = parseInt(variantId, 10) || null;
  const trim_id_num = parseInt(trimId, 10) || null;
  const price_num = parseFloat(price);
  // Koordinatları da sayıya çevirelim (veya null) ✅
  const lat_num = latitude ? parseFloat(latitude) : null;
  const lon_num = longitude ? parseFloat(longitude) : null;

  try {
    // SQL sorgusuna YENİ KONUM SÜTUNLARI ve parametreleri ($11-$16) eklendi ✅
    const result = await pool.query(
      `INSERT INTO ads
        (user_id, category_id, brand_id, model_id, variant_id, trim_id, price, description, details, image_urls, approved, is_active, city, district, neighborhood, street_address, latitude, longitude)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, TRUE, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        req.user.userId,    // $1
        category_id_num,    // $2
        brand_id_num,       // $3
        model_id_num,       // $4
        variant_id_num,     // $5
        trim_id_num,        // $6
        price_num,          // $7
        description,        // $8
        details || {},      // $9
        image_urls || [],   // $10
        // YENİ PARAMETRELER ✅
        city || null,       // $11
        district || null,   // $12
        neighborhood || null,// $13
        street_address || null, // $14
        lat_num,          // $15
        lon_num           // $16
      ]
    );
    res.status(201).json({ message: 'İlan eklendi, admin onayı bekleniyor.', ad: result.rows[0] });
  } catch (err) {
    console.error('POST /ads error:', err);
    res.status(500).json({ message: 'İlan eklenirken hata oluştu' });
  }
});
// routes/ads.js -> Sadece bu router.put bloğunu değiştir

// PUT /api/ads/:id -> Bir ilanın bilgilerini günceller (Konum EKLENDİ, Favori Bildirimi Dahil) ✅✅✅
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  // Güncellenecek verilere KONUM ALANLARI eklendi ✅
  const { 
      description, 
      price, 
      details, 
      city, 
      district, 
      neighborhood, 
      street_address, 
      latitude, 
      longitude 
  } = req.body;

  // Gelen verileri uygun tiplere çevirelim
  const newPrice = parseFloat(price);
  const lat_num = latitude ? parseFloat(latitude) : null;
  const lon_num = longitude ? parseFloat(longitude) : null;
  let oldPrice;

  try {
    // 1. Yetki kontrolü ve eski fiyatı alma (aynı)
    const adResult = await pool.query('SELECT user_id, price FROM ads WHERE id = $1', [id]);
    if (adResult.rows.length === 0) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (adResult.rows[0].user_id !== userId) return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    oldPrice = parseFloat(adResult.rows[0].price);

    // 2. SQL UPDATE sorgusuna YENİ KONUM SÜTUNLARI ve parametreleri eklendi ✅
    const updatedAdResult = await pool.query(
      `UPDATE ads SET 
         description = $1, 
         price = $2, 
         details = $3, 
         city = $4, 
         district = $5, 
         neighborhood = $6, 
         street_address = $7, 
         latitude = $8, 
         longitude = $9 
       WHERE id = $10 RETURNING *`,
      [
        description,      // $1
        newPrice,         // $2
        details || {},    // $3
        city || null,       // $4
        district || null,   // $5
        neighborhood || null,// $6
        street_address || null, // $7
        lat_num,          // $8
        lon_num,          // $9
        id                // $10 : WHERE koşulu için ID
      ]
    );
    const updatedAd = updatedAdResult.rows[0];

    if (oldPrice !== newPrice) {
      console.log(`Fiyat değişti! Eski: ${oldPrice}, Yeni: ${newPrice}. Bildirimler gönderilecek.`);
      const favoritedUsers = await pool.query('SELECT user_id FROM favorites WHERE ad_id = $1 AND user_id != $2', [id, userId]);
      for (const row of favoritedUsers.rows) {
        const targetUserId = row.user_id;
        const notificationMessage = `"${updatedAd.description || 'Favori ilanınızın'}" fiyatı değişti: ${newPrice} ₺`;
        await pool.query(
          `INSERT INTO notifications (user_id, type, related_ad_id, message) VALUES ($1, $2, $3, $4)`,
          [targetUserId, 'price_change', id, notificationMessage]
        );
        console.log(`Bildirim gönderildi -> Kullanıcı ID: ${targetUserId}, İlan ID: ${id}`);
      }
    }
    res.json({ message: 'İlan başarıyla güncellendi.', ad: updatedAd });
  } catch (err) {
    console.error(`PUT /ads/${id} error:`, err);
    res.status(500).json({ message: 'İlan güncellenemedi.' });
  }
});

// PATCH /api/ads/:id/status -> İlan durumunu değiştirme
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { isActive } = req.body;
  try {
    const adResult = await pool.query('SELECT user_id FROM ads WHERE id = $1', [id]);
    if (adResult.rows.length === 0) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (adResult.rows[0].user_id !== userId) return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    const updatedAd = await pool.query('UPDATE ads SET is_active = $1 WHERE id = $2 RETURNING *', [isActive, id]);
    res.json({ message: 'İlan durumu güncellendi.', ad: updatedAd.rows[0] });
  } catch (err) { console.error(`PATCH /ads/${id}/status error:`, err); res.status(500).json({ message: 'İlan durumu güncellenemedi.' }); }
});

// DELETE /api/ads/:id -> İlan silme
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    const adResult = await pool.query('SELECT user_id FROM ads WHERE id = $1', [id]);
    if (adResult.rows.length === 0) return res.status(404).json({ message: 'İlan bulunamadı.' });
    if (adResult.rows[0].user_id !== userId) return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    res.json({ message: 'İlan başarıyla silindi.' });
  } catch (err) { console.error(`DELETE /ads/${id} error:`, err); res.status(500).json({ message: 'İlan silinirken bir hata oluştu.' }); }
});

module.exports = router;
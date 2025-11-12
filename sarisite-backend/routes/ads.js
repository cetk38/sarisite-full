const express = require('express');
const router = require('express').Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios'); // <-- YENİ2
const { sendPushNotification } = require('../utils/pushNotifications'); // <-- YENİ

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

// routes/ads.js -> router.get('/filter',...) bloğunu bununla değiştir

// GET /api/ads/filter -> Gelişmiş Filtreleme (ID'li Konum Sistemi)
router.get('/filter', async (req, res) => {
  const { 
    categoryId, brandId, modelId, variantId, trimId, 
    city_id, // <-- Artık ID alıyoruz
    district_id, // <-- Artık ID alıyoruz
    neighbourhood_id, // <-- Artık ID alıyoruz
    min_price, max_price, 
    vites_tipi,
    ...dynamicFilters 
  } = req.query;
  
  let query = `
    SELECT ads.*, users.name AS owner_name FROM ads 
    JOIN users ON ads.user_id = users.id 
    WHERE ads.approved = TRUE AND ads.is_active = TRUE
  `;
  const params = [];
  let paramIndex = 1;

  // ID Filtreleri
  if (categoryId) { query += ` AND ads.category_id = $${paramIndex++}`; params.push(parseInt(categoryId, 10)); }
  if (brandId) { query += ` AND ads.brand_id = $${paramIndex++}`; params.push(parseInt(brandId, 10)); }
  if (modelId) { query += ` AND ads.model_id = $${paramIndex++}`; params.push(parseInt(modelId, 10)); }
  if (variantId) { query += ` AND ads.variant_id = $${paramIndex++}`; params.push(parseInt(variantId, 10)); }
  if (trimId) { query += ` AND ads.trim_id = $${paramIndex++}`; params.push(parseInt(trimId, 10)); }

  // --- YENİ TEMİZ KONUM FİLTRELERİ ---
  if (city_id) { 
    query += ` AND ads.city_id = $${paramIndex++}`; 
    params.push(parseInt(city_id, 10)); 
  }
  if (district_id) { 
    query += ` AND ads.district_id = $${paramIndex++}`; 
    params.push(parseInt(district_id, 10)); 
  }
  if (neighbourhood_id) { 
    query += ` AND ads.neighbourhood_id = $${paramIndex++}`; 
    params.push(parseInt(neighbourhood_id, 10)); 
  }
  // --- BİTTİ ---

  // Fiyat Aralığı
  if (min_price) { query += ` AND ads.price >= $${paramIndex++}`; params.push(parseFloat(min_price)); }
  if (max_price) { query += ` AND ads.price <= $${paramIndex++}`; params.push(parseFloat(max_price)); }

  // Vites Tipi (JSON)
  if (vites_tipi) { 
    query += ` AND (ads.details->>'vites_tipi') = $${paramIndex++}`; 
    params.push(vites_tipi); 
  }
  
  // Dinamik (KM, Yıl) Filtreleri
  const km_min = dynamicFilters.km_min;
  const km_max = dynamicFilters.km_max;
  const yil_min = dynamicFilters.yil_min;
  const yil_max = dynamicFilters.yil_max;
  if (km_min) { query += ` AND (ads.details->>'kilometre')::numeric >= $${paramIndex++}`; params.push(parseInt(km_min, 10)); }
  if (km_max) { query += ` AND (ads.details->>'kilometre')::numeric <= $${paramIndex++}`; params.push(parseInt(km_max, 10)); }
  if (yil_min) { query += ` AND (ads.details->>'model_yili')::numeric >= $${paramIndex++}`; params.push(parseInt(yil_min, 10)); }
  if (yil_max) { query += ` AND (ads.details->>'model_yili')::numeric <= $${paramIndex++}`; params.push(parseInt(yil_max, 10)); }
  
  query += ` ORDER BY ads.created_at DESC`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /filter ads error:', err);
    res.status(500).json({ message: 'İlanlar filtrelenemedi.' });
  }
});

// GET /api/ads/search?q=... -> Açıklamada arama terimini içeren ilanları getirir
// GET /api/ads/search?q=... -> Gelişmiş Akıllı Arama
router.get('/search', async (req, res) => {
  const searchTerm = req.query.q;
  if (!searchTerm || searchTerm.trim() === '') return res.json([]);

  try {
    // Bu sorgu, ilanı sadece kendi başlığında değil,
    // bağlı olduğu marka, model, varyant ve donanım isimlerinde de arar.
    const query = `
      SELECT ads.*, users.name AS owner_name 
      FROM ads 
      JOIN users ON ads.user_id = users.id
      LEFT JOIN brands ON ads.brand_id = brands.id
      LEFT JOIN models ON ads.model_id = models.id
      LEFT JOIN model_variants ON ads.variant_id = model_variants.id
      LEFT JOIN trims ON ads.trim_id = trims.id
      WHERE 
        ads.approved = TRUE AND ads.is_active = TRUE AND
        (
          ads.description ILIKE $1 OR
          brands.name ILIKE $1 OR
          models.name ILIKE $1 OR
          model_variants.name ILIKE $1 OR
          trims.name ILIKE $1
        )
      ORDER BY ads.created_at DESC 
      LIMIT 50`; // Limit'i biraz arttırdık

    const params = [`%${searchTerm.trim()}%`];
    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error('GET /search ads error:', err);
    res.status(500).json({ message: 'Arama sırasında bir hata oluştu.' });
  }
});

// GET /api/ads/public/:id -> Herkese açık, tek bir ilanın detaylarını getirir
// GET /api/ads/public/:id -> Tek bir ilanın detayları (Marka/Model isimleri dahil!)
// GET /api/ads/public/:id -> Herkese açık, tek ilan detayı (Konum isimleri dahil)
router.get('/public/:id', async (req, res) => {
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

// POST /api/ads -> Yeni ilan oluşturma (ID'li Konum Sistemi)
// POST /api/ads -> Yeni ilan oluşturma (HİBRİD KONUM SİSTEMİ)
router.post('/', authenticateToken, async (req, res) => {
  const {
    categoryId, brandId, modelId, variantId, trimId,
    price, description, details, image_urls,
    city_id, district_id, neighbourhood_id,
    street_address, latitude, longitude
  } = req.body;

  const userId = req.user.userId;

  // Gelen verileri hazırla
  let lat = latitude ? parseFloat(latitude) : null;
  let lon = longitude ? parseFloat(longitude) : null;
  let c_id = city_id ? parseInt(city_id, 10) : null;
  let d_id = district_id ? parseInt(district_id, 10) : null;
  let n_id = neighbourhood_id ? parseInt(neighbourhood_id, 10) : null;

  try {
    // -----------------------------------------------------------------
    // HİBRİD MANTIK BAŞLANGICI
    // -----------------------------------------------------------------
    const openCageApiKey = process.env.OPENCAGE_API_KEY;

    // Senaryo 1: Kullanıcı "Konumumu Kullan" dedi (Koordinat var, ID yok)
    if (lat && lon && !c_id) {
      console.log('Senaryo 1: Koordinat var, ID yok. Adres aranıyor...');
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${openCageApiKey}&language=tr`;
      const response = await axios.get(url);
      const components = response.data.results[0]?.components;
      
      if (components) {
        // Gelen adres isimleriyle (örn: "Talas") veritabanımızdan ID'leri bul
        const cityResult = await pool.query('SELECT id FROM "city" WHERE "name" ILIKE $1', [components.city || components.state]);
        if (cityResult.rows.length > 0) c_id = cityResult.rows[0].id;
        
        const districtResult = await pool.query('SELECT id FROM "district" WHERE "name" ILIKE $1 AND "city_id" = $2', [components.city_district, c_id]);
        if (districtResult.rows.length > 0) d_id = districtResult.rows[0].id;
      }
    } 
    // Senaryo 2: Kullanıcı manuel seçti (ID var, Koordinat yok)
    else if (c_id && !lat) {
      console.log('Senaryo 2: ID var, Koordinat yok. Koordinat aranıyor...');
      // ID'lere ait isimleri veritabanından çek
      let addressString = '';
      if (n_id) {
        const nResult = await pool.query('SELECT "area_name" AS name FROM "neighbourhood" WHERE id = $1', [n_id]);
        if (nResult.rows.length > 0) addressString += `${nResult.rows[0].name}, `;
      }
      if (d_id) {
        const dResult = await pool.query('SELECT "name" FROM "district" WHERE id = $1', [d_id]);
        if (dResult.rows.length > 0) addressString += `${dResult.rows[0].name}, `;
      }
      if (c_id) {
        const cResult = await pool.query('SELECT "name" FROM "city" WHERE id = $1', [c_id]);
        if (cResult.rows.length > 0) addressString += cResult.rows[0].name;
      }

      // Adresle koordinat bul (Geocoding)
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(addressString)}&key=${openCageApiKey}&countrycode=tr`;
      const response = await axios.get(url);
      const geometry = response.data.results[0]?.geometry;
      
      if (geometry) {
        lat = geometry.lat;
        lon = geometry.lng;
      }
    }
    // Senaryo 3: Her ikisi de var (İlanı düzenlerken vb.) veya hiçbir şey yoksa (Hata durumu), dokunma.
    // -----------------------------------------------------------------
    // HİBRİD MANTIK BİTTİ
    // -----------------------------------------------------------------

    // Artık veritabanına kayıt atabiliriz (ID'ler ve Koordinatlar dolu olmalı)
    const result = await pool.query(
      `INSERT INTO ads
        (user_id, category_id, brand_id, model_id, variant_id, trim_id, price, description, details, image_urls, approved, is_active, 
         city_id, district_id, neighbourhood_id, street_address, latitude, longitude)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, TRUE, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        userId,
        parseInt(categoryId, 10) || null,
        parseInt(brandId, 10) || null,
        parseInt(modelId, 10) || null,
        parseInt(variantId, 10) || null,
        parseInt(trimId, 10) || null,
        parseFloat(price),
        description,
        details || {},
        image_urls || [],
        c_id,
        d_id,
        n_id,
        street_address || null,
        lat,
        lon
      ]
    );
    res.status(201).json({ message: 'İlan eklendi, admin onayı bekleniyor.', ad: result.rows[0] });
  } catch (err) {
    console.error('POST /ads error:', err);
    res.status(500).json({ message: 'İlan eklenirken bir hata oluştu' });
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
    res.json({ message: 'İlan başarıyla güncellendi.', ad: updatedAd });

    if (oldPrice !== newPrice) {
      console.log(`Fiyat değişti! Eski: ${oldPrice}, Yeni: ${newPrice}. Bildirimler hazırlanıyor...`);
      
      // --- YENİ: Bildirim başlığını duruma göre ayarla ---
      const notificationTitle = newPrice < oldPrice 
        ? 'Fiyat Düştü! 📉'   // Yeni fiyat küçükse
        : 'Fiyat Yükseldi 📈'; // Yeni fiyat büyükse
      // --------------------------------------------------

      // Favorileyenleri çek (kendi hariç)
      const favoritedUsers = await pool.query(
        `SELECT f.user_id, u.push_token 
         FROM favorites f
         JOIN users u ON f.user_id = u.id
         WHERE f.ad_id = $1 AND f.user_id != $2`,
        [id, userId]
      );

      for (const row of favoritedUsers.rows) {
        const targetUserId = row.user_id;
        const targetPushToken = row.push_token;
        const notificationMessage = `"${updatedAd.description || 'Favori ilanınızın'}" fiyatı değişti: ${newPrice} ₺`;

        // A) Veritabanı bildirimi
        await pool.query(
          `INSERT INTO notifications (user_id, type, related_ad_id, message) VALUES ($1, $2, $3, $4)`,
          [targetUserId, 'price_change', id, notificationMessage]
        );

        // B) Push bildirimi
        if (targetPushToken) {
            await sendPushNotification(
                targetPushToken,
                notificationTitle, // <-- DÜZELTİLDİ: Artık dinamik başlık kullanıyoruz
                notificationMessage,
                { adId: id, screen: 'DetailScreen' }
            );
        }
      }
    }
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
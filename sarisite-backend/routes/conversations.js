// routes/conversations.js (YENİ DOSYA)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/conversations -> Giriş yapmış kullanıcının tüm sohbetlerini listeler
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const conversationsResult = await pool.query(
      `SELECT 
        c.id, 
        c.ad_id,
        a.description as ad_description,
        CASE
            WHEN c.buyer_id = $1 THEN u_seller.name
            ELSE u_buyer.name
        END as other_user_name,
        (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.is_read = FALSE) as unread_count
      FROM conversations c
      LEFT JOIN users u_buyer ON c.buyer_id = u_buyer.id
      LEFT JOIN users u_seller ON c.seller_id = u_seller.id
      LEFT JOIN ads a ON c.ad_id = a.id
      WHERE c.buyer_id = $1 OR c.seller_id = $1
      ORDER BY (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) DESC`,
      [userId]
    );
    res.json(conversationsResult.rows);
  } catch (err) {
    console.error('Sohbetler getirilirken hata:', err);
    res.status(500).json({ message: 'Sohbetler getirilemedi.' });
  }
});

// GET /api/conversations/:id -> Tek bir sohbetin tüm mesajlarını getirir
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    // Güvenlik: Kullanıcı bu sohbetin bir parçası mı?
    const convCheck = await pool.query('SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)', [id, userId]);
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bu sohbeti görüntüleme yetkiniz yok.' });
    }

    // Okunmamış mesajları 'okundu' olarak işaretle
    await pool.query('UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND receiver_id = $2', [id, userId]);

    // Mesajları getir
    const messagesResult = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [id]);
    res.json(messagesResult.rows);
  } catch (err) {
    console.error('Mesajlar getirilirken hata:', err);
    res.status(500).json({ message: 'Mesajlar getirilemedi.' });
  }
});

// POST /api/conversations -> Yeni bir sohbet başlatır veya mevcut sohbete mesaj ekler
// routes/conversations.js -> ESKİ router.post'u SİL, BU İKİ YENİSİNİ EKLE

// POST /api/conversations -> YENİ BİR SOHBET BAŞLATIR VE İLK MESAJI ATAR
router.post('/', authenticateToken, async (req, res) => {
  const { adId, body } = req.body;
  const buyerId = req.user.userId; // Sohbeti başlatan her zaman 'buyer'dır
  try {
    const adResult = await pool.query('SELECT user_id FROM ads WHERE id = $1', [adId]);
    if (adResult.rows.length === 0) return res.status(404).json({ message: 'İlan bulunamadı.' });
    
    const sellerId = adResult.rows[0].user_id;
    if (buyerId === sellerId) return res.status(400).json({ message: 'Kendi ilanınıza mesaj gönderemezsiniz.' });

    // Mevcut sohbeti kontrol et
    let convResult = await pool.query('SELECT id FROM conversations WHERE ad_id = $1 AND buyer_id = $2 AND seller_id = $3', [adId, buyerId, sellerId]);
    
    let conversationId;
    if (convResult.rows.length > 0) {
      conversationId = convResult.rows[0].id;
    } else {
      const newConv = await pool.query('INSERT INTO conversations (ad_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id', [adId, buyerId, sellerId]);
      conversationId = newConv.rows[0].id;
    }

    const newMessage = await pool.query('INSERT INTO messages (conversation_id, sender_id, receiver_id, body) VALUES ($1, $2, $3, $4) RETURNING *', [conversationId, buyerId, sellerId, body]);
    res.status(201).json(newMessage.rows[0]);
  } catch (err) {
    console.error('Sohbet başlatılırken hata:', err);
    res.status(500).json({ message: 'Mesaj gönderilemedi.' });
  }
});

// POST /api/conversations/:id/messages -> MEVCUT BİR SOHBETE YENİ MESAJ EKLER
router.post('/:conversationId/messages', authenticateToken, async (req, res) => {
    const { conversationId } = req.params;
    const { body } = req.body;
    const senderId = req.user.userId;
    try {
        // Alıcıyı bulmak için sohbet bilgilerini çek
        const convResult = await pool.query('SELECT buyer_id, seller_id FROM conversations WHERE id = $1', [conversationId]);
        if (convResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sohbet bulunamadı.' });
        }
        
        const { buyer_id, seller_id } = convResult.rows[0];
        // Alıcı, gönderen olmayan kişidir
        const receiverId = senderId === buyer_id ? seller_id : buyer_id;

        const newMessage = await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, receiver_id, body) VALUES ($1, $2, $3, $4) RETURNING *',
            [conversationId, senderId, receiverId, body]
        );
        res.status(201).json(newMessage.rows[0]);
    } catch (err) {
        console.error('Cevap gönderilirken hata:', err);
        res.status(500).json({ message: 'Mesaj gönderilemedi.' });
    }
});
module.exports = router;
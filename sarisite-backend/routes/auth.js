// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
const crypto = require('crypto'); // Token oluşturmak için Node.js'in kendi modülü
const { sendVerificationEmail } = require('../utils/mailer'); // Yeni e-posta servisimizi import ediyoruz

// --- YENİ KAYIT OLMA MANTIĞI ---
router.post('/register', async (req, res) => {
  // Artık telefon numarasını da alıyoruz
  const { name, email, password, phone_number } = req.body;
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }

    // 1. Adım: Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 2. Adım: Benzersiz bir doğrulama token'ı oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 3. Adım: Kullanıcıyı veritabanına doğrulanmamış olarak kaydet
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, phone_number, email_verification_token) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email`,
      [name, email, hashedPassword, phone_number, verificationToken]
    );

    // 4. Adım: Kullanıcıya doğrulama e-postası gönder
    sendVerificationEmail(newUser.rows[0].email, verificationToken);

    // 5. Adım: Frontend'e başarılı yanıt gönder
    res.status(201).json({ message: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin.' });

  } catch (err) {
    console.error('Kayıt sırasında hata:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


// --- YENİ E-POSTA DOĞRULAMA ROTASI ---
router.get('/verify', async (req, res) => {
  const { token } = req.query; // Linkteki token'ı al (örn: ?token=abcdef123)

  if (!token) {
    return res.status(400).send('Doğrulama token\'ı bulunamadı.');
  }

  try {
    // 1. Adım: Token'ı veritabanında ara
    const userResult = await pool.query('SELECT * FROM users WHERE email_verification_token = $1', [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).send('Geçersiz doğrulama linki. Lütfen tekrar deneyin.');
    }

    // 2. Adım: Kullanıcının doğrulama durumunu güncelle ve token'ı sil
    const userId = userResult.rows[0].id;
    await pool.query(
      'UPDATE users SET is_email_verified = TRUE, email_verification_token = NULL WHERE id = $1',
      [userId]
    );

    // 3. Adım: Kullanıcıya başarı mesajı göster
    res.send('<h1>Hesabınız Başarıyla Doğrulandı!</h1><p>Artık uygulamaya giriş yapabilirsiniz.</p>');

  } catch (err) {
    console.error('Doğrulama sırasında hata:', err);
    res.status(500).send('Hesap doğrulanırken bir hata oluştu.');
  }
});


// --- GİRİŞ YAPMA MANTIĞI (login) GÜNCELLENDİ ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    const user = userResult.rows[0];

    // YENİ KONTROL: Kullanıcı e-postasını doğrulamış mı?
    if (!user.is_email_verified) {
      return res.status(403).json({ message: 'Giriş yapmadan önce lütfen e-posta adresinizi doğrulayın.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Giriş başarılı', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
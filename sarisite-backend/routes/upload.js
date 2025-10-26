// routes/upload.js (YENİ DOSYA)
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // Cloudinary storage ayarımızı import ediyoruz
const { authenticateToken } = require('../middleware/auth'); // Kullanıcının giriş yapmış olması gerek

const router = express.Router();
// Multer'ı Cloudinary storage ile yapılandırıyoruz.
// Bu, gelen dosyaları doğrudan Cloudinary'ye gönderecek.
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Opsiyonel: Maksimum dosya boyutu (örn: 10MB)
});

// POST /api/upload -> Resimleri Cloudinary'ye yükler ve URL'leri döndürür
// 'images' -> frontend'den gelecek dosya alanının adı olmalı (FormData'da kullandığımız isim)
// 20 -> tek seferde yüklenebilecek maksimum dosya sayısı (AddAdScreen ile aynı olmalı)
router.post(
    '/', 
    authenticateToken, // Önce kullanıcı giriş yapmış mı diye kontrol et
    upload.array('images', 20), // Sonra resimleri al ve Cloudinary'ye yükle (en fazla 20 tane)
    (req, res) => { // Yükleme bittikten sonra bu fonksiyon çalışır
        try {
            // Multer ve CloudinaryStorage dosyaları yükledikten sonra,
            // req.files içinde yüklenen her dosyanın bilgilerini bize verir.
            if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Yüklenecek resim bulunamadı.' });
            }

            // Yüklenen dosyaların Cloudinary URL'lerini (güvenli URL'ler) alıp bir dizi yapıyoruz
            const imageUrls = req.files.map(file => file.path); // file.path Cloudinary URL'sini içerir

            console.log('Cloudinary\'ye yüklenen resim URL\'leri:', imageUrls); // Yüklenen URL'leri loglayalım

            // Frontend'e başarı cevabı ve URL listesini gönderiyoruz
            res.status(200).json({ imageUrls: imageUrls });

        } catch (error) {
            console.error('Resim yüklenirken API rotasında hata:', error);
            res.status(500).json({ message: 'Resimler yüklenirken sunucuda bir hata oluştu.' });
        }
    }
);

module.exports = router;
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config(); // .env dosyasındaki anahtarları yüklemek için

// Cloudinary hesabını yapılandırıyoruz
// Bu kısım .env dosyasındaki bilgileri okuyarak Cloudinary'ye bağlanmamızı sağlıyor
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Güvenli (https) URL'ler kullanmak için
});

// Multer (dosya yükleme kütüphanesi) için Cloudinary depolama ayarlarını yapıyoruz
// Bu kısım, Multer'a gelen dosyaları nereye ve nasıl yükleyeceğini söylüyor
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sarisite_ilanlari', // Resimlerin Cloudinary'de hangi klasöre yükleneceği
    allowed_formats: ['jpg', 'png', 'jpeg'], // Sadece bu formatlara izin ver
    // İsteğe bağlı: Resimleri yüklerken otomatik olarak yeniden boyutlandırabiliriz
    // Bu, depolama alanından tasarruf etmemizi sağlar ve resimlerin tutarlı olmasını garantiler
    transformation: [{ width: 1024, height: 1024, crop: 'limit' }] 
  },
});

// Bu ayarları projenin başka yerlerinde kullanabilmek için dışa aktarıyoruz
module.exports = {
  cloudinary,
  storage,
};
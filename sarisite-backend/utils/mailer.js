// utils/mailer.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Adım: "Taşıyıcıyı" (Transporter) Oluştur
// Hangi e-posta servisini ve hangi hesap bilgilerini kullanacağımızı belirtiyoruz.
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gmail kullanacağımızı belirtiyoruz
  auth: {
    user: process.env.EMAIL_USER, // .env dosyasından e-posta adresini al
    pass: process.env.EMAIL_PASS  // .env dosyasından uygulama şifresini al
  }
});

// 2. Adım: Doğrulama E-postasını Gönderecek Fonksiyonu Oluştur
const sendVerificationEmail = (toEmail, verificationToken) => {
  // Geliştirme ortamında olduğumuz için, linkin localhost üzerinde çalışmasını sağlıyoruz.
  const verificationLink = `http://localhost:3001/api/auth/verify?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER, // Gönderen adresi
    to: toEmail,                 // Alıcı adresi (kullanıcının girdiği e-posta)
    subject: 'Sarisite Hesap Doğrulama', // E-postanın konusu
    // E-postanın içeriği (HTML formatında)
    html: `
      <h1>Sarisite Hesabınızı Doğrulayın</h1>
      <p>Kaydınızı tamamlamak için lütfen aşağıdaki linke tıklayın:</p>
      <a href="${verificationLink}">Hesabımı Doğrula</a>
      <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    `
  };

  // 3. Adım: E-postayı Gönder
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('E-posta gönderilirken hata oluştu:', error);
    } else {
      console.log('Doğrulama e-postası başarıyla gönderildi:', info.response);
    }
  });
};

module.exports = { sendVerificationEmail };
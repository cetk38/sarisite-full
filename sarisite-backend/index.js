require('dotenv').config(); // <-- Bu satırın en başta ve sadece bir kere olması en iyisidir.

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// --- Mevcut Rotaların ---
const authRoutes = require('./routes/auth');
const adsRoutes = require('./routes/ads');
const adminRoutes = require('./routes/admin');
const categoriesRoutes = require('./routes/categories');
const brandsRoutes = require('./routes/brands');
const modelsRoutes = require('./routes/models'); // <-- Bu zaten vardı ve doğru
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const favoriteRoutes = require('./routes/favorites');
const notificationRoutes = require('./routes/notifications');
// --- YENİ EKLENEN ROTALAR --- ✅
const variantRoutes = require('./routes/variants');
const trimRoutes = require('./routes/trims');
const uploadRoutes = require('./routes/upload');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // bodyParser kullanımı doğru, express.json() da kullanılabilir.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/models', modelsRoutes); // <-- Mevcut rotan korundu
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
// --- YENİ EKLENEN ROTALARIN KULLANIMI --- ✅
app.use('/api/variants', variantRoutes);
app.use('/api/trims', trimRoutes);
app.use('/api/upload', uploadRoutes);
// Health check
app.get('/', (req, res) => {
  res.send('🚀 Sarisite Backend Çalışıyor!');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Sunucu ${PORT} portunda çalışıyor`);
});
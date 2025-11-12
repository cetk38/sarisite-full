// screens/AdminScreen.js -> BU KODU KULLANIN

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { post, get, patch, del } from '../utils/api';
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Her bir ilan kartını oluşturan küçük component
const AdCard = ({ item, onApprove, onDelete, onReview }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{item.description || 'Açıklama Yok'}</Text>
    <Text>Fiyat: {item.price} ₺</Text>
    <Text>Ekleyen: {item.owner_name}</Text>
    <View style={styles.buttonContainer}>
      <Button title="İncele" onPress={() => onReview(item.id)} color={'#17a2b8'} />
      <Button title="Onayla" onPress={() => onApprove(item.id)} color={theme.accent} />
      <Button title="Sil" onPress={() => onDelete(item.id)} color={'#dc3545'} />
    </View>
  </View>
);  

export default function AdminScreen({ navigation }) {
  // Form State'leri
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [brandCategoryId, setBrandCategoryId] = useState('');
  const [newModel, setNewModel] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');

  // İlan Listesi State'leri
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);

 // AdminScreen.js içindeki fetchPendingAds fonksiyonunu bununla değiştirin

const fetchPendingAds = async () => {
  try {
    setLoading(true);
    const ads = await get('/admin/pending-ads', true);

    // --- KORUMA EKLEDİK ---
    // Gelen verinin bir dizi olduğundan emin ol. Değilse, boş bir dizi kullan.
    if (Array.isArray(ads)) {
      setPendingAds(ads);
    } else {
      console.error('API dizi (array) döndürmedi, gelen veri:', ads);
      setPendingAds([]); // Çökmeyi önlemek için state'i her zaman boş bir dizi yap
    }
    // --- KORUMA SONU ---

  } catch (error) {
    console.error('Bekleyen ilanlar alınamadı:', error);
    Alert.alert('Hata', 'İlanlar yüklenirken bir sorun oluştu.');
    setPendingAds([]); // Hata durumunda da state'i boş dizi yap
  } finally {
    setLoading(false);
  }
};

  // Ekran her açıldığında verileri yeniden çek
  useFocusEffect(
    useCallback(() => {
      fetchPendingAds();
    }, [])
  );

  // İlan Onaylama/Silme Fonksiyonları
  const handleApprove = async (adId) => {
    try {
      await patch(`/admin/ads/${adId}/approve`, {}, true);
      Alert.alert('Başarılı', 'İlan onaylandı.');
      fetchPendingAds(); // Listeyi yenile
    } catch (error) {
      Alert.alert('Hata', 'İlan onaylanırken bir sorun oluştu.');
    }
  };

  const handleDelete = async (adId) => {
    try {
      await del(`/admin/ads/${adId}`, true);
      Alert.alert('Başarılı', 'İlan silindi.');
      fetchPendingAds(); // Listeyi yenile
    } catch (error) {
      Alert.alert('Hata', 'İlan silinirken bir sorun oluştu.');
    }
  };
  const handleReview = (adId) => {
  navigation.navigate('DetailScreen', {
    adId: adId,
    isAdminReview: true // DetailScreen'e admin olduğunu söylüyoruz
  });
  };
  // Form Fonksiyonları
  const handleAddCategory = async () => {
    if (!newCategory) return;
    const res = await post('/admin/categories', { name: newCategory }, true);
    res.ok ? (Alert.alert('Başarılı', 'Kategori eklendi'), setNewCategory('')) : Alert.alert('Hata', res.data.message);
  };
  const handleAddBrand = async () => {
    if (!newBrand || !brandCategoryId) return;
    const res = await post('/admin/brands', { name: newBrand, category_id: Number(brandCategoryId) }, true);
    res.ok ? (Alert.alert('Başarılı', 'Marka eklendi'), setNewBrand(''), setBrandCategoryId('')) : Alert.alert('Hata', res.data.message);
  };
  const handleAddModel = async () => {
    if (!newModel || !modelBrandId) return;
    const res = await post('/admin/models', { name: newModel, brand_id: Number(modelBrandId) }, true);
    res.ok ? (Alert.alert('Başarılı', 'Model eklendi'), setNewModel(''), setModelBrandId('')) : Alert.alert('Hata', res.data.message);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Admin Panel</Text>

        {/* ONAY BEKLEYEN İLANLAR BÖLÜMÜ */}
        <View style={styles.section}>
          <Text style={styles.label}>Onay Bekleyen İlanlar</Text>
          {loading ? (
            <Text style={{ color: theme.text }}>Yükleniyor...</Text>
          ) : pendingAds.length === 0 ? (
            <Text style={{ color: theme.text }}>Onay bekleyen ilan bulunmuyor.</Text>
          ) : (
            pendingAds.map(ad => <AdCard key={ad.id} item={ad} onApprove={handleApprove} onDelete={handleDelete} onReview={handleReview} />)
          )}
        </View>
        {/* --- YENİ BÖLÜMÜ BURAYA EKLE --- */}
         <View style={styles.section}>
           <Button 
          title="Tüm İlanları Yönet (Yayındakiler/Kaldırılanlar)" 
          onPress={() => navigation.navigate('ManageAllAds')}
          color={theme.accent} // Veya farklı bir renk
          />
         </View>
        {/* --- YENİ BÖLÜM BİTTİ --- */}
        <View style={styles.separator} />

        {/* KATEGORİ/MARKA/MODEL EKLEME FORMLARI */}
        <View style={styles.section}>
          <Text style={styles.label}>Yeni Kategori Ekle</Text>
          <TextInput style={styles.input} value={newCategory} onChangeText={setNewCategory} placeholder="Örn: Vasıta" />
          <Button title="Kategori Ekle" onPress={handleAddCategory} color={theme.accent} />

          <Text style={styles.label}>Yeni Marka Ekle</Text>
          <TextInput style={styles.input} value={newBrand} onChangeText={setNewBrand} placeholder="Örn: Renault" />
          <TextInput style={styles.input} value={brandCategoryId} onChangeText={setBrandCategoryId} placeholder="Kategori ID" keyboardType="numeric" />
          <Button title="Marka Ekle" onPress={handleAddBrand} color={theme.accent} />

          <Text style={styles.label}>Yeni Model Ekle</Text>
          <TextInput style={styles.input} value={newModel} onChangeText={setNewModel} placeholder="Örn: Clio" />
          <TextInput style={styles.input} value={modelBrandId} onChangeText={setModelBrandId} placeholder="Marka ID" keyboardType="numeric" />
          <Button title="Model Ekle" onPress={handleAddModel} color={theme.accent} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: theme.text,
    fontSize: 18,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
    marginHorizontal: 16,
  },
});
// screens/admin/ManageAllAdsScreen.js (YENİ DOSYA)

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get, patch, del } from '../../utils/api'; // API'ler
import UserAdCard from '../components/UserAdCard'; // Kullanıcının kart component'ini KULLANACAĞIZ
import theme from '../../theme';

export default function ManageAllAdsScreen({ navigation }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    try {
      setLoading(true);
      // 1. Değişiklik: API rotasını admin rotasıyla değiştirdik
      const fetchedAds = await get('/admin/all-ads', true);
      setAds(fetchedAds);
    } catch (error) {
      Alert.alert('Hata', 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAds(); }, []));

  // 2. Değişiklik: API rotasını admin rotasıyla değiştirdik
  const handleToggleStatus = async (adId, newStatus) => {
    try {
      const res = await patch(`/admin/ads/${adId}/status`, { isActive: newStatus }, true);
      if (res.ok) {
        Alert.alert('Başarılı', `İlan durumu güncellendi: ${newStatus ? 'Yayında' : 'Yayından Kaldırıldı'}.`);
        fetchAds();
      } else {
        Alert.alert('Hata', res.data.message || 'İşlem başarısız oldu.');
      }
    } catch (error) {
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  // 3. Değişiklik: API rotasını admin rotasıyla değiştirdik
  const handleDelete = (adId) => {
    Alert.alert(
      'İlanı Sil (Admin)',
      'Bu ilanı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Sil', 
          onPress: async () => {
            try {
              const res = await del(`/admin/ads/${adId}`, true); // Admin silme rotası
              if(res.ok) {
                Alert.alert('Başarılı', 'İlan silindi.');
                fetchAds();
              } else {
                Alert.alert('Hata', res.data.message || 'İlan silinemedi.');
              }
            } catch (error) {
              Alert.alert('Hata', 'İlan silinirken bir sorun oluştu.');
            }
          },
          style: 'destructive'
        },
      ]
    );
  };
  
  // 4. Değişiklik: "Düzenle" butonu admin için "İncele" (DetailScreen) işlevi görecek
  const handleEdit = (adId) => {
    // Admin düzenleme yapmaz, sadece detayları inceler
    navigation.navigate('DetailScreen', {
      adId: adId,
      isAdminReview: true // DetailScreen'e admin olduğunu söylüyoruz
    });
  };

  if (loading) {
    return <ActivityIndicator style={{marginTop: 50}} size="large" color={theme.accent} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserAdCard
            ad={item}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onEdit={handleEdit} // "Düzenle" butonuna basıldığında bizim handleEdit fonksiyonumuzu (yani incelemeyi) çalıştıracak
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Gösterilecek ilan bulunmuyor.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});
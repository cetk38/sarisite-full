// screens/profile/PublishedAdsScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get, patch, del } from '../../utils/api';
import UserAdCard from '../components/UserAdCard';
import theme from '../../theme';

export default function PublishedAdsScreen({ navigation }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const fetchedAds = await get('/users/me/ads?active=true', true);
      setAds(fetchedAds);
    } catch (error) {
      Alert.alert('Hata', 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAds(); }, []));

  // --- HATA AYIKLAMA İÇİN GÜNCELLENDİ ---
  const handleToggleStatus = async (adId, newStatus) => {
    try {
      const res = await patch(`/ads/${adId}/status`, { isActive: newStatus }, true);
      if (res.ok) {
        Alert.alert('Başarılı', 'İlan yayından kaldırıldı.');
        fetchAds();
      } else {
        // Sunucudan gelen hatayı göster
        Alert.alert('Hata', res.data.message || 'İşlem başarısız oldu.');
      }
    } catch (error) {
      console.error("Toggle Status Hatası:", error); // Detaylı hatayı konsola yazdır
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const handleDelete = (adId) => {
    Alert.alert(
      'İlanı Sil',
      'Bu ilanı kalıcı olarak silmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Sil', 
          onPress: async () => {
            try {
              const res = await del(`/ads/${adId}`, true);
              if(res.ok) {
                Alert.alert('Başarılı', 'İlan silindi.');
                fetchAds();
              } else {
                Alert.alert('Hata', res.data.message || 'İlan silinemedi.');
              }
            } catch (error) {
              console.error("Silme Hatası:", error); // Detaylı hatayı konsola yazdır
              Alert.alert('Hata', 'İlan silinirken bir sorun oluştu.');
            }
          },
          style: 'destructive'
        },
      ]
    );
  };
  // --- GÜNCELLEME BİTTİ ---
  
  const handleEdit = (adId) => {
    navigation.navigate('EditAd', { adId: adId });
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
            onEdit={handleEdit}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Yayında olan ilanınız bulunmuyor.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
}); 
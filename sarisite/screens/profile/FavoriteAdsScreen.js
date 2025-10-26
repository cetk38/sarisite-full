// screens/profile/FavoriteAdsScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../utils/api';
import theme from '../../theme';

// AdListScreen'deki AdCard'ın bir benzeri
const AdCard = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('DetailScreen', { adId: item.id })}>
    <View style={styles.adCard}>
      {item.image_urls && item.image_urls[0] && (
        <Image source={{ uri: item.image_urls[0] }} style={styles.adImage} />
      )}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={2}>{item.description || 'İlan'}</Text>
        <Text style={styles.adPrice}>{item.price} ₺</Text>
        <Text style={styles.adOwner}>İlan Sahibi: {item.owner_name}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function FavoriteAdsScreen({ navigation }) {
  const [favoriteAds, setFavoriteAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await get('/favorites', true); // Favorileri çek
      setFavoriteAds(data);
    } catch (error) {
      Alert.alert('Hata', 'Favori ilanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Ekran her açıldığında (veya geri dönüldüğünde) favorileri yeniden çek
  useFocusEffect(useCallback(() => { fetchFavorites(); }, []));

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteAds}
        renderItem={({ item }) => <AdCard item={item} navigation={navigation} />}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz favori ilanınız yok.</Text>}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

// AdListScreen'dekine benzer stiller
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary },
  adCard: { backgroundColor: '#fff', marginHorizontal: 10, marginVertical: 8, borderRadius: 8, elevation: 3, flexDirection: 'row', overflow: 'hidden' },
  adImage: { width: 100, height: 100, backgroundColor: '#eee' },
  adInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  adTitle: { fontSize: 16, fontWeight: 'bold' },
  adPrice: { fontSize: 18, color: theme.accent, fontWeight: 'bold', marginTop: 4 },
  adOwner: { fontSize: 12, color: '#666', marginTop: 'auto' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});
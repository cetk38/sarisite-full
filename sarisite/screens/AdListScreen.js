import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { get } from '../utils/api';
import theme from '../theme';

// AdCard component'ini daha görsel hale getirelim (bir resim ekleyelim)
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

export default function AdListScreen({ route, navigation }) {
  // Artık tek bir ID değil, bir 'filters' nesnesi alıyoruz
  const { filters, filterNames } = route.params || {}; 
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filters) {
      // Eğer bir şekilde filtre olmadan gelinirse hata ver ve dur
      Alert.alert('Hata', 'Filtre bilgisi bulunamadı.');
      setLoading(false);
      return;
    }

    // Filtreleri query string'e çevir: ?categoryId=13&brandId=5...
    const queryString = new URLSearchParams(filters).toString();

    // Backend'deki yeni /filter rotasını çağırıyoruz
    get(`/ads/filter?${queryString}`)
      .then(setAds)
      .catch(err => {
        console.error("İlanlar filtrelenirken hata:", err);
        Alert.alert('Hata', 'İlanlar yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ads}
        renderItem={({ item }) => <AdCard item={item} navigation={navigation} />}
        keyExtractor={(item) => item.id.toString()}
        // Kullanıcının yaptığı seçimleri özetleyen bir başlık ekliyoruz
        ListHeaderComponent={() => (
          <View style={styles.filterSummary}>
            <Text style={styles.filterText}>
              Seçimleriniz: {filterNames ? Object.values(filterNames).join(' > ') : 'Tüm İlanlar'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Bu kriterlere uygun ilan bulunamadı.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  filterSummary: {
    padding: 12,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  filterText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  adCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    flexDirection: 'row',
  },
  adImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  adInfo: {
    flex: 1,
    padding: 10,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adPrice: {
    fontSize: 18,
    color: theme.accent,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  adOwner: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
});
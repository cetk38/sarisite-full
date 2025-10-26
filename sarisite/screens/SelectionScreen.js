import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { get } from '../utils/api';
import theme from '../theme';

export default function SelectionScreen({ route, navigation }) {
  const { 
    title,
    endpoint,
    queryParam,
    paramName,
    nextStep,
    currentFilters,
    filterNames,
    finalScreen // Bu 'AdList' (filtreleme için) veya 'AddAd' (ilan verme için) olacak
  } = route.params;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: title });
    const queryString = new URLSearchParams(queryParam).toString();
    
    get(`${endpoint}?${queryString}`)
      .then(setItems)
      .catch(err => Alert.alert('Hata', 'Veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [endpoint, title]);

  const handleSelect = (item) => {
    const newFilters = { ...currentFilters, [paramName]: item.id };
    const newNames = { ...filterNames, [paramName]: item.name };
    
    if (nextStep) {
      // Sonraki adıma hem ID'leri hem de isimleri gönder
      navigation.push('SelectionScreen', {
        ...nextStep,
        queryParam: { [nextStep.queryKey]: item.id },
        currentFilters: newFilters,
        filterNames: newNames,
        finalScreen: finalScreen
      });
    } else {
      // --- HATA BURADA DÜZELTİLDİ --- ✅
      // Sihirbazın son adımı. Hedef ekrana (finalScreen) git.
      
      if (finalScreen === 'AddAd') {
          // EĞER HEDEF 'AddAd' İSE (İlan Verme Akışı):
          // Önce 'MainTabs' navigator'ına git, SONRA onun içindeki 'AddAd' sekmesini aç
          // ve parametreleri oraya gönder.
          navigation.navigate('MainTabs', { 
            screen: 'AddAd', 
            params: { filters: newFilters, filterNames: newNames } 
          });
      } else if (finalScreen === 'AdList') {
          // EĞER HEDEF 'AdList' İSE (Filtreleme Akışı):
          // Doğrudan 'AdList' ekranına git (bu zaten StackNavigator'da tanımlı)
          // ve parametreleri oraya gönder.
          navigation.navigate('AdList', { 
            filters: newFilters, 
            filterNames: newNames 
          });
      } else {
          // Beklenmedik bir durum olursa (güvenlik önlemi)
          console.error("Bilinmeyen finalScreen:", finalScreen);
          navigation.goBack(); // Ya da ana sayfaya dönülebilir
      }
      // --- DÜZELTME BİTTİ ---
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu kritere uygun seçenek bulunamadı.</Text>}
      />
    </View>
  );
}

// Stillerde değişiklik yok
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingTop: 10 },
  item: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemText: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});
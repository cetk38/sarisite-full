import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { get } from '../utils/api';
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const vehicleFilterSteps = {
  title: 'Marka Seçin',
  endpoint: '/brands',
  paramName: 'brandId',
  queryKey: 'categoryId',
  nextStep: {
    title: 'Model Seçin',
    endpoint: '/models',
    paramName: 'modelId',
    queryKey: 'brandId',
    nextStep: {
      title: 'Motor/Varyant Seçin',
      endpoint: '/variants',
      paramName: 'variantId',
      queryKey: 'modelId',
      nextStep: {
        title: 'Donanım Seçin',
        endpoint: '/trims',
        paramName: 'trimId',
        queryKey: 'variantId',
        nextStep: null
      }
    }
  }
};

export default function SubCategoryScreen({ route, navigation }) {
  const { parentId, categoryName } = route.params;
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: categoryName });
    get(`/categories/sub/${parentId}`)
      .then(setSubCategories)
      .catch(() => Alert.alert("Hata", "Alt kategoriler yüklenemedi."))
      .finally(() => setLoading(false));
  }, [parentId]);

  const handleSelect = (item) => {
    if (item.name === 'Otomobil') {
      navigation.navigate('SelectionScreen', {
        ...vehicleFilterSteps,
        currentFilters: { categoryId: item.id },
        filterNames: { categoryName: item.name },
        queryParam: { categoryId: item.id },
        finalScreen: 'AdList' // <-- KESİNLİKLE 'AdList' OLMALI ✅
      });
    } else {
      navigation.navigate('AdList', { // <-- KESİNLİKLE 'AdList' OLMALI ✅
        filters: { categoryId: item.id },
        filterNames: { categoryName: item.name }
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <View style={styles.container}>
        <FlatList
          data={subCategories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bu kategoride alt kategori bulunmuyor.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.primary, paddingHorizontal: 16, paddingTop: 10, },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  itemContainer: { backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 16, borderRadius: 10, marginVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5, },
  itemText: { fontSize: 18, fontWeight: '500', color: '#333', },
  emptyText: { fontSize: 16, color: theme.text, textAlign: 'center', marginTop: 50, },
});
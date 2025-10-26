// screens/CategoryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { get } from '../utils/api';
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function CategoryScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/ads').then(data => {
      const filtered = data.filter(ad => ad.category_id === categoryId);
      setAds(filtered);
      setLoading(false);
    });
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('DetailScreen', { ad: item })}
    >
      <Text style={styles.title}>{item.description.slice(0, 40)}...</Text>
      <Text>{item.price} ₺</Text>
      <Text>{item.year} - {item.fuel_type}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName} İlanları</Text>
      <FlatList
        data={ads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
  },
  list: {
    gap: 12,
  },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

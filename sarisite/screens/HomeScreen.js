// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { get } from '../utils/api';
import theme from '../theme';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    get('/categories').then(setCategories);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('CategoryScreen', { categoryId: item.id, categoryName: item.name })}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kategoriler</Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.text,
  },
  list: {
    gap: 10,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
});

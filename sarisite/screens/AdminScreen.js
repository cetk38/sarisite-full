// screens/AdminScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { post } from '../utils/api';
import theme from '../theme';

export default function AdminScreen() {
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [brandCategoryId, setBrandCategoryId] = useState('');
  const [newModel, setNewModel] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');

  const handleAddCategory = async () => {
    const res = await post('/admin/categories', { name: newCategory }, true);
    if (res.ok) {
      Alert.alert('Başarılı', 'Kategori eklendi');
      setNewCategory('');
    } else {
      Alert.alert('Hata', res.data.message);
    }
  };

  const handleAddBrand = async () => {
    const res = await post('/admin/brands', { name: newBrand, category_id: Number(brandCategoryId) }, true);
    if (res.ok) {
      Alert.alert('Başarılı', 'Marka eklendi');
      setNewBrand('');
      setBrandCategoryId('');
    } else {
      Alert.alert('Hata', res.data.message);
    }
  };

  const handleAddModel = async () => {
    const res = await post('/admin/models', { name: newModel, brand_id: Number(modelBrandId) }, true);
    if (res.ok) {
      Alert.alert('Başarılı', 'Model eklendi');
      setNewModel('');
      setModelBrandId('');
    } else {
      Alert.alert('Hata', res.data.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.text,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 4,
    color: theme.text,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
});

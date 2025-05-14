// screens/AddAdScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import theme from '../theme';

const API_URL = 'http://localhost:3001/api'; // Gerekirse IP ile değiştir

export default function AddAdScreen() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  const [price, setPrice] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetch(`${API_URL}/brands/${selectedCategory}`).then(res => res.json()).then(setBrands);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedBrand) {
      fetch(`${API_URL}/models/${selectedBrand}`).then(res => res.json()).then(setModels);
    }
  }, [selectedBrand]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitAd = async () => {
    try {
      const token = 'BURAYA_GIRIS_YAPAN_KULLANICININ_TOKENI'; // TODO: AsyncStorage veya Context'ten al

      const response = await fetch(`${API_URL}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: selectedCategory,
          brand_id: selectedBrand,
          model_id: selectedModel,
          price,
          year,
          fuel_type: fuelType,
          condition,
          description,
          image_url: image
        })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Başarılı', 'İlan gönderildi, admin onayı bekleniyor');
      } else {
        Alert.alert('Hata', data.message || 'İlan gönderilemedi');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Sunucu hatası', 'Lütfen daha sonra tekrar deneyin');
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.primary }} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Yeni İlan Ekle</Text>

      <Text style={styles.label}>Kategori</Text>
      {categories.map(cat => (
        <Button key={cat.id} title={cat.name} onPress={() => setSelectedCategory(cat.id)} color={selectedCategory === cat.id ? theme.accent : '#aaa'} />
      ))}

      {brands.length > 0 && <Text style={styles.label}>Marka</Text>}
      {brands.map(brand => (
        <Button key={brand.id} title={brand.name} onPress={() => setSelectedBrand(brand.id)} color={selectedBrand === brand.id ? theme.accent : '#aaa'} />
      ))}

      {models.length > 0 && <Text style={styles.label}>Model</Text>}
      {models.map(model => (
        <Button key={model.id} title={model.name} onPress={() => setSelectedModel(model.id)} color={selectedModel === model.id ? theme.accent : '#aaa'} />
      ))}

      <TextInput style={styles.input} placeholder="Fiyat (₺)" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <TextInput style={styles.input} placeholder="Yıl" keyboardType="numeric" value={year} onChangeText={setYear} />
      <TextInput style={styles.input} placeholder="Yakıt Tipi" value={fuelType} onChangeText={setFuelType} />
      <TextInput style={styles.input} placeholder="Durum (Sıfır/İkinci El)" value={condition} onChangeText={setCondition} />
      <TextInput style={styles.input} placeholder="Açıklama" value={description} onChangeText={setDescription} multiline />

      <Button title="Görsel Seç" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <View style={{ marginVertical: 20 }}>
        <Button title="İlanı Gönder" onPress={submitAd} color={theme.accent} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: theme.text },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  image: {
    marginTop: 12,
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});

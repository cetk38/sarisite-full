// screens/profile/EditAdScreen.js (YENİ DOSYA)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { get, put } from '../../utils/api';
import theme from '../../theme';

export default function EditAdScreen({ route, navigation }) {
  const { adId } = route.params; // Bir önceki ekrandan gelen ilan ID'si

  const [ad, setAd] = useState(null); // İlanın mevcut verileri
  const [dynamicFields, setDynamicFields] = useState([]); // Kategoriye özel alanlar
  const [loading, setLoading] = useState(true);

  // Sayfa ilk açıldığında, ilanın ve kategoriye özel alanların bilgilerini çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. İlanın kendi bilgilerini çek
        const adData = await get(`/ads/${adId}`, true);
        setAd({
          description: adData.description,
          price: adData.price.toString(), // TextInput için string olmalı
          details: adData.details || {},
        });

        // 2. İlanın kategorisine ait özel alanları çek
        const fieldsData = await get(`/categories/${adData.category_id}/fields`);
        setDynamicFields(fieldsData);
      } catch (error) {
        Alert.alert('Hata', 'İlan bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adId]);

  // Formdaki bir alanı güncellemek için yardımcı fonksiyon
  const handleInputChange = (field, value, isDynamic = false) => {
    if (isDynamic) {
      setAd(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
    } else {
      setAd(prev => ({ ...prev, [field]: value }));
    }
  };
  
  // "Kaydet" butonuna basıldığında çalışacak fonksiyon
  const handleUpdateAd = async () => {
      try {
          setLoading(true);
          const res = await put(`/ads/${adId}`, {
              description: ad.description,
              price: Number(ad.price),
              details: ad.details,
          }, true);
          
          if (res.ok) {
              Alert.alert('Başarılı', 'İlan güncellendi.');
              navigation.goBack(); // Bir önceki sayfaya geri dön
          } else {
              Alert.alert('Hata', res.data.message || 'Güncelleme başarısız oldu.');
          }
      } catch (error) {
          Alert.alert('Hata', 'İlan güncellenirken bir sorun oluştu.');
      } finally {
          setLoading(false);
      }
  };

  if (loading || !ad) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>İlanı Düzenle</Text>

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={styles.input}
          value={ad.description}
          onChangeText={(text) => handleInputChange('description', text)}
          multiline
        />

        <Text style={styles.label}>Fiyat (₺)</Text>
        <TextInput
          style={styles.input}
          value={ad.price}
          onChangeText={(text) => handleInputChange('price', text)}
          keyboardType="numeric"
        />

        {/* Dinamik Alanlar */}
        {dynamicFields.map(field => (
          <View key={field.field_name}>
            <Text style={styles.label}>{field.field_label}</Text>
            <TextInput
              style={styles.input}
              value={String(ad.details[field.field_name] || '')}
              onChangeText={(text) => handleInputChange(field.field_name, text, true)}
              keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
            />
          </View>
        ))}

        <View style={{ marginTop: 20 }}>
          <Button title="Değişiklikleri Kaydet" onPress={handleUpdateAd} color={theme.accent} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
});
// screens/components/DynamicFilterBox.js (TAM VE EKSİKSİZ KOD)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { get } from '../../utils/api';
import { Picker } from '@react-native-picker/picker'; // Bu kütüphaneyi yüklediğinden emin ol
import theme from '../../theme';
import { useNavigation } from '@react-navigation/native';

// Küçük bir Fiyat/KM aralığı component'i
const RangeInput = ({ label, values, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Min"
        keyboardType="numeric"
        value={values[0]}
        onChangeText={text => onChange(text, values[1])}
      />
      <TextInput
        style={styles.input}
        placeholder="Max"
        keyboardType="numeric"
        value={values[1]}
        onChangeText={text => onChange(values[0], text)}
      />
    </View>
  </View>
);

export default function DynamicFilterBox() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  // Tüm filtre değerlerini burada tutacağız
  const [filters, setFilters] = useState({
    categoryId: '',
    subCategoryId: '',
    min_price: '',
    max_price: '',
    km_min: '',
    km_max: '',
    yil_min: '',
    yil_max: '',
    brandId: '',
    modelId: '',
    vites_tipi: '',
  });

  // Ana kategorileri yükle
  useEffect(() => {
    get('/categories/main').then(setMainCategories);
  }, []);

  // Ana kategori seçildiğinde alt kategorileri yükle
  const handleMainCategorySelect = (categoryId) => {
    setLoading(true);
    // Önceki seçimleri temizle
    setSubCategories([]);
    setBrands([]);
    setModels([]);
    setDynamicFields([]);
    setFilters({ // Tüm filtreleri sıfırla, sadece ana kategoriyi ayarla
        categoryId: categoryId,
        subCategoryId: '', min_price: '', max_price: '', km_min: '', km_max: '',
        yil_min: '', yil_max: '', brandId: '', modelId: '', vites_tipi: '',
    });

    if (categoryId) {
      get(`/categories/sub/${categoryId}`)
        .then(setSubCategories)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  // Alt kategori seçildiğinde dinamik alanları VE markaları yükle
  const handleSubCategorySelect = (subCategoryId) => {
    setLoading(true);
    // Önceki seçimleri temizle
    setBrands([]);
    setModels([]);
    setDynamicFields([]);
    setFilters(prev => ({ 
        ...prev, 
        subCategoryId: subCategoryId, 
        brandId: '', 
        modelId: '' 
    }));

    if (subCategoryId) {
      // Hem dinamik alanları hem de markaları aynı anda iste
      Promise.all([
        get(`/categories/${subCategoryId}/fields`),
        get(`/brands?categoryId=${subCategoryId}`)
      ])
      .then(([fieldsData, brandsData]) => {
        setDynamicFields(fieldsData);
        setBrands(brandsData);
      })
      .catch(err => Alert.alert('Hata', 'Kategori detayları alınamadı.'))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  // Marka seçildiğinde modelleri çeken yeni fonksiyon
  const handleBrandSelect = (brandId) => {
    setLoading(true);
    setModels([]);
    setFilters(prev => ({ ...prev, brandId: brandId, modelId: '' }));
    
    if (brandId) {
      get(`/models?brandId=${brandId}`)
        .then(setModels)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  // Filtreleri uygulayıp ilan listesi ekranına git
  const applyFilters = () => {
    navigation.navigate('AdList', { 
        filters: {
            categoryId: filters.subCategoryId || filters.categoryId,
            min_price: filters.min_price || null,
            max_price: filters.max_price || null,
            km_min: filters.km_min || null,
            km_max: filters.km_max || null,
            yil_min: filters.yil_min || null,
            yil_max: filters.yil_max || null,
            brandId: filters.brandId || null,
            modelId: filters.modelId || null,
            vites_tipi: filters.vites_tipi || null,
        },
        filterNames: { filter: "Detaylı Arama" }
    });
  };

  // DİKKAT: 'return' burada, tüm fonksiyonların İÇERİSİNDE olmalı
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detaylı Filtreleme</Text>
      
      {/* 1. Ana Kategori Seçimi */}
      <Picker
        selectedValue={filters.categoryId}
        onValueChange={(itemValue) => handleMainCategorySelect(itemValue)}
      >
        <Picker.Item label="Ana Kategori Seçin..." value="" />
        {mainCategories.map(cat => (
          <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
        ))}
      </Picker>

      {/* 2. Alt Kategori Seçimi */}
      {subCategories.length > 0 && (
        <Picker
          selectedValue={filters.subCategoryId}
          onValueChange={(itemValue) => handleSubCategorySelect(itemValue)}
        >
          <Picker.Item label="Alt Kategori Seçin..." value="" />
          {subCategories.map(cat => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>
      )}

      {/* Yükleniyor Göstergesi */}
      {loading && <ActivityIndicator size="small" color={theme.accent} style={{marginVertical: 10}} />}

      {/* 3. Marka, Model ve Dinamik Alanlar (Alt kategori seçilince) */}
      {!loading && (filters.subCategoryId || filters.brandId) && (
        <>
          {/* Marka Seçimi */}
          {brands.length > 0 && (
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Marka</Text>
                <Picker
                selectedValue={filters.brandId}
                onValueChange={(itemValue) => handleBrandSelect(itemValue)}
                >
                <Picker.Item label="Tümü" value="" />
                {brands.map(brand => (
                    <Picker.Item key={brand.id} label={brand.name} value={brand.id} />
                ))}
                </Picker>
            </View>
          )}

          {/* Model Seçimi */}
          {models.length > 0 && (
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Model</Text>
                <Picker
                selectedValue={filters.modelId}
                onValueChange={(itemValue) => setFilters(prev => ({...prev, modelId: itemValue}))}
                >
                <Picker.Item label="Tümü" value="" />
                {models.map(model => (
                    <Picker.Item key={model.id} label={model.name} value={model.id} />
                ))}
                </Picker>
            </View>
          )}

          {/* Fiyat Aralığı (Her zaman görünür) */}
          <RangeInput 
            label="Fiyat Aralığı (₺)"
            values={[filters.min_price, filters.max_price]}
            onChange={(min, max) => setFilters(prev => ({...prev, min_price: min, max_price: max}))}
          />
          
          {/* KM Aralığı (Dinamik) */}
          {dynamicFields.find(f => f.field_name === 'kilometre') && (
             <RangeInput 
                label="KM Aralığı"
                values={[filters.km_min, filters.km_max]}
                onChange={(min, max) => setFilters(prev => ({...prev, km_min: min, km_max: max}))}
              />
          )}
          
          {/* Yıl Aralığı (Dinamik) */}
          {dynamicFields.find(f => f.field_name === 'model_yili') && (
             <RangeInput 
                label="Yıl Aralığı"
                values={[filters.yil_min, filters.yil_max]}
                onChange={(min, max) => setFilters(prev => ({...prev, yil_min: min, yil_max: max}))}
              />
          )}

          {/* Vites Tipi (Dinamik) */}
          {dynamicFields.find(f => f.field_name === 'vites_tipi') && (
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Vites Tipi</Text>
                <Picker
                selectedValue={filters.vites_tipi}
                onValueChange={(itemValue) => setFilters(prev => ({...prev, vites_tipi: itemValue}))}
                >
                <Picker.Item label="Tümü" value="" />
                <Picker.Item label="Manuel" value="Manuel" />
                <Picker.Item label="Otomatik" value="Otomatik" />
                <Picker.Item label="Yarı Otomatik" value="Yarı Otomatik" />
                </Picker>
            </View>
          )}
        </>
      )}

      <Button title="Filtreyi Uygula" onPress={applyFilters} color={theme.accent} />
    </View>
  );
} // <-- ANA FONKSİYONUN KAPANIŞ PARANTEZİ (119'dan önce eksik olan buydu)

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  inputGroup: { marginVertical: 8 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginHorizontal: 2,
  }
});
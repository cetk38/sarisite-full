import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { get, post, BASE_URL } from '../utils/api';
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VehiclePaintStatusSelector from './components/VehiclePaintStatusSelector';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker'; // <-- YENİ

// ... (vehicleFilterSteps objesi aynı kalıyor) ...
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


export default function AddAdScreen({ route, navigation }) {
  const [step, setStep] = useState(1);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [vehicleSelections, setVehicleSelections] = useState({});
  const [commonDetails, setCommonDetails] = useState({ price: '', description: '' });
  const [dynamicDetails, setDynamicDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paintStatusData, setPaintStatusData] = useState({});
  
  // --- YENİ KONUM STATE'LERİ ---
  const [locationLoading, setLocationLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  // ESKİ locationData'yı YENİSİYLE DEĞİŞTİR (Artık ID tutacak)
  const [locationData, setLocationData] = useState({
      city_id: '',
      district_id: '',
      neighbourhood_id: '',
      street_address: '', // Bu metin olarak kalacak
      latitude: null,
      longitude: null,
  });
  // --- BİTTİ ---

  // 1. Adım için ana kategorileri çek
  useEffect(() => {
    get('/categories/main').then(setMainCategories);
  }, []);

  // 2. Adım: Şehir listesini bir kere çek
  useEffect(() => {
    get('/locations/cities').then(setCities);
  }, []);

  // İzin isteme (Galeri ve Konum)
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Reddedildi', 'Konum izni vermeniz gerekiyor.');
      }
    })();
  }, []);

  // Sihirbazdan dönünce (A4 40 TDI seçilince)
  useEffect(() => {
    if (route.params?.filters && route.params?.filterNames) { 
      const filters = route.params.filters;
      const names = route.params.filterNames;
      
      setVehicleSelections(filters);
      const subCatId = filters.categoryId;
      const subCatName = names.categoryName;

      if (subCatId && subCatName) {
        setSelectedSubCategory({ id: subCatId, name: subCatName }); 
      }
      
      setLoading(true);
      get(`/categories/${subCatId}/fields`)
        .then(async (data) => {
          setDynamicFields(data);
          const initialDynamicState = {};
          data.forEach(field => { initialDynamicState[field.field_name] = ''; });

          if (filters.trimId) {
            try {
              const specs = await get(`/specs/${filters.trimId}`);
              for (const key in specs) {
                 if (initialDynamicState.hasOwnProperty(key) && specs[key] != null) {
                     initialDynamicState[key] = String(specs[key]);
                 }
              }
            } catch (error) {
              console.log("Teknik veri otomatik doldurulamadı:", error);
            }
          }
          setDynamicDetails(initialDynamicState);
        })
        .catch(() => Alert.alert('Hata', 'Alanlar yüklenemedi.'))
        .finally(() => { setLoading(false); setStep(3); });
    }
  }, [route.params?.filters, route.params?.filterNames]);

  // --- KATEGORİ SEÇİM FONKSİYONLARI (Aynı) ---
  const handleMainCategorySelect = (category) => {
    setLoading(true);
    get(`/categories/sub/${category.id}`)
      .then(setSubCategories)
      .finally(() => { setLoading(false); setStep(2); });
  };
  const handleSubCategorySelect = (category) => {
    setSelectedSubCategory(category);
    setDynamicFields([]);
    setDynamicDetails({});
    if (category.name === 'Otomobil') {
      navigation.navigate('SelectionScreen', {
        ...vehicleFilterSteps,
        currentFilters: { categoryId: category.id },
        filterNames: { categoryName: category.name },
        queryParam: { categoryId: category.id },
        finalScreen: 'AddAd'
      });
    } else {
      get(`/categories/${category.id}/fields`).then(data => {
        setDynamicFields(data);
        const initialDynamicState = {};
        data.forEach(field => { initialDynamicState[field.field_name] = ''; });
        setDynamicDetails(initialDynamicState);
        setStep(3);
      });
    }
  };
  
  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });
    if (!result.canceled) {
      setImages(result.assets.map(asset => asset.uri));
    }
  };
  
  const handlePaintStatusChange = (status) => {
    setPaintStatusData(status);
  };

  // --- YENİ KONUM SEÇİM FONKSİYONLARI ---
  const handleCitySelect = (cityId) => {
      setLocationData(prev => ({
          ...prev,
          city_id: cityId,
          district_id: '',
          neighbourhood_id: '',
      }));
      setDistricts([]);
      setNeighborhoods([]);
      if (cityId) {
          get(`/locations/districts?cityId=${cityId}`).then(setDistricts);
      }
  };
  const handleDistrictSelect = (districtId) => {
      setLocationData(prev => ({
          ...prev,
          district_id: districtId,
          neighbourhood_id: '',
      }));
      setNeighborhoods([]);
      if (districtId) {
          get(`/locations/neighborhoods?districtId=${districtId}`).then(setNeighborhoods);
      }
  };
  // --- BİTTİ ---

  // --- MEVCUT KONUMU KULLAN (HİBRİT PLANA GÖRE GÜNCELLENDİ) ---
  const handleGetLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert('İzin Reddedildi', 'Konum izni verilmedi.');
          return;
      }
      setLocationLoading(true);
      try {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;

          // 1. Koordinatları state'e kaydet (Backend'e göndermek için)
          setLocationData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lon,
          }));

          // 2. Adresi bulmak için koordinatları Google/OpenCage yerine Expo'ya sor (REVERSE GEOCODING)
          let addressResult = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          
          if (addressResult && addressResult.length > 0) {
              const addr = addressResult[0];
              const cityName = addr.city || addr.subregion; // Bazen 'city' null gelir, 'subregion' (il) olur
              const districtName = addr.district || addr.subregion; // Bazen 'district' (ilçe) null gelir
              
              // 3. Picker'ları otomatik doldurmak için ID'leri bul
              // (Bu kısım için backend'e "isimden ID bul" rotası eklemek en temizi olur,
              // şimdilik sadece metinleri state'e basıyoruz)
              
              // TODO: Backend'e /locations/find?city=Kayseri&district=Talas gibi bir rota ekleyip
              // city_id ve district_id'yi çekmek en sağlıklısı olur.
              // Şimdilik sadece metinleri dolduralım:
              setLocationData(prev => ({
                ...prev,
                street_address: `${addr.streetNumber || ''} ${addr.street || ''}`.trim(),
                // Not: city_id ve district_id'yi dolduramadık, çünkü elimizde isim var, ID yok.
                // Bu yüzden kullanıcıya Picker'ları manuel seçtirtebiliriz veya
                // backend'e "isimden-id-bul" rotası ekleyebiliriz.
              }));
              Alert.alert('Konum Bulundu!', `Konumunuz: ${cityName}, ${districtName}. İlanınıza eklendi.`);
          } else {
            Alert.alert('Başarılı', 'Koordinatlarınız alındı ancak adres detayı bulunamadı.');
          }
      } catch (error) {
          console.error("Konum alınırken hata:", error);
          Alert.alert('Hata', 'Konum bilgisi alınamadı.');
      } finally {
          setLocationLoading(false);
      }
  };

  // --- İLANI GÖNDER (YENİ KONUM YAPISINA GÖRE GÜNCELLENDİ) ---
  const submitAd = async () => {
    if (images.length === 0) { Alert.alert('Hata', 'Lütfen en az bir resim seçin.'); setStep(3); return; }

    setLoading(true);
    setIsUploading(true);
    
    // 1. Resimleri Yükle (Bu kısım aynı)
    let uploadedImageUrls = [];
    try {
      const formData = new FormData();
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        let fileType = uri.split('.').pop();
        
        formData.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: fileName || `photo_${index}.${fileType || 'jpg'}`,
          type: `image/${fileType || 'jpeg'}`,
        });
      });

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token bulunamadı');

      const uploadResponse = await fetch(`${BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errorMessage = 'Resimler yüklenemedi.';
        try { errorMessage = JSON.parse(errorText).message || errorMessage; } catch (e) {}
        throw new Error(errorMessage);
      }
       const uploadResult = await uploadResponse.json();
       if (!uploadResult.imageUrls || uploadResult.imageUrls.length === 0) {
           throw new Error('Sunucudan geçerli resim URL\'leri alınamadı.');
       }
      uploadedImageUrls = uploadResult.imageUrls;
    } catch (uploadError) {
      console.error("Resim yükleme hatası:", uploadError);
      Alert.alert('Resim Yükleme Hatası', `Resimler yüklenirken bir sorun oluştu: ${uploadError.message}`);
      setIsUploading(false);
      setLoading(false);
      return;
    }
    setIsUploading(false);

    // --- 2. İlanı Gönder (finalData GÜNCELLENDİ) ---
    const finalData = {
      categoryId: selectedSubCategory?.id,
      ...vehicleSelections,
      price: Number(commonDetails.price),
      description: commonDetails.description,
      details: {
          ...dynamicDetails,
          boya_degisen: paintStatusData
      },
      image_urls: uploadedImageUrls,
      
      // --- YENİ KONUM VERİLERİ (ID'ler ve Metinler) ---
      city_id: locationData.city_id,
      district_id: locationData.district_id,
      neighbourhood_id: locationData.neighbourhood_id,
      street_address: locationData.street_address,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      // ---------------------------------------------
    };

    console.log("Sunucuya Gönderilecek İlan Verisi:", JSON.stringify(finalData, null, 2));

    try {
      const res = await post('/ads', finalData, true);
      if (res.ok) {
        Alert.alert('Başarılı', 'İlanınız onaya gönderildi.', [
          { text: 'Tamam', onPress: () => { 
              // Formu sıfırla ve ana sayfaya dön
              setStep(1);
              setImages([]);
              setCommonDetails({ price: '', description: '' });
              setDynamicDetails({});
              setLocationData({ city_id: '', district_id: '', neighbourhood_id: '', street_address: '', latitude: null, longitude: null });
              setVehicleSelections({});
              setSelectedSubCategory(null);
              navigation.navigate('HomeStack');
            } 
          }
        ]);
      } else {
        Alert.alert('Hata', res.data.message || 'İlan gönderilemedi.');
      }
    } catch (error) {
      console.error("İlan gönderme hatası:", error);
      Alert.alert('Hata', 'İlan gönderilirken bir sunucu hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formdaki bir alanı güncellemek için yardımcı fonksiyon
  const handleInputChange = (field, value, isDynamic = false) => {
    if (isDynamic) {
      setDynamicDetails(prev => ({ ...prev, [field]: value }));
    } else {
      setCommonDetails(prev => ({ ...prev, [field]: value }));
    }
  };

  // --- Navigasyon Fonksiyonları (Aynı) ---
  const handleNextFromImages = () => {
      setStep(selectedSubCategory?.name === 'Otomobil' ? 4 : 5);
  };
  const goBack = () => {
    setStep(prev => {
        if (prev === 5) { return selectedSubCategory?.name === 'Otomobil' ? 4 : 3; }
        if (prev === 4) { return 3; }
        if (prev === 3) { return 2; }
        if (prev === 2) { return 1; }
        return 1;
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        {isUploading && <Text style={styles.loadingText}>Resimler yükleniyor...</Text>}
      </View>
    );
  }

  // --- JSX (RENDER KISMI) ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Yeni İlan Ekle (Adım {step}/5)</Text>

        {step > 1 && <Button title="< Geri" onPress={goBack} />}

        {/* Adım 1: Ana Kategori Seçimi */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Önce bir ana kategori seçin</Text>
            {mainCategories.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard} onPress={() => handleMainCategorySelect(cat)}>
                <MaterialCommunityIcons name={cat.icon_name || 'tag-outline'} size={24} color={theme.accent} />
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Adım 2: Alt Kategori Seçimi */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Şimdi de alt kategoriyi seçin</Text>
            {subCategories.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard} onPress={() => handleSubCategorySelect(cat)}>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Adım 3: Resim Yükleme (İleri Butonu Güncellendi) ✅ */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>İlan resimlerini yükleyin (en fazla 20)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
              <MaterialCommunityIcons name="image-plus" size={40} color={theme.accent} />
              <Text>Resim Seç</Text>
            </TouchableOpacity>
            <View style={styles.imagePreviewContainer}>
              {images.map((uri, index) => <Image key={index} source={{ uri }} style={styles.previewImage} />)}
            </View>
            {/* İleri butonu artık handleNextFromImages fonksiyonunu çağırıyor */}
            <Button 
              title="İleri" 
              onPress={handleNextFromImages} 
              disabled={images.length === 0} 
            />
          </View>
        )}
        
        {/* Adım 4: Boya/Değişen (Gösterim Koşulu Güncellendi) ✅ */}
        {/* ÖNEMLİ: Koşulu tekrar kontrol ediyoruz */}
        {step === 4 && selectedSubCategory?.name === 'Otomobil' && (
          <View>
            <Text style={styles.stepTitle}>Aracın Boya ve Değişen Durumunu İşaretleyin</Text>
            <VehiclePaintStatusSelector 
              initialStatus={paintStatusData} 
              onStatusChange={handlePaintStatusChange} 
            />
            <Button title="İleri" onPress={() => setStep(5)} /> 
          </View>
        )}
        
        {/* --- ADIM 5 (KONUM BÖLÜMÜ GÜNCELLENDİ) --- */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Son olarak ilan detaylarını girin</Text>
            
            <Text style={styles.label}>Fiyat (₺)</Text>
            <TextInput style={styles.input} value={commonDetails.price} onChangeText={text => handleInputChange('price', text)} keyboardType="numeric" />
            
            <Text style={styles.label}>Açıklama</Text>
            <TextInput style={styles.input} value={commonDetails.description} onChangeText={text => handleInputChange('description', text)} multiline />

            {/* Dinamik Alanlar (Akıllı Render) */}
            {dynamicFields.map(field => {
              // ----- VİTES TİPİ İSE PICKER GÖSTER -----
              if (field.field_name === 'vites_tipi') {
                return (
                  <View key={field.field_name}>
                    <Text style={styles.label}>{field.field_label}</Text>
                    <View style={styles.pickerContainer}> 
                      <Picker
                        selectedValue={dynamicDetails[field.field_name] || ''}
                        onValueChange={value => handleInputChange(field.field_name, value, true)}
                      >
                        <Picker.Item label="Vites Tipi Seçiniz..." value="" />
                        <Picker.Item label="Manuel" value="Manuel" />
                        <Picker.Item label="Otomatik" value="Otomatik" />
                        <Picker.Item label="Yarı Otomatik" value="Yarı Otomatik" />
                      </Picker>
                    </View>
                  </View>
                );
              }
              
              // ----- DİĞER TÜM ALANLAR İÇİN TEXTINPUT GÖSTER -----
              return (
                <View key={field.field_name}>
                  <Text style={styles.label}>{field.field_label}</Text>
                  <TextInput 
                    style={styles.input}
                    value={String(dynamicDetails[field.field_name] || '')} 
                    onChangeText={text => handleInputChange(field.field_name, text, true)}
                    keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
                    placeholder={field.field_label}
                  />
                </View>
              );
            })}
            
            {/* --- YENİ KONUM ALANLARI (PICKER İLE) --- */}
            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
            
            <Text style={styles.label}>Şehir</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={locationData.city_id}
                onValueChange={(itemValue) => handleCitySelect(itemValue)}
              >
                <Picker.Item label="İl Seçiniz..." value="" />
                {cities.map(city => (
                  <Picker.Item key={city.id} label={city.name} value={city.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>İlçe</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={locationData.district_id}
                onValueChange={(itemValue) => handleDistrictSelect(itemValue)}
                enabled={districts.length > 0}
              >
                <Picker.Item label="İlçe Seçiniz..." value="" />
                {districts.map(dist => (
                  <Picker.Item key={dist.id} label={dist.name} value={dist.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Mahalle</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={locationData.neighbourhood_id}
                onValueChange={(itemValue) => setLocationData(prev => ({...prev, neighbourhood_id: itemValue}))}
                enabled={neighborhoods.length > 0}
              >
                <Picker.Item label="Mahalle Seçiniz..." value="" />
                {neighborhoods.map(hood => (
                  <Picker.Item key={hood.id} label={hood.name} value={hood.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Açık Adres (Opsiyonel)</Text>
            <TextInput 
              style={styles.input} 
              value={locationData.street_address} 
              onChangeText={text => setLocationData(p => ({...p, street_address: text}))} 
              placeholder="Cadde, sokak, no vb." 
              multiline 
            />
            
            <TouchableOpacity 
                style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]} 
                onPress={handleGetLocation} 
                disabled={locationLoading}
            >
                {locationLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color="white" style={{marginRight: 8}}/>
                        <Text style={styles.locationButtonText}>Mevcut Konumumu Kullan</Text>
                    </>
                )}
            </TouchableOpacity>
            {/* --- KONUM BÖLÜMÜ BİTTİ --- */}

            <View style={{marginTop: 20}}>
              <Button title="İlanı Gönder" onPress={submitAd} color={theme.accent} /> 
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stiller
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 50 },
  header: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20, textAlign: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '500', color: theme.text, marginBottom: 16, textAlign: 'center' },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 10, marginVertical: 8, elevation: 3 },
  categoryText: { fontSize: 18, marginLeft: 16 },
  imagePicker: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 16 },
  imagePreviewContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  previewImage: { width: 80, height: 80, borderRadius: 8, margin: 4 },
  label: { fontWeight: 'bold', marginTop: 16, marginBottom: 4, color: theme.text },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ddd' },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 24, },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, },
  locationButton: { flexDirection: 'row', backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16, },
  locationButtonDisabled: { backgroundColor: '#a0a0a0', },
  locationButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary },
  loadingText: { marginTop: 10, fontSize: 16, color: theme.text },
  // YENİ/GÜNCELLENEN STİLLER
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Picker stili (iç) - iOS için yüksekliği kaldırdık
  picker: {
    // height: 50, // Bu satır iOS'ta taşma yapıyordu, kaldırdık
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { get, post, BASE_URL } from '../utils/api'; // BASE_URL'i de import ediyoruz
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Token almak için
import VehiclePaintStatusSelector from './components/VehiclePaintStatusSelector'; // './' olarak düzeltildi
import * as Location from 'expo-location';

// "Otomobil" kategorisi için seçim adımlarını önceden tanımlıyoruz.
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
  // Adım takibi
  const [step, setStep] = useState(1);

  // Veri state'leri
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [images, setImages] = useState([]);

  // Seçim state'leri
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [vehicleSelections, setVehicleSelections] = useState({}); // Marka, model vb. ID'lerini burada tutacağız

  // Form state'leri
  const [commonDetails, setCommonDetails] = useState({ price: '', description: '' });
  const [dynamicDetails, setDynamicDetails] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Resim yükleme durumu
  const [paintStatusData, setPaintStatusData] = useState({});//Boya/Değişen verisini tutmak
  const [locationData, setLocationData] = useState({
      city: '',
      district: '',
      neighborhood: '',
      street_address: '',
      latitude: null,
      longitude: null,
  });
  const [locationLoading, setLocationLoading] = useState(false); // Konum alınırken loading

  // 1. Adım için ana kategorileri çek
  useEffect(() => {
    get('/categories/main').then(setMainCategories);
  }, []);
  // İzin isteme (Hem Galeri hem Konum)
  useEffect(() => {
    (async () => {
      // Galeri izni
      if (Platform.OS !== 'web') {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeri izni vermeniz gerekiyor!'); }
      }
      // Konum izni
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Reddedildi', 'İlanınıza konum eklemek için konum izni vermeniz gerekiyor, ancak manuel olarak da girebilirsiniz.');
      }
    })();
  }, []);

  // --- SİHİRBAZDAN DÖNÜNCE STATE'İ GÜVENİLİR ŞEKİLDE AYARLA --- ✅✅✅
  useEffect(() => {
    // Hem filters hem de filterNames geldi mi diye kontrol et
    if (route.params?.filters && route.params?.filterNames) { 
      const filters = route.params.filters;
      const names = route.params.filterNames;
      console.log("Sihirbazdan dönüldü, filtreler:", filters, "İsimler:", names); 
      
      setVehicleSelections(filters); // ID'leri kaydet
      const subCatId = filters.categoryId;
      const subCatName = names.categoryName; // İsmi doğrudan al! ✅

      // Artık arama yapmaya gerek yok! State'i doğrudan ayarla.
      if (subCatId && subCatName) {
        setSelectedSubCategory({ id: subCatId, name: subCatName }); 
        console.log("Sihirbaz sonrası Alt Kategori state'i ayarlandı:", { id: subCatId, name: subCatName });
      } else {
        console.error("Sihirbaz sonrası Kategori ID veya Adı alınamadı!");
        // Hata durumunda belki Adım 2'ye dönmek daha iyi olabilir
        setSelectedSubCategory(null);
      }
      
      // Şimdi dinamik alanları çekebiliriz
      setLoading(true);
      get(`/categories/${subCatId}/fields`)
        .then(data => {
          setDynamicFields(data);
          const initialDynamicState = {};
          data.forEach(field => { initialDynamicState[field.field_name] = ''; });
          setDynamicDetails(initialDynamicState);
        })
        .catch(() => Alert.alert('Hata', '...'))
        .finally(() => { setLoading(false); setStep(3); }); // Resim adımına geç
    }
  }, [route.params?.filters, route.params?.filterNames]); // Sadece bu parametreler değişince çalışsın
  // --- DÜZELTME BİTTİ ---

  // Ana kategori seçildiğinde alt kategorileri çek
  const handleMainCategorySelect = (category) => {
    setLoading(true);
    get(`/categories/sub/${category.id}`)
      .then(setSubCategories)
      .finally(() => { setLoading(false); setStep(2); });
  };

  // Alt kategori seçildiğinde AKILLI YÖNLENDİRME YAP ✅
  const handleSubCategorySelect = (category) => {
    setSelectedSubCategory(category);
    setDynamicFields([]); // Önceki seçimden kalan alanları temizle
    setDynamicDetails({});

    if (category.name === 'Otomobil') {
      // Eğer Otomobil seçildiyse, seçim sihirbazını başlat
      navigation.navigate('SelectionScreen', {
        ...vehicleFilterSteps,
        currentFilters: { categoryId: category.id },
        filterNames: { categoryName: category.name },
        queryParam: { categoryId: category.id },
        finalScreen: 'AddAd' // Bittiğinde buraya geri dön
      });
    } else {
      // Diğer kategoriler için (şimdilik) direkt resim adımına geç
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
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmemiş.');
      return;
    }
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
  // Boya/Değişen component'inden gelen veriyi state'e kaydet ✅
  const handlePaintStatusChange = (status) => {
    setPaintStatusData(status);
  };
  // YENİ: Konum Alma Fonksiyonu ✅
  const handleGetLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert('İzin Reddedildi', 'Konum izni verilmedi.');
          return;
      }

      setLocationLoading(true);
      try {
          // Yüksek doğrulukta konumu almayı dene
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setLocationData(prev => ({
              ...prev,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
          }));
          Alert.alert('Başarılı', 'Konum bilgisi alındı!');

          // --- Opsiyonel: Reverse Geocoding (Adresi Otomatik Doldurma) ---
          // let addressResult = await Location.reverseGeocodeAsync({
          //     latitude: location.coords.latitude,
          //     longitude: location.coords.longitude,
          // });
          // if (addressResult && addressResult.length > 0) {
          //     const addr = addressResult[0];
          //     setLocationData(prev => ({
          //         ...prev,
          //         city: addr.city || '',
          //         district: addr.subregion || '', // subregion ilçeyi verebilir
          //         neighborhood: addr.district || '', // district mahalleyi verebilir
          //         street_address: `${addr.streetNumber || ''} ${addr.street || ''}`.trim(),
          //     }));
          //     Alert.alert('Adres Bulundu!', 'Adres bilgileriniz otomatik dolduruldu.');
          // }
          // --- Bitti ---

      } catch (error) {
          console.error("Konum alınırken hata:", error);
          Alert.alert('Hata', 'Konum bilgisi alınamadı.');
      } finally {
          setLocationLoading(false);
      }
  };

  // İLANI GÖNDERME FONKSİYONU GÜNCELLENDİ ✅
  const submitAd = async () => {
    const subCategoryId = selectedSubCategory?.id;
    if (images.length === 0) { Alert.alert('Hata', 'Lütfen en az bir resim seçin.'); setStep(3); return; }

    setLoading(true); // Genel yükleme başladı
    setIsUploading(true); // Resim yükleme başladı

    // --- 1. Adım: Resimleri Cloudinary'ye Yükle ---
    let uploadedImageUrls = [];
    try {
      const formData = new FormData();
      images.forEach((uri, index) => {
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        let fileType = uri.split('.').pop();
        
        formData.append('images', { // Backend'deki upload.array('images',...) ile aynı isim olmalı
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: fileName || `photo_${index}.${fileType || 'jpg'}`,
          type: `image/${fileType || 'jpeg'}`,
        });
      });

      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token bulunamadı');

      console.log("Resim yükleme isteği gönderiliyor..."); // DEBUG
      const uploadResponse = await fetch(`${BASE_URL}/upload`, { // BASE_URL'i api.js'den aldık
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              // 'Content-Type': 'multipart/form-data' fetch tarafından otomatik ayarlanır
          },
          body: formData,
      });

      console.log("Upload Response Status:", uploadResponse.status); // DEBUG
      const uploadResultText = await uploadResponse.text(); // Önce text olarak alalım
      console.log("Upload Response Text:", uploadResultText); // DEBUG

      if (!uploadResponse.ok) {
        // Hata mesajını parse etmeye çalışalım
        let errorMessage = 'Resimler yüklenemedi.';
        try {
            const errorData = JSON.parse(uploadResultText);
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
             console.error("Upload response parse edilemedi:", parseError)
        }
        throw new Error(errorMessage);
      }

      // Başarılıysa JSON olarak parse et
       const uploadResult = JSON.parse(uploadResultText);
       if (!uploadResult.imageUrls || uploadResult.imageUrls.length === 0) {
           throw new Error('Sunucudan geçerli resim URL\'leri alınamadı.');
       }
      uploadedImageUrls = uploadResult.imageUrls; // Cloudinary URL'lerini aldık!
      console.log("Yüklenen Resim URL'leri:", uploadedImageUrls); // DEBUG

    } catch (uploadError) {
      console.error("Resim yükleme hatası:", uploadError);
      Alert.alert('Resim Yükleme Hatası', `Resimler yüklenirken bir sorun oluştu: ${uploadError.message}`);
      setIsUploading(false);
      setLoading(false);
      return; // Hata varsa ilanı gönderme
    }
    setIsUploading(false); // Resim yükleme bitti

    // --- 2. Adım: İlanı Gönder ---
    const finalData = {
      categoryId: subCategoryId,
      ...vehicleSelections,
      price: Number(commonDetails.price),
      description: commonDetails.description,
      details: {
          ...dynamicDetails, // kilometre, vites_tipi vb.
          boya_degisen: paintStatusData // Seçiciden gelen {on_kaput: 'degisen', ...}
      },
      image_urls: uploadedImageUrls, // <-- Artık Cloudinary URL'leri gönderiliyor ✅
      // Yeni Konum Verileri ✅
      city: locationData.city,
      district: locationData.district,
      neighborhood: locationData.neighborhood,
      street_address: locationData.street_address,
      latitude: locationData.latitude,
      longitude: locationData.longitude,

    };

    console.log("Sunucuya Gönderilecek İlan Verisi:", JSON.stringify(finalData, null, 2));

    try {
      const res = await post('/ads', finalData, true);
      if (res.ok) {
        Alert.alert('Başarılı', 'İlanınız onaya gönderildi.', [
          { text: 'Tamam', onPress: () => { /* ... (Form sıfırlama ve yönlendirme aynı) ... */ } }
        ]);
      } else {
        Alert.alert('Hata', res.data.message || 'İlan gönderilemedi.');
      }
    } catch (error) {
      console.error("İlan gönderme hatası:", error);
      Alert.alert('Hata', 'İlan gönderilirken bir sunucu hatası oluştu.');
    } finally {
      setLoading(false); // Genel yükleme bitti
    }
  };
  // --- SUBMITAD BİTTİ ---
  // İleri butonuna basıldığında çalışacak fonksiyon (Adım 3 için - TEKRAR KONTROL EDİLDİ) ✅
  const handleNextFromImages = () => {
      console.log("İleri (Adım 3): Seçilen Kategori Adı:", selectedSubCategory?.name); // DEBUG
      console.log("Koşul (selectedSubCategory?.name === 'Otomobil'):", selectedSubCategory?.name === 'Otomobil'); // DEBUG
      setStep(selectedSubCategory?.name === 'Otomobil' ? 4 : 5); // State'e güvenerek yönlendir
  };
  // Geri tuşu mantığını 5 adıma göre ve koşullu Adım 4'e göre ayarla
  const goBack = () => {
    setStep(prev => {
        if (prev === 5) { // Son detaylardan geri
            // Eğer Otomobil seçiliyse Adım 4'e (Boya), değilse Adım 3'e (Resim) dön
            return selectedSubCategory?.name === 'Otomobil' ? 4 : 3;
        } else if (prev === 4) { // Boya adımından geri
            return 3; // Resim adımına dön
        } else if (prev === 3) { // Resim adımından geri
            return 2; // Alt kategoriye dön
        } else if (prev === 2) { // Alt kategoriden geri
            return 1; // Ana kategoriye dön
        }
        return 1; // En başa dön
    });
  };
  // İleri butonuna basıldığında çalışacak fonksiyon (Adım 3 için - TEKRAR KONTROL EDİLDİ) ✅
  
  // Yüklenme göstergesi
  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary}}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Adım sayısını 5 olarak güncelledik */}
        <Text style={styles.header}>Yeni İlan Ekle (Adım {step}/5)</Text>

        {/* Geri butonu artık 5 adımı da destekliyor */}
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
        
        {/* --- ADIM 5: SON DETAYLAR (Eski Adım 4) --- ✅ */}
        {step === 5 && ( // Artık son adım 5
          <View>
            <Text style={styles.stepTitle}>Son olarak ilan detaylarını girin</Text>
            
            <Text style={styles.label}>Fiyat (₺)</Text>
            <TextInput style={styles.input} value={commonDetails.price} onChangeText={text => setCommonDetails(p => ({...p, price: text}))} keyboardType="numeric" />
            
            <Text style={styles.label}>Açıklama</Text>
            <TextInput style={styles.input} value={commonDetails.description} onChangeText={text => setCommonDetails(p => ({...p, description: text}))} multiline />

            {/* Dinamik Alanlar (Kilometre, Model Yılı vb.) */}
            {dynamicFields.map(field => (
              <View key={field.field_name}>
                <Text style={styles.label}>{field.field_label}</Text>
                <TextInput 
                  style={styles.input}
                  value={dynamicDetails[field.field_name] || ''} 
                  onChangeText={text => setDynamicDetails(p => ({...p, [field.field_name]: text}))}
                  keyboardType={field.field_type === 'number' ? 'numeric' : 'default'}
                  placeholder={field.field_label}
                />
              </View>
            ))}
            {/* --- YENİ KONUM ALANLARI --- */}
            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
            
            <Text style={styles.label}>Şehir</Text>
            <TextInput style={styles.input} value={locationData.city} onChangeText={text => setLocationData(p => ({...p, city: text}))} placeholder="İlanın bulunduğu şehir" />
            
            <Text style={styles.label}>İlçe</Text>
            <TextInput style={styles.input} value={locationData.district} onChangeText={text => setLocationData(p => ({...p, district: text}))} placeholder="İlanın bulunduğu ilçe" />

            <Text style={styles.label}>Mahalle</Text>
            <TextInput style={styles.input} value={locationData.neighborhood} onChangeText={text => setLocationData(p => ({...p, neighborhood: text}))} placeholder="İlanın bulunduğu mahalle" />

            <Text style={styles.label}>Açık Adres (Opsiyonel)</Text>
            <TextInput style={styles.input} value={locationData.street_address} onChangeText={text => setLocationData(p => ({...p, street_address: text}))} placeholder="Cadde, sokak, no vb." multiline />
            
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

            <View style={{marginTop: 20}}>
              <Button title="İlanı Gönder" onPress={submitAd} color={theme.accent} /> 
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stillerde değişiklik yok
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
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 24, }, // Yeni stil
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, }, // Yeni stil
  locationButton: { // Yeni stil
    flexDirection: 'row',
    backgroundColor: '#28a745', // Yeşil renk
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
   locationButtonDisabled: { // Yeni stil
       backgroundColor: '#a0a0a0',
   },
  locationButtonText: { // Yeni stil
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  loadingContainer: { // Yeni stil
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  loadingText: { // Yeni stil
    marginTop: 10,
    fontSize: 16,
    color: theme.text,
  },
});
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Dimensions, FlatList, TouchableOpacity ,Platform, Linking} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // İkon kütüphanesi
import { post, del, get } from '../utils/api'; // get, post ve del'i import et
import VehiclePaintStatusSelector from './components/VehiclePaintStatusSelector'; // './' olarak düzeltildi

const { width } = Dimensions.get('window');

const DetailRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default function DetailScreen({ route, navigation }) {
  const { adId } = route.params;
  const [adDetails, setAdDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adPromise = get(`/ads/public/${adId}`);
        const tokenPromise = AsyncStorage.getItem('token');
        const favCheckPromise = get(`/favorites/check/${adId}`, true); 
        const [adData, token, favStatus] = await Promise.all([adPromise, tokenPromise, favCheckPromise]);
        setAdDetails(adData);
        setIsFavorite(favStatus.isFavorite);

        if (token) {
          const decoded = jwtDecode(token);
          setCurrentUserId(decoded.userId);
        }
      } catch (error) {
        console.error("İlan detayı alınamadı:", error);
        Alert.alert('Hata', 'İlan detayları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adId]);

  const formatLabel = (key) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;
  const toggleFavorite = async () => {
    const newState = !isFavorite;
    setIsFavorite(newState); // Önce arayüzü güncelle (iyimser güncelleme)
    try {
        if (newState) {
            // Favoriye ekle
            await post('/favorites', { adId: adId }, true);
        } else {
            // Favoriden çıkar
            await del(`/favorites/${adId}`, true);
        }
    } catch (error) {
        console.error("Favori durumu güncellenirken hata:", error);
        setIsFavorite(!newState); // Hata olursa eski duruma geri dön
        Alert.alert('Hata', 'Favori durumu güncellenemedi.');
    }
  };
  // --- YENİ HARİTA AÇMA FONKSİYONU --- ✅
  const openMap = (lat, lon) => {
    const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
    const latLon = `${lat},${lon}`;
    const url = Platform.OS === 'ios' 
        ? `${scheme}${latLon}` 
        : `${scheme}${latLon}(İlan Konumu)`;
    try {
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Hata', 'Harita uygulaması açılamadı.');
    }
  };

  if (loading || !adDetails) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color={theme.accent} />;
  }
  // --- YENİ HARİTA AÇMA FONKSİYONU --- ✅
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Resim Galerisi --- */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={adDetails.image_urls || []}
            renderItem={({ item }) => <Image source={{ uri: item }} style={styles.image} />}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            ListEmptyComponent={<View style={styles.image}><Text style={{textAlign: 'center', marginTop: 50}}>Resim Yok</Text></View>}
          />
          {adDetails.image_urls && adDetails.image_urls.length > 1 && (
            <View style={styles.pagination}>
              {adDetails.image_urls.map((_, index) => (
                <View key={index} style={[ styles.paginationDot, activeIndex === index ? styles.paginationDotActive : styles.paginationDotInactive ]}/>
              ))}
            </View>
          )}
        </View>
        
        {/* --- Ana İçerik Alanı --- */}
        <View style={styles.contentContainer}>
          {/* Fiyat ve Favori Kalp */}
          <View style={styles.headerRow}>
              <Text style={styles.price}>{adDetails.price} ₺</Text>
              {currentUserId !== adDetails.user_id && (
                  <TouchableOpacity onPress={toggleFavorite}>
                      <MaterialCommunityIcons 
                          name={isFavorite ? "heart" : "heart-outline"} 
                          size={30} 
                          color={isFavorite ? "red" : theme.accent} 
                      />
                  </TouchableOpacity>
              )}
          </View>
          
          {/* Açıklama */}
          <Text style={styles.description}>{adDetails.description}</Text>
          {/* --- YENİ ADRES BÖLÜMÜ EKLENDİ --- ✅ */}
          {adDetails.city && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Konum</Text>
              <Text style={styles.addressText}>
                {adDetails.city} / {adDetails.district} / {adDetails.neighborhood}
              </Text>
              {adDetails.street_address && (
                <Text style={styles.streetAddressText}>{adDetails.street_address}</Text>
              )}
              {/* Sadece koordinat varsa "Haritada Göster" butonunu göster */}
              {adDetails.latitude && adDetails.longitude && (
                <TouchableOpacity 
                  style={styles.mapButton} 
                  onPress={() => openMap(adDetails.latitude, adDetails.longitude)}
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.accent} />
                  <Text style={styles.mapButtonText}>Haritada Göster</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {/* --- ADRES BÖLÜMÜ BİTTİ --- */}

          {/* İlan Detayları */}
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>İlan Detayları</Text>
          <DetailRow label="İlan Sahibi" value={adDetails.owner_name} />
          {/* ... (Diğer ortak ve dinamik DetailRow'lar) ... */}
          {adDetails.details && Object.keys(adDetails.details)
              // 'boya_degisen' anahtarını hariç tutarak listele
              .filter(key => key !== 'boya_degisen') 
              .map(key => (
                  <DetailRow key={key} label={formatLabel(key)} value={adDetails.details[key]} />
           ))}

          {/* --- BOYA/DEĞİŞEN BÖLÜMÜ (DOĞRU YERDE) --- ✅ */}
          {adDetails.details?.boya_degisen && Object.keys(adDetails.details.boya_degisen).length > 0 && (
            <>
                <View style={styles.separator} />
                <Text style={styles.sectionTitle}>Boya ve Değişen Durumu</Text>
                {/* Component'i editable={false} prop'u ile çağırıyoruz */}
                <VehiclePaintStatusSelector 
                    initialStatus={adDetails.details.boya_degisen} 
                    editable={false} // <-- Tıklamayı engellemek için
                />
            </>
          )}
          {/* --- EKLEME BİTTİ --- */}

        </View> 
        {/* contentContainer sonu */}
      </ScrollView> 
      {/* ScrollView sonu */}

      {/* Mesaj Gönder Butonu (ScrollView dışında, en altta sabit) */}
      {currentUserId !== adDetails.user_id && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.messageButton} 
            onPress={() => navigation.navigate('ChatScreen', { 
                adId: adDetails.id, 
                adTitle: adDetails.description,
                otherUserName: adDetails.owner_name
            })}
          >
            <Text style={styles.messageButtonText}>İlan Sahibine Mesaj Gönder</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: { height: width * 0.75 },
  image: { width: width, height: width * 0.75, backgroundColor: '#eee' },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 15, alignSelf: 'center' },
  paginationDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  paginationDotActive: { backgroundColor: 'white' },
  paginationDotInactive: { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  contentContainer: { padding: 20 },
  price: { fontSize: 28, fontWeight: 'bold', color: theme.accent, marginBottom: 8 },
  description: { fontSize: 18, lineHeight: 26, color: '#333' },
  separator: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 16, fontWeight: '500', color: '#000' },
  
  // --- STİLLER ORİJİNAL, ŞIK HALİNE DÖNDÜRÜLDÜ ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 30,
    backgroundColor: 'white', // <-- Sarı arka plan kaldırıldı, beyaz yapıldı
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    zIndex: 10, // <-- zIndex'i her ihtimale karşı tutuyoruz
  },
  messageButton: {
    backgroundColor: theme.accent, // <-- Kırmızı renk kaldırıldı, tema rengine dönüldü
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  messageButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRow: { // <-- YENİ STİL ✅
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // --- YENİ EKLENEN STİLLER BURADA --- ✅
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    lineHeight: 22,
  },
  streetAddressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapButtonText: {
    color: theme.accent,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
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
  const { adId, isAdminReview } = route.params;
  const [adDetails, setAdDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [technicalSpecs, setTechnicalSpecs] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. İlan detaylarını, token'ı ve favori durumunu paralel olarak çek
        const adPromise = isAdminReview
           ? get(`/admin/ads/${adId}/details`, true) // Admin ise onaysız ilanı çek
           : get(`/ads/public/${adId}`); // Normal kullanıcı ise public ilanı çek
           
        const tokenPromise = AsyncStorage.getItem('token');
        
        const favCheckPromise = isAdminReview
           ? Promise.resolve({ isFavorite: false }) // Admin modunda favori kontrolüne gerek yok
           : get(`/favorites/check/${adId}`, true); 

        const [adData, token, favStatus] = await Promise.all([adPromise, tokenPromise, favCheckPromise]);
        
        // Gelen temel verileri state'e at
        setAdDetails(adData);
        setIsFavorite(favStatus.isFavorite);

        // --- YENİ EKLENEN KISIM: TEKNİK ÖZELLİKLERİ ÇEK ---
        // Eğer ilanın bir donanım ID'si varsa, teknik özellikleri de getir
        if (adData.trim_id) {
            try {
                const specs = await get(`/specs/${adData.trim_id}`);
                setTechnicalSpecs(specs); // Veriyi state'e kaydet
            } catch (specError) {
                console.log("Bu ilan için teknik özellik bulunamadı veya çekilemedi.", specError);
                // Buradaki hata ana ekranın açılmasını engellemesin diye sadece logluyoruz
            }
        }
        // ---------------------------------------------------

        // Kullanıcı giriş yapmışsa ID'sini al (butonları gizlemek/göstermek için)
        if (token) {
          const decoded = jwtDecode(token);
          setCurrentUserId(decoded.userId);
        }
      } catch (error) {
        console.error("İlan detayı ana verileri alınamadı:", error);
        Alert.alert('Hata', 'İlan detayları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adId, isAdminReview]); // isAdminReview değişirse de tekrar çalışsın

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
              {!isAdminReview && currentUserId !== adDetails.user_id && (
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
          
          {/* --- Konum Bilgileri (DOĞRU HALİ) --- */}
          {adDetails.city_name && ( // <-- KONTROLÜ "city_name" OLARAK DEĞİŞTİRDİK
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Konum</Text>
              <Text style={styles.addressText}>
                {adDetails.city_name} / {adDetails.district_name} / {adDetails.neighbourhood_name}
              </Text>
              {/* Açık adres (street_address) varsa onu da göster */}
              {adDetails.street_address && (
                <Text style={styles.streetAddressText}>{adDetails.street_address}</Text>
              )}
              
              {/* EĞER İLAN VERİLİRKEN "MEVCUT KONUMUMU KULLAN" SEÇİLDİYSE
                (yani latitude ve longitude varsa) O BUTONU GÖSTER
              */}
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
          {/* --- Konum Bitti --- */}

          {/* --- İlan Detayları --- */}
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>İlan Detayları</Text>
          <DetailRow label="İlan No" value={adDetails.id} />
          <DetailRow label="İlan Tarihi" value={new Date(adDetails.created_at).toLocaleDateString('tr-TR')} />
          {adDetails.brand_name && <DetailRow label="Marka" value={adDetails.brand_name} />}
          {adDetails.model_name && <DetailRow label="Seri" value={adDetails.model_name} />}
          {adDetails.variant_name && <DetailRow label="Model" value={adDetails.variant_name} />}
          {adDetails.trim_name && <DetailRow label="Paket" value={adDetails.trim_name} />}
          <DetailRow label="İlan Sahibi" value={adDetails.owner_name} />

          {adDetails.details && Object.keys(adDetails.details)
              .filter(key => key !== 'boya_degisen') 
              .map(key => (
                  <DetailRow key={key} label={formatLabel(key)} value={adDetails.details[key]} />
           ))}

          {/* --- Boya ve Değişen Durumu --- */}
          {adDetails.details?.boya_degisen && Object.keys(adDetails.details.boya_degisen).length > 0 && (
            <>
                <View style={styles.separator} />
                <Text style={styles.sectionTitle}>Boya ve Değişen Durumu</Text>
                <VehiclePaintStatusSelector 
                    initialStatus={adDetails.details.boya_degisen} 
                    editable={false} 
                />
            </>
          )}

          {/* --- YENİ TEKNİK ÖZELLİKLER TABLOSU (DOĞRU YERDE) --- */}
          {technicalSpecs && Object.keys(technicalSpecs).length > 2 && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Teknik Özellikler</Text>
              
              <Text style={[styles.sectionTitle, {fontSize: 16, marginTop: 10, color: theme.accent}]}>Performans</Text>
              {technicalSpecs.motor_tipi && <DetailRow label="Motor Tipi" value={technicalSpecs.motor_tipi} />}
              {technicalSpecs.beygir_gucu && <DetailRow label="Beygir Gücü" value={`${technicalSpecs.beygir_gucu} HP`} />}
              {technicalSpecs.tork && <DetailRow label="Tork" value={`${technicalSpecs.tork} Nm`} />}
              {technicalSpecs.hizlanma_0_100 && <DetailRow label="0-100 km/s" value={`${technicalSpecs.hizlanma_0_100} sn`} />}
              {technicalSpecs.maksimum_hiz && <DetailRow label="Maksimum Hız" value={`${technicalSpecs.maksimum_hiz} km/s`} />}

              <Text style={[styles.sectionTitle, {fontSize: 16, marginTop: 15, color: theme.accent}]}>Yakıt ve Tüketim</Text>
              {technicalSpecs.yakit_tuketimi_ortalama && <DetailRow label="Ortalama Tüketim" value={`${technicalSpecs.yakit_tuketimi_ortalama} lt`} />}
              {technicalSpecs.yakit_tuketimi_sehir_ici && <DetailRow label="Şehir İçi" value={`${technicalSpecs.yakit_tuketimi_sehir_ici} lt`} />}
              {technicalSpecs.yakit_tuketimi_sehir_disi && <DetailRow label="Şehir Dışı" value={`${technicalSpecs.yakit_tuketimi_sehir_disi} lt`} />}
              {technicalSpecs.yakit_deposu && <DetailRow label="Depo Hacmi" value={`${technicalSpecs.yakit_deposu} lt`} />}

              <Text style={[styles.sectionTitle, {fontSize: 16, marginTop: 15, color: theme.accent}]}>Ölçüler</Text>
              {technicalSpecs.bagaj_kapasitesi && <DetailRow label="Bagaj Hacmi" value={`${technicalSpecs.bagaj_kapasitesi} lt`} />}
              {technicalSpecs.net_agirlik && <DetailRow label="Net Ağırlık" value={`${technicalSpecs.net_agirlik} kg`} />}
              {technicalSpecs.uzunluk && <DetailRow label="Uzunluk" value={`${technicalSpecs.uzunluk} mm`} />}
              {technicalSpecs.lastik_olculeri && <DetailRow label="Lastik Ölçüleri" value={`${technicalSpecs.lastik_olculeri} `} />}
            </>
          )}
          {/* -------------------------------------- */}

        </View> 
        {/* contentContainer sonu */}
      </ScrollView> 
      {/* ScrollView sonu */}

      {/* Mesaj Gönder Butonu (ScrollView dışında, en altta sabit) */}
      {!isAdminReview && currentUserId !== adDetails.user_id && (
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
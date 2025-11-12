
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { get } from '../utils/api';
import theme from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DynamicFilterBox from './components/DynamicFilterBox';

import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator, 
  Image, 
  ScrollView,
  LayoutAnimation, // <-- YENİ
  Platform,        // <-- YENİ
  UIManager        // <-- YENİ
} from 'react-native';
// ...
import LocationFilterPanel from './components/LocationFilterPanel'; // <-- YENİ component (birazdan oluşturacağız)

// Animasyonu Android'de de etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


// AdCard component'i (İlan kartı)
const AdCard = ({ item, navigation }) => (
  <TouchableOpacity onPress={() => navigation.navigate('DetailScreen', { adId: item.id })}>
    <View style={styles.adCard}>
      {item.image_urls && item.image_urls[0] && (
        <Image source={{ uri: item.image_urls[0] }} style={styles.adImage} />
      )}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={2}>{item.description || 'İlan'}</Text>
        <Text style={styles.adPrice}>{item.price} ₺</Text>
        <Text style={styles.adOwner}>İlan Sahibi: {item.owner_name}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Kategori Kartı component'i
const CategoryCard = ({ item, navigation }) => (
     <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('SubCategory', { parentId: item.id, categoryName: item.name })}
    >
      <MaterialCommunityIcons name={item.icon_name || 'tag-outline'} size={40} color={theme.accent} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
);


export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debounceTimeout = useRef(null);

  // Ana kategorileri çek
  useEffect(() => {
    get('/categories/main')
      .then(setCategories)
      .catch(err => Alert.alert("Hata", "Kategoriler yüklenemedi."))
      .finally(() => setLoadingCategories(false));
  }, []);
  const [isLocationPanelVisible, setIsLocationPanelVisible] = useState(false); // Panel durumu

  // --- YENİ: HEADER'A İKON EKLEME ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleLocationPanel} style={styles.headerButton}>
          <MaterialCommunityIcons 
            name="map-search-outline" // Veya "map-marker-outline"
            size={26} 
            color={theme.accent} 
          />
          <Text style={styles.headerButtonText}>Konum</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isLocationPanelVisible]); // isLocationPanelVisible'a da bağla

  // --- YENİ: "EFSANE ANİMASYON" FONKSİYONU ---
  const toggleLocationPanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animasyon!
    setIsLocationPanelVisible(!isLocationPanelVisible);
  };
  // Arama metni değiştiğinde çalışacak fonksiyon
  const handleSearch = (text) => {
    const trimmedText = text.trim(); // Boşlukları temizle
    setSearchText(text); // Input'u güncelle
    setSearchResults([]); // Önceki sonuçları temizle

    // Sadece metin varsa yükleniyor göster ve arama yap
    if (trimmedText !== '') {
        setLoadingSearch(true);
    } else {
        setLoadingSearch(false); // Metin yoksa yükleniyor gösterme
    }

    // Debounce: Kullanıcı yazmayı bıraktıktan sonra arama yap
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (trimmedText === '') {
      return; // Boşsa arama yapma
    }

    debounceTimeout.current = setTimeout(() => {
      // Token ile arama isteği gönder
      get(`/ads/search?q=${encodeURIComponent(trimmedText)}`, true) // withAuth = true
        .then(setSearchResults)
        .catch(err => {
          console.error("Arama hatası:", err);
          if (err.message && (err.message.includes("Token") || err.message.includes("yetki"))) {
              Alert.alert('Oturum Hatası', 'Arama yapmak için giriş yapmış olmanız gerekiyor veya oturumunuzun süresi dolmuş.');
          } else {
              Alert.alert('Hata', 'Arama sırasında bir sorun oluştu.');
          }
        })
        .finally(() => setLoadingSearch(false));
    }, 500); // 500 milisaniye bekle
  };

  // --- RENDER EDİLECEK KOMPONENTLER (Ayrı Fonksiyonlar Olarak) ---
  const renderCategoryList = () => (
      <>
        <Text style={styles.header}>Kategoriler</Text>
        <FlatList
          data={categories}
          renderItem={({ item }) => <CategoryCard item={item} navigation={navigation} />}
          keyExtractor={(item) => `cat-${item.id.toString()}`}
          numColumns={2} // Kategori listesi 2 sütunlu
          scrollEnabled={false} // ÖNEMLİ: İç içe scroll'u engelle
        />
      </>
  );

  const renderSearchResultList = () => (
      <FlatList
        data={searchResults}
        renderItem={({ item }) => <AdCard item={item} navigation={navigation} />}
        keyExtractor={(item) => `search-${item.id.toString()}`}
        ListEmptyComponent={<Text style={styles.emptyText}>{loadingSearch ? 'Aranıyor...' : 'Aramanızla eşleşen ilan bulunamadı.'}</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshing={loadingSearch}
        key={'search-list'} // Farklı key prop'u
      />
  );
  // --- KOMPONENTLER BİTTİ ---


  return (
      <SafeAreaView style={styles.safeArea}>
        {/* ARAMA ÇUBUĞU */}
        <View style={styles.searchContainer}>
           <TextInput
            style={styles.searchInput}
            placeholder="İlanlarda Ara..."
            value={searchText}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ARAMA SONUÇLARI VEYA ANA EKRAN */}
        {loadingCategories ? (
          <ActivityIndicator style={{ marginTop: 50 }} size="large" color={theme.accent} />
        ) : searchText.trim() !== '' ? (
          renderSearchResultList() // Arama varsa burası çalışır (FlatList kaydırılabilir)
        ) : (
          // ARAMA YOKSA: Her şey bu ScrollView'un içinde
          <ScrollView 
            style={styles.container}
            keyboardShouldPersistTaps="handled" // Klavyeyi yönetmek için
          >
            
            {/* --- YENİ: ANİMASYONLU KONUM PANELİ (DOĞRU YERDE) --- */}
            {isLocationPanelVisible && (
              <LocationFilterPanel 
                onClose={toggleLocationPanel}
                onApplyFilters={(filters, filterNames) => {
                  toggleLocationPanel(); // Paneli kapat
                  navigation.navigate('AdList', { filters, filterNames });
                }}
              />
            )}
            
            {/* --- ESKİ FİLTRE KUTUSU --- */}
            <DynamicFilterBox />
            
            {/* --- KATEGORİ LİSTESİ --- */}
            {renderCategoryList()}
            
          </ScrollView>
        )}
      </SafeAreaView>
    );
}

// Stiller
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.primary },
  container: {
    flex: 1,
    padding: 10,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: theme.primary,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    elevation: 3,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  adCard: { backgroundColor: '#fff', marginHorizontal: 5, marginBottom: 10, borderRadius: 8, elevation: 3, flexDirection: 'row', overflow: 'hidden' },
  adImage: { width: 90, height: 90, backgroundColor: '#eee' },
  adInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  adTitle: { fontSize: 15, fontWeight: 'bold' },
  adPrice: { fontSize: 16, color: theme.accent, fontWeight: 'bold', marginTop: 4 },
  adOwner: { fontSize: 12, color: '#666', marginTop: 'auto' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },

  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  headerButtonText: {
    color: theme.accent,
    fontSize: 16,
    marginLeft: 4,
  },
});
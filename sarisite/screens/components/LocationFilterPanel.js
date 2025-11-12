// screens/components/LocationFilterPanel.js (YENİ DOSYA)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { get } from '../../utils/api';
import theme from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LocationFilterPanel({ onClose, onApplyFilters }) {
  const [activeTab, setActiveTab] = useState('manuel'); // 'manuel' veya 'yakın'
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Manuel Arama State'leri
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');

  // Şehirleri bir kere yükle
  useEffect(() => {
    setLoading(true);
    get('/locations/cities').then(setCities).finally(() => setLoading(false));
  }, []);

  // Şehir seçilince ilçeleri çek
  const handleCitySelect = (cityId) => {
    setSelectedCity(cityId);
    setSelectedDistrict('');
    setSelectedNeighborhood('');
    setDistricts([]);
    setNeighborhoods([]);
    if (cityId) {
      setLoading(true);
      get(`/locations/districts?cityId=${cityId}`).then(setDistricts).finally(() => setLoading(false));
    }
  };

  // İlçe seçilince mahalleleri çek
  const handleDistrictSelect = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedNeighborhood('');
    setNeighborhoods([]);
    if (districtId) {
      setLoading(true);
      get(`/locations/neighborhoods?districtId=${districtId}`).then(setNeighborhoods).finally(() => setLoading(false));
    }
  };

  // "Konumumu Kullan" butonuna basılınca
  const applyProximityFilter = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Reddedildi', 'Konum izni vermeniz gerekiyor.');
        setLocationLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      
      // Filtreleri HomeScreen'e gönder
      onApplyFilters(
        { lat: latitude, lon: longitude }, 
        { filter: "Konumuma Yakın" }
      );
    } catch (error) {
      Alert.alert('Hata', 'Konum alınamadı.');
    } finally {
      setLocationLoading(false);
    }
  };

  // "Manuel Filtreyi Uygula" butonuna basılınca
  const applyManuelFilter = () => {
    const filters = {};
    const filterNames = {};

    if (selectedNeighborhood) {
      filters.neighbourhood_id = selectedNeighborhood;
      // ... (Burada ID'den isim bulma eklenebilir ama şimdilik ID yeterli)
      filterNames.filter = "Mahalle Seçimi";
    } else if (selectedDistrict) {
      filters.district_id = selectedDistrict;
      filterNames.filter = "İlçe Seçimi";
    } else if (selectedCity) {
      filters.city_id = selectedCity;
      filterNames.filter = "Şehir Seçimi";
    } else {
      Alert.alert('Hata', 'Lütfen en azından bir şehir seçin.');
      return;
    }
    
    onApplyFilters(filters, filterNames);
  };

  return (
    <View style={styles.panelContainer}>
      {/* 1. Tab Butonları */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manuel' && styles.tabActive]} 
          onPress={() => setActiveTab('manuel')}
        >
          <MaterialCommunityIcons name="form-select" size={20} color={activeTab === 'manuel' ? theme.accent : '#666'} />
          <Text style={[styles.tabText, activeTab === 'manuel' && styles.tabTextActive]}>Manuel Adres</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'yakın' && styles.tabActive]} 
          onPress={() => setActiveTab('yakın')}
        >
          <MaterialCommunityIcons name="target" size={20} color={activeTab === 'yakın' ? theme.accent : '#666'} />
          <Text style={[styles.tabText, activeTab === 'yakın' && styles.tabTextActive]}>Konumuma Yakın</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{marginTop: 20}} size="large" color={theme.accent} />}

      {/* 2. Manuel Adres Filtreleri */}
      {activeTab === 'manuel' && !loading && (
        <View style={styles.filterSection}>
          <Text style={styles.label}>İl</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedCity} onValueChange={(itemValue) => handleCitySelect(itemValue)}>
              <Picker.Item label="İl Seçiniz..." value="" />
              {cities.map(city => <Picker.Item key={city.id} label={city.name} value={city.id} />)}
            </Picker>
          </View>

          <Text style={styles.label}>İlçe</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedDistrict} onValueChange={(itemValue) => handleDistrictSelect(itemValue)} enabled={districts.length > 0}>
              <Picker.Item label="İlçe Seçiniz..." value="" />
              {districts.map(dist => <Picker.Item key={dist.id} label={dist.name} value={dist.id} />)}
            </Picker>
          </View>
          
          <Text style={styles.label}>Mahalle</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedNeighborhood} onValueChange={(itemValue) => setSelectedNeighborhood(itemValue)} enabled={neighborhoods.length > 0}>
              <Picker.Item label="Tüm Mahalleler" value="" />
              {neighborhoods.map(hood => <Picker.Item key={hood.id} label={hood.name} value={hood.id} />)}
            </Picker>
          </View>

          <Button title="Adres Filtresini Uygula" onPress={applyManuelFilter} color={theme.accent} />
        </View>
      )}

      {/* 3. Konumuma Yakın Filtresi */}
      {activeTab === 'yakın' && !loading && (
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={applyProximityFilter} 
            disabled={locationLoading}
          >
            {locationLoading ? 
              <ActivityIndicator color="white" /> :
              <Text style={styles.locationButtonText}>Yakınımdaki İlanları Getir</Text>
            }
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  panelContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: '#e6f2ff',
    borderColor: theme.accent,
  },
  tabText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: 'bold',
  },
  filterSection: {
    paddingHorizontal: 5,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: theme.text,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  locationButton: {
    backgroundColor: theme.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
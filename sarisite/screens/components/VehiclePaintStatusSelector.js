// screens/components/VehiclePaintStatusSelector.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Modal, Button } from 'react-native';
import theme from '../../theme'; // Ana tema dosyamız

// Araç şemasının yolunu doğru ayarladığından emin ol!
const carSchemaImage = require('../../assets/car_schema.jpg'); 

// Parça durumları ve renkleri
const STATUS_OPTIONS = {
  original: { label: 'Orijinal', color: 'rgba(0, 255, 0, 0.5)' }, // Yeşil (Yarı saydam)
  boyali: { label: 'Boyalı', color: 'rgba(255, 0, 0, 0.5)' },   // Kırmızı
  lokal_boyali: { label: 'Lokal Boyalı', color: 'rgba(255, 255, 0, 0.5)' }, // Sarı
  degisen: { label: 'Değişen', color: 'rgba(108, 117, 125, 0.7)' }, // Koyu Gri
};
const ALL_STATUSES = ['original', 'boyali', 'lokal_boyali', 'degisen'];

// Araç parçalarının isimleri ve ekrandaki yaklaşık pozisyonları/boyutları
// BU DİZİNİN TAMAMINI KOPYALA VE ESKİSİYLE DEĞİŞTİR:
const CAR_PARTS = [
  // --- ORTA BÖLÜM (ÜSTTEN GÖRÜNÜM) ---
  { key: 'on_kaput', label: 'Ön Kaput', style: { top: '35%', left: '28%', width: '44%', height: '13%' } },
  { key: 'tavan', label: 'Tavan', style: { top: '48%', left: '28%', width: '44%', height: '13%'} },
  { key: 'arka_kaput', label: 'Arka Kaput (Bagaj)', style: { top: '61%', left: '28%', width: '44%', height: '10%'} },

  // --- ÜST BÖLÜM (SAĞ TARAF) ---
  { key: 'sag_on_camurluk', label: 'Sağ Ön Çamurluk', style: { top: '10%', left: '12%', width: '20%', height: '15%' } },
  { key: 'sag_on_kapi', label: 'Sağ Ön Kapı', style: { top: '10%', left: '33%', width: '18%', height: '15%' } },
  { key: 'sag_arka_kapi', label: 'Sağ Arka Kapı', style: { top: '10%', left: '52%', width: '18%', height: '15%' } },
  { key: 'sag_arka_camurluk', label: 'Sağ Arka Çamurluk', style: { top: '10%', left: '71%', width: '20%', height: '15%' } },
  
  // --- ALT BÖLÜM (SOL TARAF) ---
  { key: 'sol_on_camurluk', label: 'Sol Ön Çamurluk', style: { top: '75%', left: '12%', width: '20%', height: '15%' } },
  { key: 'sol_on_kapi', label: 'Sol Ön Kapı', style: { top: '75%', left: '33%', width: '18%', height: '15%' } },
  { key: 'sol_arka_kapi', label: 'Sol Arka Kapı', style: { top: '75%', left: '52%', width: '18%', height: '15%' } },
  { key: 'sol_arka_camurluk', label: 'Sol Arka Çamurluk', style: { top: '75%', left: '71%', width: '20%', height: '15%' } },
];

export default function VehiclePaintStatusSelector({ initialStatus = {}, onStatusChange }) {
  const [partStatus, setPartStatus] = useState(initialStatus);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null); // Hangi parçanın modalını açtığımızı tutar

  // Bir parçaya tıklandığında modalı açar
  const handlePartPress = (partKey) => {
    setSelectedPart(partKey);
    setModalVisible(true);
  };

  // Modaldan bir durum seçildiğinde state'i günceller ve dışarıya bildirir
  const handleStatusSelect = (statusKey) => {
    const newStatus = {
      ...partStatus,
      [selectedPart]: statusKey, // Sadece seçilen parçanın durumunu güncelle
    };
    setPartStatus(newStatus);
    onStatusChange(newStatus); // Güncel durumu AddAdScreen'e gönder
    setModalVisible(false);
    setSelectedPart(null);
  };

  // Durumu temizlemek için
  const handleClearStatus = () => {
    const newStatus = { ...partStatus };
    delete newStatus[selectedPart]; // Parçayı nesneden çıkar
    setPartStatus(newStatus);
    onStatusChange(newStatus);
    setModalVisible(false);
    setSelectedPart(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Araç Boya ve Değişen Durumu</Text>
      <View style={styles.schemaContainer}>
        <ImageBackground source={carSchemaImage} style={styles.schemaImage} resizeMode="contain">
          {CAR_PARTS.map((part) => (
            <TouchableOpacity
              key={part.key}
              style={[styles.partTouchable, part.style]}
              onPress={() => handlePartPress(part.key)}
            >
              {/* Seçilen duruma göre renkli katmanı göster */}
              {partStatus[part.key] && (
                <View style={[styles.statusOverlay, { backgroundColor: STATUS_OPTIONS[partStatus[part.key]].color }]} />
              )}
            </TouchableOpacity>
          ))}
        </ImageBackground>
      </View>

      {/* Durum Seçim Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {CAR_PARTS.find(p => p.key === selectedPart)?.label || 'Parça'} Durumunu Seçin
            </Text>
            {ALL_STATUSES.map((statusKey) => (
              <TouchableOpacity
                key={statusKey}
                style={styles.modalButton}
                onPress={() => handleStatusSelect(statusKey)}
              >
                <View style={[styles.colorIndicator, {backgroundColor: STATUS_OPTIONS[statusKey].color.replace('0.5', '1').replace('0.7', '1')}]} />
                <Text style={styles.modalButtonText}>{STATUS_OPTIONS[statusKey].label}</Text>
              </TouchableOpacity>
            ))}
             <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearStatus}
              >
                <Text style={styles.modalButtonText}>İşareti Kaldır</Text>
              </TouchableOpacity>
            <Button title="Kapat" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Lejant (Renklerin Anlamları) */}
      <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Renklerin Anlamları:</Text>
          {ALL_STATUSES.map(key => (
              <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendColorBox, { backgroundColor: STATUS_OPTIONS[key].color.replace('0.5', '1').replace('0.7', '1') }]} />
                  <Text style={styles.legendText}>{STATUS_OPTIONS[key].label}</Text>
              </View>
          ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  schemaContainer: {
    width: '100%',
    aspectRatio: 1.8, // Resmin en boy oranına göre ayarla (deneyerek bul)
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  schemaImage: {
    flex: 1,
  },
  partTouchable: {
    position: 'absolute',
    // backgroundColor: 'rgba(0, 0, 255, 0.1)', // DEBUG: Alanları görmek için geçici mavi yap
    borderWidth: 1, // DEBUG: Alanları görmek için kenarlık ekle
    borderColor: 'rgba(0,0,255,0.3)', // DEBUG: Mavi kenarlık
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject, // TouchableOpacity'nin tamamını kapla
    borderRadius: 5, // Hafif yuvarlak kenar (isteğe bağlı)
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colorIndicator: {
      width: 20,
      height: 20,
      borderRadius: 4,
      marginRight: 15,
      borderWidth: 1,
      borderColor: '#ccc',
  },
  modalButtonText: {
    fontSize: 16,
  },
  clearButton: {
      borderBottomWidth: 0, // Son butonun alt çizgisi olmasın
      marginTop: 10,
  },
  // Lejant Stilleri
  legendContainer: {
      marginTop: 15,
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
  },
  legendTitle: {
      fontWeight: 'bold',
      marginBottom: 8,
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
  },
  legendColorBox: {
      width: 15,
      height: 15,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#ccc',
  },
  legendText: {
      fontSize: 14,
  },
});
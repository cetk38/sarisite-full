// screens/ProfileScreen.js

import React, { useState, useCallback } from 'react'; // <-- DOĞRUSU BU ŞEKİLDE TEK SATIR OLMALI
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Bu zaten vardı, doğru yerde
import { get } from '../utils/api'; // Bu da gerekli

// 1. ADIM: Menünün veri yapısını oluşturuyoruz. Bu, listeyi yönetmeyi çok kolaylaştırır.


export default function ProfileScreen({ navigation, setIsAuthenticated }) {

  // 2. ADIM: Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // 3. ADIM: Menü öğelerine tıklandığında ne olacağını yöneten fonksiyon
  const handleNavigation = (screen) => {
    if (screen) {
      // Eğer öğenin bir 'screen' değeri varsa, o sayfaya git
      navigation.navigate(screen);
    } else {
      // Değilse, bu özelliğin yakında geleceğini belirt
      Alert.alert('Çok Yakında!', 'Bu özellik üzerinde çalışıyoruz.');
    }
  };
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
  useCallback(() => {
    get('/notifications/unread-count', true)
      .then(data => setUnreadCount(data.count))
      .catch(err => console.error("Okunmamış bildirim sayısı alınamadı:", err));
  }, [])
  );
  const menuData = [
  {
    title: 'İLAN YÖNETİMİ',
    data: [
      { name: 'Yayında Olanlar', icon: 'check-circle-outline', screen: 'PublishedAds' },
      { name: 'Yayında Olmayanlar', icon: 'close-circle-outline', screen: 'UnpublishedAds' },
    ],
  },
  {
    title: 'MESAJLAR VE BİLGİLENDİRMELER',
    data: [
      { name: 'Mesajlar', icon: 'message-text-outline', screen: 'Messages' },
      { name: 'Bilgilendirmeler', icon: 'bell-outline', screen: 'Notifications', badge: unreadCount }, // <-- badge EKLENDİ
    ],
  },
  {
    title: 'FAVORİLER',
    data: [
      { name: 'Favori İlanlar', icon: 'heart-outline', screen: 'FavoriteAds' },
      { name: 'Favori Aramalar', icon: 'magnify-plus-outline', screen: 'FavoriteSearches' },
    ],
  },
  {
    title: 'HESABIM',
    data: [
      { name: 'Hesap Bilgilerim', icon: 'account-edit-outline', screen: 'AccountInfo' },
      { name: 'Cep Telefonu Numaram', icon: 'phone-outline', screen: 'PhoneNumber' },
      { name: 'Ayarlar', icon: 'cog-outline', screen: 'Settings' },
    ],
  },
  
 ];
  // 4. ADIM: Arayüzü 'SectionList' ile oluşturuyoruz
  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={menuData}
        keyExtractor={(item, index) => item.name + index}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Samet Tok</Text>
            <Text style={styles.headerSubtitle}>Bana Özel</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemContainer} onPress={() => handleNavigation(item.screen)}>
            <MaterialCommunityIcons name={item.icon} size={24} color={theme.accent} style={styles.icon} />
            <Text style={styles.itemText}>{item.name}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// 5. ADIM: Profesyonel görünümlü stiller
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2', // Açık gri bir arka plan
  },
  headerContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'gray',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  icon: {
    marginRight: 15,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 60, // İkonun hizasından başlasın
  },
  logoutButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    marginTop: 30,
    alignItems: 'center',
  },
  logoutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 10, // Chevron ile arasında boşluk
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
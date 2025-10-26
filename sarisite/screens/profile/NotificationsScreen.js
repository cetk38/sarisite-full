// screens/profile/NotificationsScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get, patch } from '../../utils/api';
import theme from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Bildirim türüne göre ikon döndüren fonksiyon
const getIconForType = (type) => {
  switch (type) {
    case 'price_change': return 'tag-heart-outline';
    case 'new_message': return 'message-alert-outline';
    default: return 'bell-outline';
  }
};

const NotificationItem = ({ item, onPress }) => (
  <TouchableOpacity 
    style={[styles.itemContainer, !item.is_read && styles.unreadItem]} 
    onPress={onPress}
  >
    <MaterialCommunityIcons name={getIconForType(item.type)} size={24} color={theme.accent} style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString('tr-TR')}</Text>
    </View>
  </TouchableOpacity>
);

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await get('/notifications', true);
      setNotifications(data);
    } catch (error) {
      Alert.alert('Hata', 'Bildirimler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  // Bildirime tıklandığında çalışacak fonksiyon
  const handlePress = async (item) => {
    // 1. Bildirimi okundu olarak işaretle (API'da ve anında state'te)
    if (!item.is_read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      try {
        await patch(`/notifications/${item.id}/read`, {}, true);
      } catch (error) { console.error("Bildirim okundu işaretlenemedi:", error); }
    }

    // 2. Eğer fiyat değişikliği bildirimi ise, ilgili ilana git
    if (item.type === 'price_change' && item.related_ad_id) {
      navigation.navigate('DetailScreen', { adId: item.related_ad_id });
    }
    // Gelecekte: Yeni mesaj bildirimi ise ilgili sohbete git...
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItem item={item} onPress={() => handlePress(item)} />}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz bildiriminiz yok.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  unreadItem: { backgroundColor: '#eef' }, // Okunmamışları hafif mavi yap
  icon: { marginRight: 16 },
  textContainer: { flex: 1 },
  messageText: { fontSize: 15 },
  dateText: { fontSize: 12, color: 'gray', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});
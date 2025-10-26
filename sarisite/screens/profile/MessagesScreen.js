// screens/profile/MessagesScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '../../utils/api';
import theme from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ConversationRow = ({ item, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.userInfo}>
      <MaterialCommunityIcons name="account-circle" size={40} color="#ccc" />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.other_user_name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message || 'Sohbeti başlat...'}</Text>
      </View>
    </View>
    {item.unread_count > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadText}>{item.unread_count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const data = await get('/conversations', true);
      setConversations(data);
    } catch (error) {
      Alert.alert('Hata', 'Mesajlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchConversations(); }, []));

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            onPress={() => navigation.navigate('ChatScreen', {
              conversationId: item.id,
              adId: item.ad_id,
              adTitle: item.ad_description,
              otherUserName: item.other_user_name
            })}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir mesajınız yok.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  lastMessage: { fontSize: 14, color: 'gray', marginTop: 4 },
  unreadBadge: { backgroundColor: theme.accent, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});
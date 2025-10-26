import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { get, post } from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ChatScreen({ route, navigation }) {
  const { conversationId: initialConversationId, adId, adTitle, otherUserName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const flatListRef = useRef();

  useEffect(() => {
    const getUserId = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId);
      }
    };
    getUserId();
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await get(`/conversations/${conversationId}`, true);
      setMessages(data);
    } catch (error) {
      console.error("Mesajlar çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    navigation.setOptions({ title: otherUserName || adTitle || 'Sohbet' });
    if (userId) {
      fetchMessages();
    }
  }, [userId, fetchMessages, navigation, otherUserName, adTitle]);

  // --- BU FONKSİYON TAMAMEN YENİLENDİ (EN AKILLI YAPI) ---
  const handleSend = async () => {
    if (newMessage.trim() === '') return;
    const body = newMessage;
    setNewMessage('');

    // Mesajı anında ekranda göster (iyimser güncelleme)
    const tempId = Date.now();
    const tempMessage = { id: tempId, sender_id: userId, body: body, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let res;
      if (conversationId) {
        // Mevcut bir sohbete cevap veriliyor
        res = await post(`/conversations/${conversationId}/messages`, { body }, true);
      } else {
        // Yeni bir sohbet başlatılıyor
        res = await post('/conversations', { adId, body }, true);
        // Sunucudan gelen yeni sohbet ID'sini al ve state'i güncelle
        setConversationId(res.data.conversation_id); 
      }
      
      // Geçici mesajı, sunucudan gelen gerçek mesajla değiştir
      setMessages(prev => prev.map(msg => (msg.id === tempId ? res.data : msg)));
      
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      setNewMessage(body);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Hata', 'Mesajınız gönderilemedi.');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.sender_id === userId;
    return (
      <View style={[ styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow ]}>
        <View style={[ styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble ]}>
          <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>{item.body}</Text>
        </View>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.accent} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.messagesContainer}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesajınızı yazın..."
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <MaterialCommunityIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f2' },
  messagesContainer: { paddingVertical: 10, paddingHorizontal: 10 },
  messageRow: { flexDirection: 'row', marginVertical: 4 },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  myMessageBubble: { backgroundColor: theme.accent, borderBottomRightRadius: 4 },
  theirMessageBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: 'black' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginRight: 10 },
  sendButton: { backgroundColor: theme.accent, borderRadius: 25, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
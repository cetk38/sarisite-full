import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '../utils/api';
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode'; // <-- Kütüphaneyi import ettik

export default function LoginScreen({ navigation, setIsAuthenticated, setIsAdmin }) { // setIsAdmin prop'u burada
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Hata', 'Lütfen e-posta ve şifre alanlarını doldurun.');
        return;
      }

      const res = await post('/auth/login', { email, password });

      if (res.ok) {
        const token = res.data.token;
        await AsyncStorage.setItem('token', token);

        // --- YENİ EKLENEN KISIM BAŞLANGICI ---
        try {
          // Gelen token'ı çözerek içindeki bilgilere ulaşıyoruz
          const decodedToken = jwtDecode(token);
          // Token'ın içindeki 'isAdmin' bilgisini App.js'teki state'e gönderiyoruz
          setIsAdmin(decodedToken.isAdmin || false);
        } catch (e) {
          console.error("Token çözümlenirken hata:", e);
          setIsAdmin(false); // Herhangi bir hata olursa, kullanıcı admin değildir
        }
        // --- YENİ EKLENEN KISIM SONU ---

        Alert.alert('Başarılı', 'Giriş yapıldı');
        setIsAuthenticated(true); // Giriş yapıldığını App.js'e bildiriyoruz

      } else {
        Alert.alert('Hata', res.data.message || 'Giriş başarısız oldu.');
      }
    } catch (error) {
      console.error('Giriş sırasında hata:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanırken bir sorun oluştu.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <View style={styles.container}>
        <Text style={styles.title}>Giriş Yap</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Giriş Yap" onPress={handleLogin} color={theme.accent} />
        <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>
          Hesabın yok mu? Kayıt ol
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Stillerde değişiklik yok
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.primary,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  registerText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.accent,
  },
});
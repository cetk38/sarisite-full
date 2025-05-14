// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '../utils/api';
import theme from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const res = await post('/auth/login', { email, password });
    if (res.ok) {
      await AsyncStorage.setItem('token', res.data.token);
      Alert.alert('Başarılı', 'Giriş yapıldı');
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Hata', res.data.message || 'Giriş başarısız');
    }
  };

  return (
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

      <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>Hesabın yok mu? Kayıt ol</Text>
    </View>
  );
}

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

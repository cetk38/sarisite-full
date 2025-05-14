// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { post } from '../utils/api';
import theme from '../theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const res = await post('/auth/register', { name, email, password });
    if (res.ok) {
      Alert.alert('Başarılı', 'Kayıt tamamlandı. Giriş yapabilirsiniz.');
      navigation.navigate('Login');
    } else {
      Alert.alert('Hata', res.data.message || 'Kayıt başarısız');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>

      <TextInput
        style={styles.input}
        placeholder="Adınız"
        value={name}
        onChangeText={setName}
      />

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

      <Button title="Kayıt Ol" onPress={handleRegister} color={theme.accent} />

      <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>Zaten hesabınız var mı? Giriş yap</Text>
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
  loginText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.accent,
  },
});

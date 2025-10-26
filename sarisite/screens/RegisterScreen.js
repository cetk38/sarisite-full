// screens/RegisterScreen.js

import React, { useState } from 'react'; // Doğrusu bu
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { post } from '../utils/api'; // Merkezi API fonksiyonumuzu kullanıyoruz
import theme from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // YENİ: Telefon numarası state'i

  const handleRegister = async () => {
    try {
      // Basit bir boş alan kontrolü
      if (!name || !email || !password || !phoneNumber) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
        return;
      }

      // Backend'deki yeni rotamıza telefon numarasını da gönderiyoruz
      const res = await post('/auth/register', {
        name,
        email,
        password,
        phone_number: phoneNumber, // Backend'deki sütun adıyla eşleşmeli
      });

      if (res.ok) {
        // Kayıt başarılıysa, kullanıcıyı yeni "Onay Bekleniyor" ekranına yönlendir
        navigation.navigate('VerificationPending', { email: email });
      } else {
        // Sunucudan gelen hatayı göster (örn: "Bu e-posta zaten kayıtlı")
        Alert.alert('Kayıt Başarısız', res.data.message || 'Bilinmeyen bir hata oluştu.');
      }
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      Alert.alert('Hata', 'Sunucuya bağlanırken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hesap Oluştur</Text>

        <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="E-posta Adresi" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        
        {/* YENİ: Telefon Numarası Giriş Alanı */}
        <TextInput style={styles.input} placeholder="Telefon Numarası" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        
        <TextInput style={styles.input} placeholder="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
        
        <View style={{marginTop: 10}}>
         <Button title="Kayıt Ol" onPress={handleRegister} color={theme.accent} />
        </View>

        <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>
          Zaten bir hesabın var mı? Giriş Yap
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, fontSize: 16 },
  loginText: { marginTop: 20, textAlign: 'center', color: theme.accent, fontSize: 16 },
});
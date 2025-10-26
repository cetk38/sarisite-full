// screens/VerificationPendingScreen.js (YENİ DOSYA)

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VerificationPendingScreen({ route, navigation }) {
  // Kayıt ekranından gönderilen e-posta adresini alıyoruz
  const { email } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="email-check-outline" size={80} color={theme.accent} />
        <Text style={styles.title}>Kayıt Başarılı!</Text>
        <Text style={styles.message}>
          Hesabınızı doğrulamak için <Text style={{fontWeight: 'bold'}}>{email}</Text> e-posta adresine bir doğrulama linki gönderdik.
        </Text>
        <Text style={styles.message}>
          Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.
        </Text>
        <View style={{marginTop: 30, width: '80%'}}>
            <Button
              title="Giriş Ekranına Dön"
              onPress={() => navigation.navigate('Login')}
              color={theme.accent}
            />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
});
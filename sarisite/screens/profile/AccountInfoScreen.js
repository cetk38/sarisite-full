// screens/profile/AccountInfoScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { get } from '../../utils/api'; // Dizin yapısı nedeniyle ../../
import theme from '../../theme'; // Dizin yapısı nedeniyle ../../

// Bilgileri göstermek için küçük bir yardımcı component
const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default function AccountInfoScreen() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa açıldığında, backend'deki yeni /users/me rotasından verileri çek
    get('/users/me', true) // true -> bu isteğin token ile yapılması gerektiğini belirtir
      .then(data => {
        setUserInfo(data);
      })
      .catch(error => {
        console.error("Kullanıcı bilgileri alınamadı:", error);
        Alert.alert('Hata', 'Hesap bilgileriniz yüklenirken bir sorun oluştu.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // [] -> bu efektin sadece sayfa ilk açıldığında bir kez çalışmasını sağlar

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {userInfo ? (
          <View style={styles.infoContainer}>
            <InfoRow label="Ad Soyad" value={userInfo.name} />
            <InfoRow label="E-posta Adresi" value={userInfo.email} />
            <InfoRow label="Telefon Numarası" value={userInfo.phone_number || 'Belirtilmemiş'} />
          </View>
        ) : (
          <Text style={styles.value}>Kullanıcı bilgileri bulunamadı.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  infoContainer: {
    marginTop: 20,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});
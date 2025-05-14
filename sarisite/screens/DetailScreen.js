// screens/DetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import theme from '../theme';

export default function DetailScreen({ route }) {
  const { ad } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{ad.description}</Text>

      {ad.image_url && (
        <Image source={{ uri: ad.image_url }} style={styles.image} />
      )}

      <View style={styles.infoBox}>
        <Text style={styles.label}>Fiyat:</Text>
        <Text style={styles.value}>{ad.price} ₺</Text>

        <Text style={styles.label}>Yıl:</Text>
        <Text style={styles.value}>{ad.year}</Text>

        <Text style={styles.label}>Yakıt Tipi:</Text>
        <Text style={styles.value}>{ad.fuel_type}</Text>

        <Text style={styles.label}>Durum:</Text>
        <Text style={styles.value}>{ad.condition}</Text>

        <Text style={styles.label}>İlan Sahibi:</Text>
        <Text style={styles.value}>{ad.owner_name}</Text>

        <Text style={styles.label}>Tarih:</Text>
        <Text style={styles.value}>{new Date(ad.created_at).toLocaleDateString()}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.primary,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.text,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    marginBottom: 6,
  },
});
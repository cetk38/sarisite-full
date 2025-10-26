// components/UserAdCard.js (YENİ DOSYA)

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import theme from '../../theme';

export default function UserAdCard({ ad, onToggleStatus, onDelete, onEdit }) {
  const isActive = ad.is_active;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{ad.description || 'İlan Başlığı'}</Text>
      <Text style={styles.price}>{ad.price} ₺</Text>
      <Text style={styles.status}>
        Durum: {isActive ? 'Yayında' : 'Yayında Değil'}
        {!ad.approved && <Text style={styles.pending}> (Admin Onayı Bekliyor)</Text>}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Düzenle" onPress={() => onEdit(ad.id)} color={theme.accent} />
        <Button 
          title={isActive ? "Yayından Kaldır" : "Yeniden Yayınla"} 
          onPress={() => onToggleStatus(ad.id, !isActive)} 
          color={isActive ? "#ffc107" : "#28a745"}
        />
        <Button title="Sil" onPress={() => onDelete(ad.id)} color="#dc3545" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    color: theme.accent,
    marginVertical: 8,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  pending: {
    fontStyle: 'italic',
    color: '#ffc107',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
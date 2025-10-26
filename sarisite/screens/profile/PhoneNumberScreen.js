import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlaceholderScreen() { // Fonksiyon adını dosya adıyla aynı yapabilirsin
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bu sayfa yakında eklenecektir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: 'gray' }
});
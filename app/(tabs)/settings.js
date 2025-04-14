// app/(tabs)/settings.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Beállítások</Text>
      {/* Ide kerülhetnek majd a jövőben a beállítási lehetőségek */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Függőlegesen középre
    alignItems: 'center',    // Vízszintesen középre
    backgroundColor: '#E0E0E0', // Használjuk ugyanazt a hátteret, mint a listánál
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333', // Sötétebb szöveg
  },
});
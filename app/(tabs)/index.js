// app/index.js (vagy app/index.tsx)
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router'; // Fontos: Link importálása innen!

const GAMES = [
  { id: 'amoeba', name: 'Amőba' },
];

export default function HomeScreen() { // Maradhat a név, vagy lehet IndexScreen is

  const renderGameItem = ({ item }) => (
    // A Link komponens körbeveszi a kattintható elemet
    // A 'href' prop határozza meg a cél útvonalat
    // Dinamikusan hozzáfűzzük a játék ID-ját az útvonalhoz
    <Link href={`/game/${item.id}?name=${encodeURIComponent(item.name)}`} asChild>
      {/* 'asChild' prop azt jelenti, hogy a Link nem renderel saját elemet,
          hanem a gyermekét (TouchableOpacity) teszi navigációs linkké. */}
      <TouchableOpacity style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={GAMES}
        renderItem={renderGameItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#E0E0E0', // <-- Módosítsd ezt! Pl. egy világosszürke háttér
  },
  itemContainer: {
    // backgroundColor: '#f0f0f0', // Ezt kivettük vagy módosítjuk
    backgroundColor: '#FFFFFF', // <-- Legyenek a kártyák fehérek (vagy más színűek)
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8, // Kicsit kerekebb sarkok
    shadowColor: "#000", // Adjunk egy kis árnyékot (iOS)
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3, // Árnyék (Android)
  },
  itemText: {
    fontSize: 18,
    color: '#333333', // <-- Sötétebb szövegszín a jobb kontrasztért
  },
});
// app/(tabs)/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const APP_MAIN_COLOR = '#4A90E2';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarActiveTintColor: APP_MAIN_COLOR,
        tabBarInactiveTintColor: 'gray',
      }}
    >
      {/* 1. Játékok Fül (ez már megvolt) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Játékok',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      {/* 2. Beállítások Fül (EZ AZ ÚJ RÉSZ) */}
      <Tabs.Screen
        name="settings" // Ez hivatkozik az app/(tabs)/settings.js fájlra
        options={{
          title: 'Beállítások', // A fül címe
          tabBarIcon: ({ color, size }) => (
            // Keressünk egy fogaskerék ikont
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerShown: false, // Ennek se legyen saját fejléce a Tab Navigátorban
        }}
      />

    </Tabs>
  );
}
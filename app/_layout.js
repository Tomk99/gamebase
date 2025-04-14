// app/_layout.js
import { Stack } from 'expo-router';

// Választhatsz egy fő színt az alkalmazásodnak
const APP_MAIN_COLOR = '#4A90E2'; // Példa: egy kellemes kék szín

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: APP_MAIN_COLOR, // <-- Fejléc háttérszíne
        },
        headerTintColor: '#FFFFFF', // <-- Fejléc szövegének és gombjainak színe (pl. vissza gomb)
        headerTitleStyle: {
          // fontWeight: 'bold', // Félkövér cím, ha szeretnéd
        },
      }}
    >
      {/* A képernyők definíciói maradnak */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="game/[gameId]" />
    </Stack>
  );
}
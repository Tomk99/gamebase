import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import AmoebaGame from '../../components/AmoebaGame';

export default function GameScreen() {
  const { gameId, name } = useLocalSearchParams();
  const gameName = name ? decodeURIComponent(name) : 'Játék';

  let GameComponent;
  switch (gameId) {
    case 'amoeba':
      GameComponent = <AmoebaGame />;
      break;
    case 'chess':
      GameComponent = <Text style={styles.placeholderText}>Sakk Játék Helye...</Text>;
      break;
    default:
      GameComponent = <Text style={styles.placeholderText}>Ismeretlen Játék ID: {gameId}</Text>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: gameName }} />
      {GameComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 15,
    backgroundColor: '#E0E0E0',
  },
  placeholderText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: 'grey',
    marginTop: 50,
  },
});

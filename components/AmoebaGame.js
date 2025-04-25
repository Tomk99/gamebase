// components/AmoebaGame.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Button, ActivityIndicator } from 'react-native';
import { useGameSocket } from '../hooks/useGameSocket';

const BOARD_SIZE = 10;
const APP_MAIN_COLOR = '#4A90E2';

export default function AmoebaGame() {
  const createInitialState = () => ({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: null,
    gameOver: false,
    winner: null,
    myMark: null,
    gameStarted: false,
    message: 'Csatlakozás...',
    connectionStatus: 'disconnected'
  });

  const [board, setBoard] = useState(createInitialState().board);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [myMark, setMyMark] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('Csatlakozás...');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const resetState = () => {
    const s = createInitialState();
    setBoard(s.board);
    setCurrentPlayer(s.currentPlayer);
    setGameOver(s.gameOver);
    setWinner(s.winner);
    setMyMark(s.myMark);
    setGameStarted(s.gameStarted);
    setMessage(s.message);
  };

  const [revangePending, setRevangePending] = useState(false);

  const {
    sendMove,
    requestRevange,
    acceptRevange,
    declineRevange,
    myMarkRef
  } = useGameSocket({
    onAssignPlayer: (mark) => setMyMark(mark),
    onGameStart: ({ board, currentPlayer }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);
      setGameStarted(true);
      setGameOver(false);
      setWinner(null);
      setRevangePending(false);
    },
    onGameUpdate: ({ board, currentPlayer }) => {
      setBoard(board);
      setCurrentPlayer(currentPlayer);
    },
    onGameOver: ({ board, winner }) => {
      setBoard(board);
      setWinner(winner);
      setGameOver(true);
    },
    onOpponentLeft: () => {
      setGameOver(true);
      setGameStarted(false);
    },
    onError: (errorMsg) => console.warn('[Game Error]', errorMsg),
    onRevangeRequested: () => {
      Alert.alert(
        'Visszavágó kérése',
        'Az ellenfeled visszavágót szeretne. Elfogadod?',
        [
          { text: 'Elutasítom', style: 'cancel', onPress: () => declineRevange() },
          { text: 'Elfogadom', onPress: () => acceptRevange() },
        ]
      );
    },
    onRevangeAccepted: () => {
      setMessage('Az ellenfél elfogadta a visszavágót.');
      setRevangePending(false);
    },
    onRevangeDeclined: () => {
      setMessage('Az ellenfél nem fogadta el a visszavágót.');
      setRevangePending(false);
    },
    updateMessage: setMessage,
    updateConnectionStatus: setConnectionStatus,
    resetState
  });

  const handlePress = (row, col) => {
    if (
      connectionStatus !== 'connected' ||
      !gameStarted ||
      gameOver ||
      board[row][col] ||
      currentPlayer !== myMarkRef.current
    ) return;

    sendMove(row, col);
    setMessage(`Lépés elküldve. Várakozás ${currentPlayer === 'X' ? 'O' : 'X'} lépésére...`);
  };

  const screenWidth = Dimensions.get('window').width;
  const boardWidth = screenWidth * 0.95;
  const cellSize = boardWidth / BOARD_SIZE;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.statusContainer}>
        <Text style={styles.connectionStatusText}>Kapcsolat: {connectionStatus}</Text>
        {connectionStatus === 'connecting' && <ActivityIndicator size="small" color={APP_MAIN_COLOR} />}
        {myMark && <Text style={styles.playerMarkText}> (Jel: {myMark})</Text>}
      </View>

      <Text style={styles.statusText}>{message}</Text>

      {gameStarted && board && (
        <View style={[styles.board, { width: boardWidth, height: boardWidth }]}> 
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={colIndex}
                  style={[styles.cell, { width: cellSize, height: cellSize },
                    (currentPlayer === myMark && !cell && !gameOver) ? styles.myTurnCell : null
                  ]}
                  onPress={() => handlePress(rowIndex, colIndex)}
                  disabled={connectionStatus !== 'connected' || !gameStarted || gameOver || !!cell || currentPlayer !== myMarkRef.current}
                >
                  <Text style={[styles.cellText, { fontSize: cellSize * 0.6 }, cell === 'X' ? styles.cellTextX : styles.cellTextO]}>
                    {cell}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {!gameStarted && connectionStatus === 'connected' && (
        <ActivityIndicator size="large" color={APP_MAIN_COLOR} style={{ marginTop: 50 }} />
      )}

      {(connectionStatus === 'disconnected' || connectionStatus === 'error') && !gameOver && (
        <Text style={[styles.statusText, { color: 'red', marginTop: 50 }]}>Nem sikerült csatlakozni. Próbáld újra!</Text>
      )}

      {(gameOver || connectionStatus === 'error' || connectionStatus === 'disconnected') && (
        <View style={styles.resetButtonContainer}>
          <Button
            title={revangePending ? 'Várakozás elfogadásra...' : 'Visszavágó kérése'}
            onPress={() => {
              requestRevange();
              setRevangePending(true);
            }}
            color={APP_MAIN_COLOR}
            disabled={revangePending}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    width: '95%',
    justifyContent: 'center',
    marginBottom: 5,
    minHeight: 25,
  },
  connectionStatusText: {
    fontSize: 14,
    color: '#555',
    marginRight: 10,
  },
  playerMarkText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
    minHeight: 30,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  board: {
    backgroundColor: '#DDDDDD',
    borderWidth: 1,
    borderColor: '#555',
    flexDirection: 'column',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cellText: {
    fontWeight: 'bold',
  },
  cellTextX: {
    color: '#3498DB',
  },
  cellTextO: {
    color: '#E74C3C',
  },
  myTurnCell: {
    backgroundColor: '#E8F8F5',
  },
  resetButtonContainer: {
    marginTop: 'auto',
    marginBottom: 10,
    paddingTop: 10,
    width: '70%',
  },
});

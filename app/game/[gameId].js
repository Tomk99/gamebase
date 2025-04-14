// app/game/[gameId].js
import React, { useState, useEffect, useRef } from 'react'; // useRef hozzáadva
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Button, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

// --- Amőba Játék Komponens (JAVÍTVA a myMark kezelése useRef-fel) ---
const BOARD_SIZE = 10; // Tábla mérete (10x10)
// !! FONTOS: Cseréld ki a saját géped helyi IP címére, amikor a backend fut !!
// Pl. ws://192.168.1.10:8080/websocket/game (a port és az útvonal függ a backendtől)
const WEBSOCKET_URL = 'wss://gamebase-backend-1f36fa276e96.herokuapp.com/websocket/game';

function AmoebaGame() {
  // --- Állapotok ---
  // Kezdeti állapot létrehozása (ez fut le a resetGame-nél is)
  const createInitialState = () => ({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: null,
    gameOver: false,
    winner: null,
    myMark: null,
    gameStarted: false,
    message: 'Csatlakozás...',
  });

  const [board, setBoard] = useState(createInitialState().board);
  const [currentPlayer, setCurrentPlayer] = useState(createInitialState().currentPlayer);
  const [gameOver, setGameOver] = useState(createInitialState().gameOver);
  const [winner, setWinner] = useState(createInitialState().winner);
  const [myMark, setMyMark] = useState(createInitialState().myMark); // State továbbra is kell a UI frissítéshez
  const [gameStarted, setGameStarted] = useState(createInitialState().gameStarted);
  const [message, setMessage] = useState(createInitialState().message);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);
  const myMarkRef = useRef(myMark); // <<< ÚJ: Ref a myMark tárolására

  // --- Ref Frissítő Effekt ---
  useEffect(() => {
    myMarkRef.current = myMark; // Frissítjük a ref értékét, amikor a state változik
    console.log(`[Frontend] myMarkRef frissítve: ${myMarkRef.current}`);
  }, [myMark]); // Csak myMark változásakor fut

  // --- WebSocket Kapcsolat Kezelése (useEffect) ---
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      console.log('[Frontend] WebSocket: Csatlakozás próbálkozás...');
      setMessage('Csatlakozás...');
      setConnectionStatus('connecting');

      const socket = new WebSocket(WEBSOCKET_URL);
      ws.current = socket;

      socket.onopen = () => {
        console.log('[Frontend] WebSocket: Csatlakozva!');
        setConnectionStatus('connected');
        setMessage('Várakozás a másik játékosra...');
      };

      socket.onmessage = (event) => {
        console.log(`[Frontend] WebSocket: RÁÉRKEZETT ÜZENET`, event.data);
        try {
          const serverMessage = JSON.parse(event.data);
          // Használjuk a ref aktuális értékét az összehasonlításhoz!
          const currentMyMark = myMarkRef.current; // <<< A ref értékét használjuk itt!
          console.log(`[Frontend] WebSocket: Feldolgozandó üzenet (MyMark Ref: ${currentMyMark}):`, serverMessage);

          // Itt tároljuk az aktuális állapotot a feldolgozás előtt a logoláshoz
          const previousPlayerState = currentPlayer;

          switch (serverMessage.type) {
            case 'ASSIGN_PLAYER':
              console.log(`[Frontend] WebSocket: 'ASSIGN_PLAYER' feldolgozása...`);
              // Itt a state-et állítjuk be, a ref a másik effectben frissül
              setMyMark(serverMessage.payload.mark);
              setMessage(serverMessage.payload.mark === 'O' ? 'Te vagy O. Várakozás X lépésére...' : 'Te vagy X. Várakozás a másik játékosra...');
              break;
            case 'GAME_START':
              console.log(`[Frontend] WebSocket: 'GAME_START' feldolgozása...`);
              setGameStarted(true);
              setBoard(serverMessage.payload.board);
              setCurrentPlayer(serverMessage.payload.currentPlayer);
              console.log(`[Frontend] GAME_START után - Board beállítva? ${Array.isArray(serverMessage.payload.board)}, CurrentPlayer state lett: ${serverMessage.payload.currentPlayer}`);
              // A ref értékét használjuk az összehasonlításhoz!
              setMessage(serverMessage.payload.currentPlayer === currentMyMark ? 'Te következel!' : `Ellenfeled (${serverMessage.payload.currentPlayer}) következik.`);
              setGameOver(false);
              setWinner(null);
              break;
            case 'GAME_UPDATE':
              console.log(`[Frontend] WebSocket: 'GAME_UPDATE' feldolgozása...`);
              setBoard(serverMessage.payload.board);
              setCurrentPlayer(serverMessage.payload.currentPlayer);
              console.log(`[Frontend] GAME_UPDATE után - Board beállítva? ${Array.isArray(serverMessage.payload.board)}, CurrentPlayer state lett: ${serverMessage.payload.currentPlayer}`);
              // A ref értékét használjuk az összehasonlításhoz!
              setMessage(serverMessage.payload.currentPlayer === currentMyMark ? 'Te következel!' : `Ellenfeled (${serverMessage.payload.currentPlayer}) következik.`);
              break;
            case 'GAME_OVER':
              console.log(`[Frontend] WebSocket: 'GAME_OVER' feldolgozása...`);
              setBoard(serverMessage.payload.board);
              setWinner(serverMessage.payload.winner);
              setGameOver(true);
              // A ref értékét használjuk az összehasonlításhoz!
              const endMessage = serverMessage.payload.winner === 'draw'
                                  ? 'Döntetlen!'
                                  : (serverMessage.payload.winner === currentMyMark ? 'Nyertél!' : 'Vesztettél!');
              setMessage(`Játék vége! ${endMessage}`);
              Alert.alert("Játék vége!", endMessage);
              break;
            case 'OPPONENT_LEFT':
              console.log(`[Frontend] WebSocket: 'OPPONENT_LEFT' feldolgozása...`);
              setMessage('Az ellenfeled lecsatlakozott. A játéknak vége.');
              setGameOver(true);
              setGameStarted(false);
              break;
            case 'ERROR':
              console.log(`[Frontend] WebSocket: 'ERROR' feldolgozása...`, serverMessage.payload.message);
              setMessage(`Hiba: ${serverMessage.payload.message}`);
              Alert.alert("Szerver hiba", serverMessage.payload.message);
              break;
            default:
              console.log("[Frontend] WebSocket: Ismeretlen üzenettípus:", serverMessage.type);
          } // switch vége
          // Logoljuk az állapotot a feldolgozás UTÁN is
          console.log(`[Frontend] WebSocket: Feldolgozás vége (${serverMessage.type}). CurrentPlayer state: ${currentPlayer}, MyMark Ref: ${currentMyMark}`);
        } catch (error) {
          console.error("[Frontend] WebSocket: Hiba az üzenet feldolgozása közben:", error);
          setMessage("Hiba a szerver válasszal.");
        }
      }; // onmessage vége

      socket.onerror = (error) => {
        console.error('WebSocket Hiba:', error.message);
        setConnectionStatus('error');
        setMessage('Kapcsolódási hiba.');
      };

      socket.onclose = (event) => {
        console.log('WebSocket: Kapcsolat bezárult (onclose event):', event.code, event.reason);
        if (ws.current) {
             setConnectionStatus('disconnected');
             setMessage('Kapcsolat megszakadt.');
             ws.current = null;
             if (gameStarted) {
                 setGameOver(true);
             }
        }
      };

      // Cleanup funkció
      return () => {
        console.log('WebSocket: Cleanup fut (unmount)');
        const currentSocket = ws.current;
        ws.current = null;
        if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
          console.log('WebSocket: Kapcsolat bontása (cleanup)');
          currentSocket.close();
        } else if (currentSocket) {
          console.log('WebSocket: Kapcsolat már nem volt nyitva cleanup során (readyState: ' + currentSocket.readyState + ')');
        } else {
          console.log('WebSocket: Nem volt aktív kapcsolat a cleanup során.');
        }
        const initialState = createInitialState();
        setBoard(initialState.board);
        setCurrentPlayer(initialState.currentPlayer);
        setGameOver(initialState.gameOver);
        setWinner(initialState.winner);
        setMyMark(initialState.myMark);
        setGameStarted(initialState.gameStarted);
        setMessage(initialState.message);
        setConnectionStatus('disconnected');
      }; // cleanup vége

    } // if (connectionStatus === 'disconnected') vége

  }, []); // Ennek a fő effectnek a dependency tömbje maradjon üres!


  // --- Lépés Kezelése (handlePress) ---
  const handlePress = (rowIndex, colIndex) => {
      // Használjuk a ref aktuális értékét az ellenőrzéshez!
      const currentMyMark = myMarkRef.current; // <<< Ref használata
      console.log(`[Frontend] handlePress - Cella: [${rowIndex},${colIndex}]. Feltétel ellenőrzés: Status=${connectionStatus}, Started=${gameStarted}, Over=${gameOver}, CellValue=${board[rowIndex][colIndex]}, Current=${currentPlayer}, MyMark Ref=${currentMyMark}`);

    // Az ellenőrzésnél a currentMyMark-ot (ref értékét) használjuk!
    if (connectionStatus !== 'connected' || !gameStarted || gameOver || board[rowIndex][colIndex] || currentPlayer !== currentMyMark) {
       if (currentPlayer !== currentMyMark && !gameOver && gameStarted) {
         console.log(`[Frontend] handlePress: Nem te jössz (Current state: ${currentPlayer}, MyMark Ref: ${currentMyMark}).`);
       }
       // A többi logolás maradhat...
       return;
    }

    // Üzenet összeállítása és küldése
    const moveData = { type: 'MAKE_MOVE', payload: { row: rowIndex, col: colIndex } };
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('[Frontend] WebSocket: Üzenet küldése:', JSON.stringify(moveData));
      ws.current.send(JSON.stringify(moveData));
      setMessage(`Lépés elküldve. Várakozás ${currentPlayer === 'X' ? 'O' : 'X'} lépésére...`); // Visszajelzés
    } else {
      console.error("WebSocket nincs nyitva, nem lehet lépést küldeni.");
      Alert.alert("Hiba", "Nincs kapcsolat a szerverrel.");
    }
  }; // handlePress vége


  // --- Játék Újraindítása ---
  const resetGame = () => {
     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
         ws.current.send(JSON.stringify({ type: 'RESET_GAME' }));
         setMessage("Új játék kérése...");
     } else {
         const initialState = createInitialState();
         setBoard(initialState.board);
         setCurrentPlayer(initialState.currentPlayer);
         setGameOver(initialState.gameOver);
         setWinner(initialState.winner);
         setMyMark(initialState.myMark);
         setGameStarted(initialState.gameStarted);
         setMessage(initialState.message);
         console.log("Helyi reset (nincs kapcsolat). Újracsatlakozás...");
         setConnectionStatus('disconnected');
     }
  }; // resetGame vége


  // --- Vizuális Megjelenítés ---
  const screenWidth = Dimensions.get('window').width;
  const boardWidth = screenWidth * 0.95;
  const cellSize = boardWidth / BOARD_SIZE;

  return (
    <View style={styles.gameContainer}>
      {/* Kapcsolat és Játékos Infó */}
      <View style={styles.statusContainer}>
        <Text style={styles.connectionStatusText}>Kapcsolat: {connectionStatus}</Text>
        {connectionStatus === 'connecting' && <ActivityIndicator size="small" color={APP_MAIN_COLOR}/>}
        {/* A kijelzéshez a 'myMark' state-et használjuk, ami rendben van */}
        {myMark && <Text style={styles.playerMarkText}> (Jel: {myMark})</Text>}
      </View>

      {/* Játék Állapot / Üzenet */}
      <Text style={styles.statusText}>{message}</Text>

      {/* Játéktábla */}
      {gameStarted && board && (
          <View style={[styles.board, { width: boardWidth, height: boardWidth }]}>
            {board.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((cell, colIndex) => (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                        styles.cell,
                        { width: cellSize, height: cellSize },
                        // A kiemeléshez is a 'myMark' state jó
                        (currentPlayer === myMark && !board[rowIndex][colIndex] && !gameOver) ? styles.myTurnCell : null
                    ]}
                    onPress={() => handlePress(rowIndex, colIndex)}
                    // A letiltáshoz kell a ref értéke, amit a handlePress elején olvasunk ki
                    disabled={connectionStatus !== 'connected' || !gameStarted || gameOver || !!board[rowIndex][colIndex] || currentPlayer !== myMarkRef.current /* Itt is a ref kellene, de a handlePress elején már ellenőrizzük */}
                  >
                    <Text style={[
                        styles.cellText,
                        { fontSize: cellSize * 0.6 },
                        cell === 'X' ? styles.cellTextX : styles.cellTextO
                    ]}>
                      {cell}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
      )}
      {!gameStarted && connectionStatus === 'connected' && (
          <ActivityIndicator size="large" color={APP_MAIN_COLOR} style={{marginTop: 50}} />
      )}
       { (connectionStatus === 'disconnected' || connectionStatus === 'error') && !gameOver && (
           <Text style={[styles.statusText, {color: 'red', marginTop: 50}]}>Nem sikerült csatlakozni. Próbáld újra!</Text>
       )}

      {/* Új Játék Gomb */}
      {(gameOver || connectionStatus === 'error' || connectionStatus === 'disconnected') && (
         <View style={styles.resetButtonContainer}>
           <Button title={connectionStatus === 'connected' ? "Új Játék" : "Újracsatlakozás"} onPress={resetGame} color={APP_MAIN_COLOR} />
         </View>
       )}
    </View> // <-- return vége
  ); // <-- AmoebaGame komponens vége

} // <-- AmoebaGame függvény vége


// --- Fő Képernyő Komponens (GameScreen) ---
export default function GameScreen() {
  const { gameId, name } = useLocalSearchParams();
  const gameName = name ? decodeURIComponent(name) : 'Játék';

  let GameComponent = null;
  if (gameId === 'amoeba') {
    GameComponent = <AmoebaGame />;
  } else if (gameId === 'chess') {
    GameComponent = <Text style={styles.placeholderText}>Sakk Játék Helye...</Text>;
  } else {
    GameComponent = <Text style={styles.placeholderText}>Ismeretlen Játék ID: {gameId}</Text>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: gameName }} />
      {GameComponent}
    </View>
  );
}


// --- Stílusok ---
const APP_MAIN_COLOR = '#4A90E2';
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
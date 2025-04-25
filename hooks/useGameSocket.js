// hooks/useGameSocket.js
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

const WEBSOCKET_URL = 'wss://gamebase-backend-1f36fa276e96.herokuapp.com/websocket/game';

export function useGameSocket({
  onAssignPlayer,
  onGameStart,
  onGameUpdate,
  onGameOver,
  onOpponentLeft,
  onError,
  onRevangeRequested,
  onRevangeAccepted,
  onRevangeDeclined,
  updateMessage,
  updateConnectionStatus,
  resetState,
}) {
  const wsRef = useRef(null);
  const myMarkRef = useRef(null);

  useEffect(() => {
    updateConnectionStatus('connecting');
    updateMessage('Csatlakozás...');

    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      updateConnectionStatus('connected');
      updateMessage('Várakozás a másik játékosra...');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const currentMyMark = myMarkRef.current;

        switch (message.type) {
          case 'ASSIGN_PLAYER':
            myMarkRef.current = message.payload.mark;
            onAssignPlayer(message.payload.mark);
            updateMessage(
              message.payload.mark === 'O'
                ? 'Te vagy O. Várakozás X lépésére...'
                : 'Te vagy X. Várakozás a másik játékosra...'
            );
            break;
          case 'GAME_START':
            onGameStart(message.payload);
            updateMessage(
              message.payload.currentPlayer === currentMyMark
                ? 'Te következel!'
                : `Ellenfeled (${message.payload.currentPlayer}) következik.`
            );
            break;
          case 'GAME_UPDATE':
            onGameUpdate(message.payload);
            updateMessage(
              message.payload.currentPlayer === currentMyMark
                ? 'Te következel!'
                : `Ellenfeled (${message.payload.currentPlayer}) következik.`
            );
            break;
          case 'GAME_OVER':
            onGameOver(message.payload);
            const endMsg = message.payload.winner === 'draw'
              ? 'Döntetlen!'
              : (message.payload.winner === currentMyMark ? 'Nyertél!' : 'Vesztettél!');
            updateMessage(`Játék vége! ${endMsg}`);
            Alert.alert('Játék vége!', endMsg);
            break;
          case 'OPPONENT_LEFT':
            onOpponentLeft();
            updateMessage('Az ellenfeled lecsatlakozott. A játéknak vége.');
            break;
          case 'ERROR':
            onError(message.payload.message);
            updateMessage(`Hiba: ${message.payload.message}`);
            Alert.alert('Szerver hiba', message.payload.message);
            break;
          case 'REVANCHE_REQUEST':
            onRevangeRequested && onRevangeRequested();
            break;
          case 'REVANCHE_ACCEPTED':
            onRevangeAccepted && onRevangeAccepted();
            break;
          case 'REVANCHE_DECLINED':
            onRevangeDeclined && onRevangeDeclined();
            Alert.alert('Visszavágó elutasítva', 'Az ellenfél nem kért új játékot.');
            break;
          default:
            console.warn('[WS Hook] Ismeretlen üzenettípus:', message.type);
        }
      } catch (e) {
        console.error('[WS Hook] Üzenet feldolgozási hiba:', e);
        updateMessage('Hiba a szerver válasszal.');
      }
    };

    socket.onerror = (err) => {
      updateConnectionStatus('error');
      updateMessage('Kapcsolódási hiba.');
    };

    socket.onclose = () => {
      wsRef.current = null;
      updateConnectionStatus('disconnected');
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      myMarkRef.current = null;
      resetState();
    };
  }, []);

  const sendMove = (row, col) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'MAKE_MOVE', payload: { row, col } }));
    } else {
      Alert.alert('Hiba', 'Nincs nyitott kapcsolat.');
    }
  };

  const requestReset = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RESET_GAME' }));
      updateMessage('Új játék kérése...');
    } else {
      resetState();
      updateConnectionStatus('disconnected');
      updateMessage('Kapcsolat megszakadt.');
    }
  };

  const requestRevange = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'REQUEST_REVANCHE' }));
      updateMessage('Visszavágó kérés elküldve...');
    }
  };

  const acceptRevange = () => {
    wsRef.current?.send(JSON.stringify({ type: 'ACCEPT_REVANCHE' }));
  };

  const declineRevange = () => {
    wsRef.current?.send(JSON.stringify({ type: 'DECLINE_REVANCHE' }));
  };

  return {
    sendMove,
    requestReset,
    requestRevange,
    acceptRevange,
    declineRevange,
    wsRef,
    myMarkRef
  };
}

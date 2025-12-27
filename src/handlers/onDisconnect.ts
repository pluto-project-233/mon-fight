import { WebSocket } from 'ws';
import { matchmaker } from '../matchmaking/Matchmaker';
import { getPlayerId, removePlayer } from './onConnect';

export function handleDisconnect(ws: WebSocket) {
  const playerId = getPlayerId(ws);

  if (playerId) {
    console.log(`Player ${playerId} disconnected`);

    // Remove from matchmaking and handle in-game disconnect
    matchmaker.removePlayer(playerId);

    // Clean up player mapping
    removePlayer(ws);
  }
}

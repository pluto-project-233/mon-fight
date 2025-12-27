import { WebSocket } from 'ws';
import { matchmaker } from '../matchmaking/Matchmaker';
import { v4 as uuidv4 } from 'uuid';

const connectedPlayers = new Map<WebSocket, string>();

export function handleConnect(ws: WebSocket) {
  const playerId = uuidv4();
  connectedPlayers.set(ws, playerId);

  console.log(`Player ${playerId} connected`);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    payload: {
      playerId
    }
  }));

  // Add to matchmaking queue
  matchmaker.addPlayer({
    id: playerId,
    ws: ws
  });
}

export function getPlayerId(ws: WebSocket): string | undefined {
  return connectedPlayers.get(ws);
}

export function removePlayer(ws: WebSocket) {
  connectedPlayers.delete(ws);
}

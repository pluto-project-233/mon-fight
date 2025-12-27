import { WebSocket } from 'ws';
import { getPlayerId } from './onConnect';
import { matchmaker } from '../matchmaking/Matchmaker';
import { SwapMove } from '../shared/types';

interface MovePayload {
  move: SwapMove;
}

export function handlePlayerMove(ws: WebSocket, payload: MovePayload) {
  const playerId = getPlayerId(ws);
  if (!playerId) {
    console.error('Player ID not found for move');
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Player not found' }
    }));
    return;
  }

  // Find room for this player
  const room = matchmaker.getRoomByPlayerId(playerId);
  if (!room) {
    console.error(`Room not found for player ${playerId}`);
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Not in a game' }
    }));
    return;
  }

  // Validate payload
  if (!payload.move ||
      typeof payload.move.x1 !== 'number' ||
      typeof payload.move.y1 !== 'number' ||
      typeof payload.move.x2 !== 'number' ||
      typeof payload.move.y2 !== 'number') {
    ws.send(JSON.stringify({
      type: 'ERROR',
      payload: { message: 'Invalid move format' }
    }));
    return;
  }

  console.log(`Player ${playerId} move:`, payload.move);

  // Process move
  room.handleMove(playerId, payload.move);
}

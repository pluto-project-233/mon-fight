import { GameRoom } from '../game/GameRoom';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  ws: any;
}

export class Matchmaker {
  private queue: Player[] = [];
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  addPlayer(player: Player) {
    this.queue.push(player);
    console.log(`Player ${player.id} added to queue. Queue size: ${this.queue.length}`);

    // Notify player they're waiting
    player.ws.send(JSON.stringify({
      type: 'WAITING_FOR_OPPONENT',
      payload: { queuePosition: this.queue.length }
    }));

    // Try to match if we have 2+ players
    if (this.queue.length >= 2) {
      this.createMatch();
    }
  }

  private createMatch() {
    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    const roomId = uuidv4();
    const room = new GameRoom(roomId, [player1, player2]);

    this.rooms.set(roomId, room);
    this.playerRooms.set(player1.id, roomId);
    this.playerRooms.set(player2.id, roomId);

    console.log(`Match created: ${roomId}`);

    // Start the game
    room.start();
  }

  removePlayer(playerId: string) {
    // Remove from queue
    this.queue = this.queue.filter(p => p.id !== playerId);

    // Handle disconnect from active room
    const roomId = this.playerRooms.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.handleDisconnect(playerId);
        // Clean up room after disconnect
        this.cleanupRoom(roomId);
      }
      this.playerRooms.delete(playerId);
    }
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByPlayerId(playerId: string): GameRoom | undefined {
    const roomId = this.playerRooms.get(playerId);
    if (roomId) {
      return this.rooms.get(roomId);
    }
    return undefined;
  }

  cleanupRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Remove player mappings
      for (const player of room.players) {
        this.playerRooms.delete(player.id);
      }
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} cleaned up`);
    }
  }
}

// Singleton instance
export const matchmaker = new Matchmaker();

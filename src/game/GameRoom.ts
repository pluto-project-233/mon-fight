import { GameState, PlayerNumber } from './GameState';
import { TurnResolver } from './TurnResolver';
import { SwapMove } from '../shared/types';
import { TURN_TIME_MS, TURN_WARNING_MS, MAX_AFK_COUNT } from '../shared/constants';

interface Player {
  id: string;
  ws: any;
  playerNumber: PlayerNumber;
}

export class GameRoom {
  public id: string;
  public players: Player[];
  public gameState: GameState;
  public seed: number;
  private turnResolver: TurnResolver;
  private turnTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private turnStartTime: number = 0;

  constructor(roomId: string, players: any[]) {
    this.id = roomId;
    this.seed = Date.now();
    this.turnResolver = new TurnResolver();

    // Assign player numbers
    this.players = players.map((p, index) => ({
      id: p.id,
      ws: p.ws,
      playerNumber: (index === 0 ? 'PLAYER_1' : 'PLAYER_2') as PlayerNumber
    }));

    this.gameState = new GameState(this.seed);

    // Link player IDs to game state
    this.players.forEach(p => {
      const playerState = this.gameState.players.get(p.playerNumber);
      if (playerState) {
        playerState.odlplayerId = p.id;
      }
    });
  }

  start() {
    console.log(`Game started in room ${this.id}`);
    this.gameState.phase = 'PLAYING';

    // Tell each player their assignment
    this.players.forEach(player => {
      const playerState = this.gameState.players.get(player.playerNumber);

      player.ws.send(JSON.stringify({
        type: 'PLAYER_ASSIGNED',
        payload: {
          playerNumber: player.playerNumber,
          odlmonsterId: playerState?.monsterId,
          monsterName: playerState?.monsterName,
          element: playerState?.element
        }
      }));
    });

    // Broadcast game start with initial state
    this.broadcast({
      type: 'GAME_START',
      payload: {
        roomId: this.id,
        gameState: this.gameState.serialize()
      }
    });

    // Start turn timer
    this.startTurnTimer();
  }

  private startTurnTimer() {
    this.clearTimers();
    this.turnStartTime = Date.now();

    // Warning at 10 seconds remaining
    this.warningTimer = setTimeout(() => {
      this.broadcastToCurrentPlayer({
        type: 'TURN_TIMEOUT_WARNING',
        payload: {
          remainingMs: TURN_WARNING_MS
        }
      });
    }, TURN_TIME_MS - TURN_WARNING_MS);

    // Timeout after 30 seconds
    this.turnTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, TURN_TIME_MS);
  }

  private clearTimers() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private handleTurnTimeout() {
    const currentPlayer = this.gameState.players.get(this.gameState.currentTurn)!;
    currentPlayer.afkCount++;

    console.log(`Player ${this.gameState.currentTurn} timeout. AFK count: ${currentPlayer.afkCount}`);

    // Broadcast timeout event
    this.broadcast({
      type: 'TURN_TIMEOUT',
      payload: {
        player: this.gameState.currentTurn,
        afkCount: currentPlayer.afkCount
      }
    });

    // Check if player should lose
    if (currentPlayer.afkCount >= MAX_AFK_COUNT) {
      // Auto-lose: set HP to 0
      currentPlayer.hp = 0;
      this.gameState.checkGameEnd();
      this.broadcastGameEnd();
      return;
    }

    // Switch turn without making a move
    this.gameState.switchTurn();

    // Broadcast state update
    this.broadcast({
      type: 'GAME_STATE_UPDATE',
      payload: {
        gameState: this.gameState.serialize(),
        reason: 'TURN_TIMEOUT'
      }
    });

    // Start new turn timer
    this.startTurnTimer();
  }

  handleMove(playerId: string, move: SwapMove) {
    // Find player
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.error(`Player ${playerId} not found in room ${this.id}`);
      return;
    }

    // Process move
    const result = this.turnResolver.processMove(
      this.gameState,
      player.playerNumber,
      move
    );

    if (!result) {
      // Invalid move
      player.ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid move' }
      }));
      return;
    }

    // Clear turn timer (will restart after animation)
    this.clearTimers();

    // Broadcast move result with cascade steps for animation
    this.broadcast({
      type: 'MOVE_RESULT',
      payload: {
        player: player.playerNumber,
        move,
        result: {
          matches: result.matches,
          totalDamage: result.totalDamage,
          healAmount: result.healAmount,
          chargeGained: result.chargeGained,
          cascadeCount: result.cascadeCount,
          cascadeSteps: result.cascadeSteps,
          bonusMoves: result.bonusMoves
        },
        movesRemaining: this.gameState.movesRemaining,
        turnChanged: this.gameState.currentTurn !== player.playerNumber
      }
    });

    // Check if game ended
    if (this.gameState.phase === 'END') {
      this.broadcastGameEnd();
      return;
    }

    // Broadcast updated game state
    this.broadcast({
      type: 'GAME_STATE_UPDATE',
      payload: {
        gameState: this.gameState.serialize()
      }
    });

    // Start new turn timer
    this.startTurnTimer();
  }

  private broadcastGameEnd() {
    this.clearTimers();

    this.broadcast({
      type: 'GAME_END',
      payload: {
        winner: this.gameState.winner,
        finalState: this.gameState.serialize()
      }
    });

    console.log(`Game ended in room ${this.id}. Winner: ${this.gameState.winner}`);
  }

  handleDisconnect(playerId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    this.clearTimers();

    // Set disconnected player HP to 0
    const playerState = this.gameState.players.get(player.playerNumber);
    if (playerState) {
      playerState.hp = 0;
    }

    this.gameState.checkGameEnd();

    // Notify remaining player
    const opponent = this.players.find(p => p.id !== playerId);
    if (opponent) {
      opponent.ws.send(JSON.stringify({
        type: 'OPPONENT_DISCONNECTED',
        payload: {
          winner: opponent.playerNumber
        }
      }));
    }

    console.log(`Player ${playerId} disconnected from room ${this.id}`);
  }

  private broadcastToCurrentPlayer(message: any) {
    const currentPlayer = this.players.find(
      p => p.playerNumber === this.gameState.currentTurn
    );
    if (currentPlayer) {
      currentPlayer.ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.players.forEach(player => {
      try {
        player.ws.send(data);
      } catch (e) {
        console.error(`Failed to send to player ${player.id}:`, e);
      }
    });
  }

  getRemainingTurnTime(): number {
    if (!this.turnStartTime) return TURN_TIME_MS;
    const elapsed = Date.now() - this.turnStartTime;
    return Math.max(0, TURN_TIME_MS - elapsed);
  }

  getPlayerByWs(ws: any): Player | undefined {
    return this.players.find(p => p.ws === ws);
  }
}

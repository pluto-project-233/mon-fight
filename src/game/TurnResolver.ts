import { GameState, PlayerNumber } from './GameState';
import { PhaseResolver, ResolveResult } from './PhaseResolver';
import { SwapMove } from '../shared/types';

export interface MoveValidation {
  valid: boolean;
  error?: string;
}

export class TurnResolver {
  private phaseResolver: PhaseResolver;

  constructor() {
    this.phaseResolver = new PhaseResolver();
  }

  validateMove(
    gameState: GameState,
    playerNumber: PlayerNumber,
    move: SwapMove
  ): MoveValidation {
    // Check if game is in playing phase
    if (gameState.phase !== 'PLAYING') {
      return { valid: false, error: 'Game is not in playing phase' };
    }

    // Check if it's player's turn
    if (gameState.currentTurn !== playerNumber) {
      return { valid: false, error: 'Not your turn' };
    }

    // Check if positions are valid
    const { x1, y1, x2, y2 } = move;
    if (!gameState.board.isValidPosition(x1, y1) ||
        !gameState.board.isValidPosition(x2, y2)) {
      return { valid: false, error: 'Invalid position' };
    }

    // Check if positions are adjacent
    if (!gameState.board.isAdjacent(x1, y1, x2, y2)) {
      return { valid: false, error: 'Orbs must be adjacent' };
    }

    return { valid: true };
  }

  processMove(
    gameState: GameState,
    playerNumber: PlayerNumber,
    move: SwapMove
  ): ResolveResult | null {
    // Validate move
    const validation = this.validateMove(gameState, playerNumber, move);
    if (!validation.valid) {
      console.log(`Invalid move: ${validation.error}`);
      return null;
    }

    // Reset AFK count for this player
    const player = gameState.players.get(playerNumber)!;
    player.afkCount = 0;

    // Set phase to RESOLVING
    gameState.phase = 'RESOLVING';

    // Process through phase resolver
    const result = this.phaseResolver.resolve(gameState, move);

    // If game didn't end, check if player has more moves
    // (checkGameEnd() in PhaseResolver may have set phase to 'END')
    if (gameState.winner === null) {
      // Use move and add any bonus moves from 4+ orb matches
      const hasMoves = gameState.useMove(result.bonusMoves);
      
      if (hasMoves) {
        // Player still has moves - continue their turn
        gameState.phase = 'PLAYING';
      } else {
        // No more moves - switch turn
        gameState.switchTurn();
        gameState.phase = 'PLAYING';
      }
    }

    return result;
  }
}

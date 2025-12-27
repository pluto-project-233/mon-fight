import { GameState, PlayerNumber } from './GameState';
import { Matcher, Match } from '../puzzle/Matcher';
import { Gravity, GravityResult } from '../puzzle/Gravity';
import { DamageCalculator, DamageResult } from '../combat/DamageCalculator';
import { Position, OrbType } from '../puzzle/Board';
import { SwapMove } from '../shared/types';
import { CHARGE_MAX, BONUS_MOVE_THRESHOLD } from '../shared/constants';

// Single cascade step for animation
export interface CascadeStep {
  stepNumber: number;
  matches: Match[];           // 1a: matched orbs to highlight
  clearedPositions: Position[]; // 1b: positions that will be cleared
  clearedOrbs: Array<{ position: Position; type: OrbType }>; // orb types before clearing
  gravityMovements: Array<{ from: Position; to: Position }>; // 1c: gravity drops
  newOrbs: Array<{ position: Position; type: OrbType }>;  // 1d: new orbs from top
}

export interface ResolveResult {
  matches: Match[];
  totalDamage: number;
  healAmount: number;
  chargeGained: number;
  cascadeCount: number;
  orbsCleared: Position[];
  gravityResults: GravityResult[];
  cascadeSteps: CascadeStep[];  // Detailed steps for animation
  bonusMoves: number;           // Extra moves earned from 4+ matches
}

export class PhaseResolver {
  private matcher: Matcher;
  private gravity: Gravity;
  private damageCalculator: DamageCalculator;

  constructor() {
    this.matcher = new Matcher();
    this.gravity = new Gravity();
    this.damageCalculator = new DamageCalculator();
  }

  resolve(gameState: GameState, move: SwapMove): ResolveResult {
    const result: ResolveResult = {
      matches: [],
      totalDamage: 0,
      healAmount: 0,
      chargeGained: 0,
      cascadeCount: 0,
      orbsCleared: [],
      gravityResults: [],
      cascadeSteps: [],
      bonusMoves: 0
    };

    // Phase 1: INPUT - Apply swap to board
    gameState.board.swap(move.x1, move.y1, move.x2, move.y2);

    // Phase 2: PUZZLE_RESOLVE LOOP - Keep resolving until no matches
    let hasMatches = true;
    while (hasMatches) {
      // Find matches
      const matches = this.matcher.findMatches(gameState.board);

      if (matches.length === 0) {
        hasMatches = false;
        break;
      }

      result.cascadeCount++;
      result.matches.push(...matches);

      // Get positions to clear
      const positionsToClean = this.matcher.getMatchedPositions(matches);
      result.orbsCleared.push(...positionsToClean);

      // Capture orb types before clearing (for animation)
      const clearedOrbs = positionsToClean.map(pos => ({
        position: pos,
        type: gameState.board.getOrb(pos.x, pos.y) as OrbType
      }));

      // Check for 4+ orb matches - grant bonus move
      for (const match of matches) {
        if (match.orbs.length >= BONUS_MOVE_THRESHOLD) {
          result.bonusMoves++;
        }
      }

      // Clear matched orbs
      gameState.board.clearOrbs(positionsToClean);

      // Apply gravity and refill
      const gravityResult = this.gravity.apply(gameState.board);
      result.gravityResults.push(gravityResult);

      // Create cascade step for animation
      const cascadeStep: CascadeStep = {
        stepNumber: result.cascadeCount,
        matches: matches,
        clearedPositions: positionsToClean,
        clearedOrbs: clearedOrbs,
        gravityMovements: gravityResult.movements,
        newOrbs: gravityResult.newOrbs
      };
      result.cascadeSteps.push(cascadeStep);
    }

    // Phase 3: CHARGE - Accumulate charge from match count
    const matchCount = result.matches.length;
    result.chargeGained = matchCount;

    const currentPlayer = gameState.players.get(gameState.currentTurn)!;
    currentPlayer.charge = Math.min(
      currentPlayer.charge + result.chargeGained,
      CHARGE_MAX
    );

    // Phase 4: DAMAGE - Calculate and apply damage
    if (result.matches.length > 0) {
      const opponent = gameState.getOpponent(gameState.currentTurn);
      const opponentState = gameState.players.get(opponent)!;

      const damageResult = this.damageCalculator.calculateFromMatches(
        result.matches,
        currentPlayer.element,
        opponentState.element,
        currentPlayer.attack,
        1.0 // skill modifier - to be implemented
      );

      result.totalDamage = damageResult.totalDamage;
      result.healAmount = damageResult.healAmount;

      // Apply damage to opponent
      opponentState.hp = Math.max(0, opponentState.hp - result.totalDamage);

      // Apply heal to current player
      if (result.healAmount > 0) {
        currentPlayer.hp = Math.min(
          currentPlayer.hp + result.healAmount,
          currentPlayer.maxHp
        );
      }
    }

    // Store result for broadcasting
    gameState.lastResolveResult = result;

    // Phase 5: CHECK_END - Check win condition
    gameState.checkGameEnd();

    return result;
  }
}

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

    // Phase 3: CHARGE - Only accumulate charge from matches of player's element
    // Charge = total number of orbs matched (not number of matches)
    const currentPlayer = gameState.players.get(gameState.currentTurn)!;
    const playerElement = currentPlayer.element;
    
    // Count total orbs from matches that match the player's element
    let elementOrbsMatched = 0;
    for (const match of result.matches) {
      if (match.type === playerElement) {
        // Add the number of orbs in this match (3 orbs = +3, 4 orbs = +4, etc.)
        elementOrbsMatched += match.orbs.length;
      }
    }
    
    result.chargeGained = elementOrbsMatched;
    currentPlayer.charge = Math.min(
      currentPlayer.charge + result.chargeGained,
      CHARGE_MAX
    );

    // Phase 4: DAMAGE - Only deal damage if charge is full (attack triggered)
    // Calculate potential damage for display purposes
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

      // Only apply damage if charge is full (attack!)
      if (currentPlayer.charge >= CHARGE_MAX) {
        result.totalDamage = damageResult.totalDamage;
        
        // Apply damage to opponent
        opponentState.hp = Math.max(0, opponentState.hp - result.totalDamage);
        
        // Reset charge after attack
        currentPlayer.charge = 0;
        
        // Flag that attack was executed
        (result as any).attackExecuted = true;
      } else {
        // Store potential damage but don't apply it
        (result as any).pendingDamage = damageResult.totalDamage;
        result.totalDamage = 0;
        (result as any).attackExecuted = false;
      }

      // Heal is always applied (not gated by charge)
      result.healAmount = damageResult.healAmount;
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

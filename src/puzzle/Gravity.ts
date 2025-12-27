import { Board, OrbType, Position } from './Board';

export interface GravityResult {
  movements: Array<{
    from: Position;
    to: Position;
  }>;
  newOrbs: Array<{
    position: Position;
    type: OrbType;
  }>;
}

export class Gravity {
  apply(board: Board): GravityResult {
    const result: GravityResult = {
      movements: [],
      newOrbs: []
    };

    // Apply gravity column by column
    for (let x = 0; x < board.width; x++) {
      const columnResult = this.applyColumnGravity(board, x);
      result.movements.push(...columnResult.movements);
      result.newOrbs.push(...columnResult.newOrbs);
    }

    return result;
  }

  private applyColumnGravity(board: Board, column: number): GravityResult {
    const result: GravityResult = {
      movements: [],
      newOrbs: []
    };

    // Collect non-null orbs from bottom to top
    const orbs: { orb: OrbType; originalY: number }[] = [];
    for (let y = board.height - 1; y >= 0; y--) {
      const orb = board.getOrb(column, y);
      if (orb !== null) {
        orbs.push({ orb, originalY: y });
      }
    }

    // Calculate how many empty spaces we need to fill
    const emptyCount = board.height - orbs.length;

    // Place existing orbs from bottom, tracking movements
    let targetY = board.height - 1;
    for (const { orb, originalY } of orbs) {
      board.setOrb(column, targetY, orb);

      if (originalY !== targetY) {
        result.movements.push({
          from: { x: column, y: originalY },
          to: { x: column, y: targetY }
        });
      }

      targetY--;
    }

    // Fill empty spaces at top with new orbs using board's seeded RNG
    for (let y = emptyCount - 1; y >= 0; y--) {
      const newOrb = board.generateRandomOrb();
      board.setOrb(column, y, newOrb);
      result.newOrbs.push({
        position: { x: column, y },
        type: newOrb
      });
    }

    return result;
  }
}

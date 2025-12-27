import { Board, OrbType, Position } from './Board';
import { MATCH_MIN_LENGTH } from '../shared/constants';

export interface Match {
  orbs: Position[];
  type: OrbType;
  count: number;
}

export class Matcher {
  findMatches(board: Board): Match[] {
    // Find horizontal matches
    const horizontalMatches = this.findHorizontalMatches(board);

    // Find vertical matches
    const verticalMatches = this.findVerticalMatches(board);

    // Combine and merge overlapping matches (for L, T, + shapes)
    const combined = [...horizontalMatches, ...verticalMatches];
    return this.mergeOverlappingMatches(combined);
  }

  private findHorizontalMatches(board: Board): Match[] {
    const matches: Match[] = [];

    for (let y = 0; y < board.height; y++) {
      let currentType: OrbType | null = null;
      let currentMatch: Position[] = [];

      for (let x = 0; x < board.width; x++) {
        const orb = board.getOrb(x, y);

        if (orb !== null && orb === currentType) {
          currentMatch.push({ x, y });
        } else {
          if (currentMatch.length >= MATCH_MIN_LENGTH && currentType !== null) {
            matches.push({
              orbs: [...currentMatch],
              type: currentType,
              count: currentMatch.length
            });
          }
          currentType = orb;
          currentMatch = orb ? [{ x, y }] : [];
        }
      }

      // Check last match in row
      if (currentMatch.length >= MATCH_MIN_LENGTH && currentType !== null) {
        matches.push({
          orbs: [...currentMatch],
          type: currentType,
          count: currentMatch.length
        });
      }
    }

    return matches;
  }

  private findVerticalMatches(board: Board): Match[] {
    const matches: Match[] = [];

    for (let x = 0; x < board.width; x++) {
      let currentType: OrbType | null = null;
      let currentMatch: Position[] = [];

      for (let y = 0; y < board.height; y++) {
        const orb = board.getOrb(x, y);

        if (orb !== null && orb === currentType) {
          currentMatch.push({ x, y });
        } else {
          if (currentMatch.length >= MATCH_MIN_LENGTH && currentType !== null) {
            matches.push({
              orbs: [...currentMatch],
              type: currentType,
              count: currentMatch.length
            });
          }
          currentType = orb;
          currentMatch = orb ? [{ x, y }] : [];
        }
      }

      // Check last match in column
      if (currentMatch.length >= MATCH_MIN_LENGTH && currentType !== null) {
        matches.push({
          orbs: [...currentMatch],
          type: currentType,
          count: currentMatch.length
        });
      }
    }

    return matches;
  }

  private mergeOverlappingMatches(matches: Match[]): Match[] {
    if (matches.length === 0) return [];

    // Group matches by orb type
    const byType = new Map<OrbType, Match[]>();
    for (const match of matches) {
      if (!byType.has(match.type)) {
        byType.set(match.type, []);
      }
      byType.get(match.type)!.push(match);
    }

    const mergedMatches: Match[] = [];

    // Merge overlapping matches of the same type
    for (const [type, typeMatches] of byType) {
      const positionSets: Set<string>[] = typeMatches.map(m =>
        new Set(m.orbs.map(p => `${p.x},${p.y}`))
      );

      const merged = this.unionOverlapping(positionSets);

      for (const positions of merged) {
        const orbs = Array.from(positions).map(s => {
          const [x, y] = s.split(',').map(Number);
          return { x, y };
        });

        mergedMatches.push({
          orbs,
          type,
          count: orbs.length
        });
      }
    }

    return mergedMatches;
  }

  private unionOverlapping(sets: Set<string>[]): Set<string>[] {
    const result: Set<string>[] = [];
    const used = new Array(sets.length).fill(false);

    for (let i = 0; i < sets.length; i++) {
      if (used[i]) continue;

      const merged = new Set(sets[i]);
      used[i] = true;

      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < sets.length; j++) {
          if (used[j]) continue;

          let overlaps = false;
          for (const pos of sets[j]) {
            if (merged.has(pos)) {
              overlaps = true;
              break;
            }
          }

          if (overlaps) {
            for (const pos of sets[j]) {
              merged.add(pos);
            }
            used[j] = true;
            changed = true;
          }
        }
      }

      result.push(merged);
    }

    return result;
  }

  // Get all unique positions from matches (for clearing)
  getMatchedPositions(matches: Match[]): Position[] {
    const posSet = new Set<string>();
    const positions: Position[] = [];

    for (const match of matches) {
      for (const pos of match.orbs) {
        const key = `${pos.x},${pos.y}`;
        if (!posSet.has(key)) {
          posSet.add(key);
          positions.push(pos);
        }
      }
    }

    return positions;
  }
}

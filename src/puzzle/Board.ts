import { SeededRandom } from '../shared/rng';
import { BOARD_WIDTH, BOARD_HEIGHT, ORB_TYPES } from '../shared/constants';

export type OrbType = 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK' | 'HEAL';

export interface Position {
  x: number;
  y: number;
}

export class Board {
  public width: number;
  public height: number;
  public grid: (OrbType | null)[][];
  public rng: SeededRandom;

  constructor(seed: number, width: number = BOARD_WIDTH, height: number = BOARD_HEIGHT) {
    this.width = width;
    this.height = height;
    this.rng = new SeededRandom(seed);
    this.grid = this.initializeGrid();

    // Remove initial matches to start clean
    this.removeInitialMatches();
  }

  private initializeGrid(): (OrbType | null)[][] {
    const grid: (OrbType | null)[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = this.generateRandomOrb();
      }
    }
    return grid;
  }

  private removeInitialMatches() {
    // Regenerate orbs that would create matches
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let attempts = 0;
        while (this.wouldCreateMatch(x, y) && attempts < 10) {
          this.grid[y][x] = this.generateRandomOrb();
          attempts++;
        }
      }
    }
  }

  private wouldCreateMatch(x: number, y: number): boolean {
    const orb = this.grid[y][x];
    if (!orb) return false;

    // Check horizontal (left 2)
    if (x >= 2) {
      if (this.grid[y][x - 1] === orb && this.grid[y][x - 2] === orb) {
        return true;
      }
    }

    // Check vertical (up 2)
    if (y >= 2) {
      if (this.grid[y - 1][x] === orb && this.grid[y - 2][x] === orb) {
        return true;
      }
    }

    return false;
  }

  generateRandomOrb(): OrbType {
    const index = this.rng.nextInt(0, ORB_TYPES.length - 1);
    return ORB_TYPES[index];
  }

  swap(x1: number, y1: number, x2: number, y2: number): boolean {
    if (!this.isValidPosition(x1, y1) || !this.isValidPosition(x2, y2)) {
      return false;
    }

    const temp = this.grid[y1][x1];
    this.grid[y1][x1] = this.grid[y2][x2];
    this.grid[y2][x2] = temp;
    return true;
  }

  isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getOrb(x: number, y: number): OrbType | null {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    return this.grid[y][x];
  }

  setOrb(x: number, y: number, orb: OrbType | null) {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = orb;
    }
  }

  clearOrbs(positions: Position[]) {
    for (const pos of positions) {
      this.setOrb(pos.x, pos.y, null);
    }
  }

  serialize() {
    return {
      width: this.width,
      height: this.height,
      grid: this.grid
    };
  }
}

import { Board, OrbType, Position } from '../puzzle/Board';
import { Gravity } from '../puzzle/Gravity';
import { Matcher } from '../puzzle/Matcher';

describe('Board', () => {
  describe('Matrix Consistency', () => {
    it('should create grid with correct dimensions [height][width]', () => {
      const board = new Board(12345, 7, 5);
      
      // Grid should have 5 rows (height)
      expect(board.grid.length).toBe(5);
      
      // Each row should have 7 columns (width)
      for (let y = 0; y < 5; y++) {
        expect(board.grid[y].length).toBe(7);
      }
    });

    it('should access orbs as grid[y][x]', () => {
      const board = new Board(12345, 7, 5);
      
      // Set a specific orb
      board.grid[2][3] = 'FIRE'; // row 2, column 3
      
      // getOrb should use (x, y) -> grid[y][x]
      expect(board.getOrb(3, 2)).toBe('FIRE');
    });

    it('should have consistent getOrb and setOrb', () => {
      const board = new Board(12345, 7, 5);
      
      board.setOrb(4, 3, 'WATER'); // x=4, y=3
      expect(board.getOrb(4, 3)).toBe('WATER');
      expect(board.grid[3][4]).toBe('WATER'); // Should be grid[y][x]
    });

    it('should have all valid orbs after initialization', () => {
      const board = new Board(12345, 7, 5);
      const validOrbs: (OrbType | null)[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL'];
      
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
          const orb = board.getOrb(x, y);
          expect(validOrbs).toContain(orb);
        }
      }
    });
  });

  describe('Swap Operation', () => {
    it('should swap two adjacent orbs correctly (horizontal)', () => {
      const board = new Board(12345, 7, 5);
      
      // Set known values
      board.setOrb(2, 1, 'FIRE');
      board.setOrb(3, 1, 'WATER');
      
      // Swap x=2,y=1 with x=3,y=1 (horizontal)
      const result = board.swap(2, 1, 3, 1);
      
      expect(result).toBe(true);
      expect(board.getOrb(2, 1)).toBe('WATER');
      expect(board.getOrb(3, 1)).toBe('FIRE');
    });

    it('should swap two adjacent orbs correctly (vertical)', () => {
      const board = new Board(12345, 7, 5);
      
      // Set known values
      board.setOrb(2, 1, 'GRASS');
      board.setOrb(2, 2, 'LIGHT');
      
      // Swap x=2,y=1 with x=2,y=2 (vertical)
      const result = board.swap(2, 1, 2, 2);
      
      expect(result).toBe(true);
      expect(board.getOrb(2, 1)).toBe('LIGHT');
      expect(board.getOrb(2, 2)).toBe('GRASS');
    });

    it('should not change other orbs during swap', () => {
      const board = new Board(12345, 7, 5);
      
      // Store original state
      const originalGrid: (OrbType | null)[][] = [];
      for (let y = 0; y < board.height; y++) {
        originalGrid[y] = [...board.grid[y]];
      }
      
      // Swap two orbs
      board.swap(0, 0, 1, 0);
      
      // Check only swapped positions changed
      for (let y = 0; y < board.height; y++) {
        for (let x = 0; x < board.width; x++) {
          if ((x === 0 && y === 0) || (x === 1 && y === 0)) {
            continue; // Skip swapped positions
          }
          expect(board.grid[y][x]).toBe(originalGrid[y][x]);
        }
      }
      
      // Check swap actually occurred
      expect(board.grid[0][0]).toBe(originalGrid[0][1]);
      expect(board.grid[0][1]).toBe(originalGrid[0][0]);
    });

    it('should reject swap for invalid positions', () => {
      const board = new Board(12345, 7, 5);
      
      expect(board.swap(-1, 0, 0, 0)).toBe(false);
      expect(board.swap(0, 0, 7, 0)).toBe(false);
      expect(board.swap(0, 5, 0, 0)).toBe(false);
    });

    it('should maintain grid dimensions after swap', () => {
      const board = new Board(12345, 7, 5);
      
      board.swap(3, 2, 4, 2);
      
      expect(board.grid.length).toBe(5);
      for (let y = 0; y < 5; y++) {
        expect(board.grid[y].length).toBe(7);
      }
    });
  });

  describe('isAdjacent', () => {
    it('should return true for horizontally adjacent positions', () => {
      const board = new Board(12345, 7, 5);
      expect(board.isAdjacent(2, 2, 3, 2)).toBe(true);
      expect(board.isAdjacent(3, 2, 2, 2)).toBe(true);
    });

    it('should return true for vertically adjacent positions', () => {
      const board = new Board(12345, 7, 5);
      expect(board.isAdjacent(2, 2, 2, 3)).toBe(true);
      expect(board.isAdjacent(2, 3, 2, 2)).toBe(true);
    });

    it('should return false for diagonal positions', () => {
      const board = new Board(12345, 7, 5);
      expect(board.isAdjacent(2, 2, 3, 3)).toBe(false);
      expect(board.isAdjacent(2, 2, 1, 1)).toBe(false);
    });

    it('should return false for non-adjacent positions', () => {
      const board = new Board(12345, 7, 5);
      expect(board.isAdjacent(0, 0, 2, 0)).toBe(false);
      expect(board.isAdjacent(0, 0, 0, 2)).toBe(false);
    });

    it('should return false for same position', () => {
      const board = new Board(12345, 7, 5);
      expect(board.isAdjacent(2, 2, 2, 2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize grid correctly for frontend', () => {
      const board = new Board(12345, 7, 5);
      
      // Set some known values
      board.setOrb(0, 0, 'FIRE');   // top-left
      board.setOrb(6, 0, 'WATER');  // top-right
      board.setOrb(0, 4, 'GRASS');  // bottom-left
      board.setOrb(6, 4, 'LIGHT');  // bottom-right
      
      const serialized = board.serialize();
      
      expect(serialized.width).toBe(7);
      expect(serialized.height).toBe(5);
      expect(serialized.grid.length).toBe(5); // rows
      expect(serialized.grid[0].length).toBe(7); // columns
      
      // Verify positions in serialized data
      // Frontend iterates: for y (rows) -> for x (cols)
      // grid[0] is first row (y=0)
      // grid[0][0] is first column of first row (x=0, y=0)
      expect(serialized.grid[0][0]).toBe('FIRE');   // y=0, x=0
      expect(serialized.grid[0][6]).toBe('WATER');  // y=0, x=6
      expect(serialized.grid[4][0]).toBe('GRASS');  // y=4, x=0
      expect(serialized.grid[4][6]).toBe('LIGHT');  // y=4, x=6
    });
  });
});

describe('Gravity', () => {
  it('should drop orbs down to fill empty spaces', () => {
    const board = new Board(12345, 3, 3);
    const gravity = new Gravity();
    
    // Create a column with a gap:
    // Before:  FIRE (y=0), null (y=1), WATER (y=2)
    // After:   NEW  (y=0), FIRE (y=1), WATER (y=2)
    board.setOrb(0, 0, 'FIRE');
    board.setOrb(0, 1, null);
    board.setOrb(0, 2, 'WATER');
    
    const result = gravity.apply(board);
    
    // WATER at bottom should stay
    expect(board.getOrb(0, 2)).toBe('WATER');
    // FIRE should drop to y=1
    expect(board.getOrb(0, 1)).toBe('FIRE');
    // New orb should appear at y=0
    expect(board.getOrb(0, 0)).not.toBeNull();
    
    // Should have 1 movement
    expect(result.movements.length).toBe(1);
    expect(result.movements[0]).toEqual({
      from: { x: 0, y: 0 },
      to: { x: 0, y: 1 }
    });
    
    // Should have 1 new orb
    expect(result.newOrbs.length).toBe(1);
    expect(result.newOrbs[0].position).toEqual({ x: 0, y: 0 });
  });

  it('should handle multiple gaps in same column', () => {
    const board = new Board(12345, 3, 5);
    const gravity = new Gravity();
    
    // Column 1: FIRE, null, null, null, WATER
    board.setOrb(1, 0, 'FIRE');
    board.setOrb(1, 1, null);
    board.setOrb(1, 2, null);
    board.setOrb(1, 3, null);
    board.setOrb(1, 4, 'WATER');
    
    gravity.apply(board);
    
    // WATER should stay at bottom
    expect(board.getOrb(1, 4)).toBe('WATER');
    // FIRE should drop to y=3
    expect(board.getOrb(1, 3)).toBe('FIRE');
    // 3 new orbs should fill y=0,1,2
    expect(board.getOrb(1, 0)).not.toBeNull();
    expect(board.getOrb(1, 1)).not.toBeNull();
    expect(board.getOrb(1, 2)).not.toBeNull();
  });

  it('should not affect columns without gaps', () => {
    const board = new Board(12345, 3, 3);
    const gravity = new Gravity();
    
    // Store original column 0
    const col0 = [board.getOrb(0, 0), board.getOrb(0, 1), board.getOrb(0, 2)];
    
    // Create gap in column 1 only
    board.setOrb(1, 1, null);
    
    gravity.apply(board);
    
    // Column 0 should be unchanged
    expect(board.getOrb(0, 0)).toBe(col0[0]);
    expect(board.getOrb(0, 1)).toBe(col0[1]);
    expect(board.getOrb(0, 2)).toBe(col0[2]);
  });
});

describe('Matcher', () => {
  it('should find horizontal matches of 3+', () => {
    const board = new Board(12345, 5, 3);
    const matcher = new Matcher();
    
    // Create horizontal match: FIRE FIRE FIRE at row 1
    board.setOrb(0, 1, 'FIRE');
    board.setOrb(1, 1, 'FIRE');
    board.setOrb(2, 1, 'FIRE');
    
    // Make sure other positions don't create matches
    board.setOrb(3, 1, 'WATER');
    board.setOrb(4, 1, 'GRASS');
    
    const matches = matcher.findMatches(board);
    
    expect(matches.length).toBeGreaterThanOrEqual(1);
    
    const fireMatch = matches.find(m => m.type === 'FIRE');
    expect(fireMatch).toBeDefined();
    expect(fireMatch!.count).toBeGreaterThanOrEqual(3);
  });

  it('should find vertical matches of 3+', () => {
    const board = new Board(12345, 3, 5);
    const matcher = new Matcher();
    
    // Create vertical match: WATER at column 1
    board.setOrb(1, 0, 'WATER');
    board.setOrb(1, 1, 'WATER');
    board.setOrb(1, 2, 'WATER');
    
    // Make sure other positions don't create matches
    board.setOrb(1, 3, 'FIRE');
    board.setOrb(1, 4, 'GRASS');
    
    const matches = matcher.findMatches(board);
    
    expect(matches.length).toBeGreaterThanOrEqual(1);
    
    const waterMatch = matches.find(m => m.type === 'WATER');
    expect(waterMatch).toBeDefined();
    expect(waterMatch!.count).toBeGreaterThanOrEqual(3);
  });

  it('should correctly identify positions in matches', () => {
    const board = new Board(12345, 5, 3);
    const matcher = new Matcher();
    
    // Clear board with distinct orbs
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 5; x++) {
        board.setOrb(x, y, x % 2 === 0 ? 'FIRE' : 'WATER');
      }
    }
    
    // Create a specific horizontal match at row 0
    board.setOrb(0, 0, 'GRASS');
    board.setOrb(1, 0, 'GRASS');
    board.setOrb(2, 0, 'GRASS');
    
    const matches = matcher.findMatches(board);
    const grassMatch = matches.find(m => m.type === 'GRASS');
    
    expect(grassMatch).toBeDefined();
    
    // Verify positions are in the match
    const posStrings = grassMatch!.orbs.map(p => `${p.x},${p.y}`);
    expect(posStrings).toContain('0,0');
    expect(posStrings).toContain('1,0');
    expect(posStrings).toContain('2,0');
  });
});

describe('Full Swap Integration', () => {
  it('should maintain board integrity after swap + match + gravity cycle', () => {
    const board = new Board(99999, 7, 5);
    const matcher = new Matcher();
    const gravity = new Gravity();
    
    // Store dimensions
    const originalWidth = board.width;
    const originalHeight = board.height;
    
    // Perform a swap
    board.swap(0, 0, 1, 0);
    
    // Find and clear matches
    const matches = matcher.findMatches(board);
    if (matches.length > 0) {
      const positions = matcher.getMatchedPositions(matches);
      board.clearOrbs(positions);
      gravity.apply(board);
    }
    
    // Verify board integrity
    expect(board.width).toBe(originalWidth);
    expect(board.height).toBe(originalHeight);
    expect(board.grid.length).toBe(originalHeight);
    
    for (let y = 0; y < board.height; y++) {
      expect(board.grid[y].length).toBe(originalWidth);
      for (let x = 0; x < board.width; x++) {
        // Every position should have a valid orb (not null after gravity)
        expect(board.getOrb(x, y)).not.toBeNull();
      }
    }
  });
});

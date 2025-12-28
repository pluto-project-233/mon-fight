// BoardModel - Logical board state (mirror of BE)
// CRITICAL: Only updated AFTER animations complete
// This is the SINGLE SOURCE OF TRUTH for FE board state

class BoardModel {
  constructor() {
    this.grid = null;      // 2D array of orb types
    this.width = 7;
    this.height = 5;
    this.revision = 0;     // Board revision for sync check
  }

  // Initialize from server board state
  initFromServer(boardData) {
    this.grid = JSON.parse(JSON.stringify(boardData.grid)); // Deep copy
    this.width = boardData.width || 7;
    this.height = boardData.height || 5;
    console.log('[BoardModel] Initialized from server, revision:', this.revision);
  }

  // Get orb at position
  getOrb(x, y) {
    if (!this.grid || y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return null;
    }
    return this.grid[y][x];
  }

  // Set orb at position (used after animation completes)
  setOrb(x, y, orbType) {
    if (this.grid && y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.grid[y][x] = orbType;
    }
  }

  // Apply swap (after SWAP_ACCEPTED animation)
  applySwap(x1, y1, x2, y2) {
    if (!this.grid) return;
    const temp = this.grid[y1][x1];
    this.grid[y1][x1] = this.grid[y2][x2];
    this.grid[y2][x2] = temp;
    this.revision++;
    console.log('[BoardModel] Swap applied, revision:', this.revision);
  }

  // Clear orbs at positions (after ORB_CLEARED animation)
  clearOrbs(positions) {
    if (!this.grid) return;
    positions.forEach(pos => {
      this.grid[pos.y][pos.x] = null;
    });
    this.revision++;
    console.log('[BoardModel] Cleared', positions.length, 'orbs, revision:', this.revision);
  }

  // Apply gravity movements (after GRAVITY_APPLIED animation)
  applyGravity(movements) {
    if (!this.grid || !movements || movements.length === 0) return;
    
    // Process movements: move orbs from 'from' to 'to'
    // IMPORTANT: Process in correct order (bottom to top per column)
    movements.forEach(movement => {
      const orbType = this.grid[movement.from.y][movement.from.x];
      this.grid[movement.to.y][movement.to.x] = orbType;
      this.grid[movement.from.y][movement.from.x] = null;
    });
    
    this.revision++;
    console.log('[BoardModel] Gravity applied, revision:', this.revision);
  }

  // Spawn new orbs (after ORB_SPAWNED animation)
  spawnOrbs(newOrbs) {
    if (!this.grid || !newOrbs || newOrbs.length === 0) return;
    
    newOrbs.forEach(orb => {
      this.grid[orb.position.y][orb.position.x] = orb.type;
    });
    
    this.revision++;
    console.log('[BoardModel] Spawned', newOrbs.length, 'orbs, revision:', this.revision);
  }

  // Force sync with server state (recovery)
  forceSync(boardData, serverRevision) {
    this.grid = JSON.parse(JSON.stringify(boardData.grid));
    if (serverRevision !== undefined) {
      this.revision = serverRevision;
    }
    console.log('[BoardModel] Force synced to revision:', this.revision);
  }

  // Check if revision matches
  checkRevision(expectedRevision) {
    if (expectedRevision !== undefined && this.revision !== expectedRevision) {
      console.warn('[BoardModel] Revision mismatch! Expected:', expectedRevision, 'Got:', this.revision);
      return false;
    }
    return true;
  }

  // Get a copy of current grid for rendering
  getGridCopy() {
    if (!this.grid) return null;
    return JSON.parse(JSON.stringify(this.grid));
  }
}

window.BoardModel = BoardModel;

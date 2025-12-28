// BoardAnimator - Visual board rendering and animations
// CRITICAL: This ONLY handles visual/DOM - BoardModel handles logical state
// Animations are purely cosmetic - state is updated AFTER animation completes

class BoardAnimator {
  constructor() {
    // Animation durations (ms)
    this.ANIM_SWAP = 200;
    this.ANIM_MATCH_HIGHLIGHT = 350;
    this.ANIM_CLEAR = 250;
    this.ANIM_GRAVITY = 300;
    this.ANIM_SPAWN = 250;
    
    this.onOrbClick = null; // Click handler
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getOrbEmoji(orbType) {
    const emojis = {
      FIRE: '🔥',
      WATER: '💧',
      GRASS: '🌿',
      LIGHT: '✨',
      DARK: '🌙',
      HEAL: '💖'
    };
    return emojis[orbType] || '';
  }

  // Render board from BoardModel
  renderFromModel(boardModel, onClick) {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    this.onOrbClick = onClick;

    const grid = boardModel.grid;
    if (!grid) return;

    for (let y = 0; y < boardModel.height; y++) {
      for (let x = 0; x < boardModel.width; x++) {
        const orbType = grid[y][x];
        const orb = document.createElement('div');
        orb.className = `orb ${orbType || 'empty'}`;
        orb.dataset.x = x;
        orb.dataset.y = y;
        orb.textContent = orbType ? this.getOrbEmoji(orbType) : '';

        if (onClick) {
          orb.addEventListener('click', () => onClick(x, y));
        }

        boardElement.appendChild(orb);
      }
    }
    
    console.log('[BoardAnimator] Rendered from model');
  }

  // Get DOM orb element at position
  getOrbElement(x, y) {
    return document.querySelector(`.orb[data-x="${x}"][data-y="${y}"]`);
  }

  // ============================================
  // ANIMATION: Swap (visual only)
  // ============================================
  async animateSwap(x1, y1, x2, y2) {
    const orb1 = this.getOrbElement(x1, y1);
    const orb2 = this.getOrbElement(x2, y2);
    
    if (!orb1 || !orb2) return;

    // Add swap animation class
    orb1.classList.add('swapping');
    orb2.classList.add('swapping');

    // Swap visual content
    const tempClass = orb1.className;
    const tempText = orb1.textContent;
    
    orb1.className = orb2.className;
    orb1.textContent = orb2.textContent;
    orb1.dataset.x = x1;
    orb1.dataset.y = y1;
    
    orb2.className = tempClass;
    orb2.textContent = tempText;
    orb2.dataset.x = x2;
    orb2.dataset.y = y2;

    await this.sleep(this.ANIM_SWAP);

    // Remove animation class
    orb1.classList.remove('swapping');
    orb2.classList.remove('swapping');
    
    console.log('[BoardAnimator] Swap animated');
  }

  // ============================================
  // ANIMATION: Highlight matched orbs
  // ============================================
  async animateMatchHighlight(positions, soundCallback) {
    if (!positions || positions.length === 0) return;

    // Add highlight to matched positions
    positions.forEach(pos => {
      const orb = this.getOrbElement(pos.x, pos.y);
      if (orb) {
        orb.classList.add('matched');
      }
    });

    if (soundCallback) soundCallback('match');
    await this.sleep(this.ANIM_MATCH_HIGHLIGHT);
    
    console.log('[BoardAnimator] Match highlight animated for', positions.length, 'orbs');
  }

  // ============================================
  // ANIMATION: Clear/destroy orbs
  // ============================================
  async animateClear(positions) {
    if (!positions || positions.length === 0) return;

    // Add clearing animation
    positions.forEach(pos => {
      const orb = this.getOrbElement(pos.x, pos.y);
      if (orb) {
        orb.classList.remove('matched');
        orb.classList.add('clearing');
      }
    });

    await this.sleep(this.ANIM_CLEAR);

    // Set to empty state (visual only)
    positions.forEach(pos => {
      const orb = this.getOrbElement(pos.x, pos.y);
      if (orb) {
        orb.classList.remove('clearing');
        orb.classList.add('empty');
        orb.classList.remove('FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL');
        orb.textContent = '';
      }
    });
    
    console.log('[BoardAnimator] Clear animated for', positions.length, 'orbs');
  }

  // ============================================
  // ANIMATION: Gravity drop
  // ============================================
  async animateGravity(movements) {
    if (!movements || movements.length === 0) return;

    // For each movement, animate the orb dropping
    movements.forEach(movement => {
      const fromOrb = this.getOrbElement(movement.from.x, movement.from.y);
      const toOrb = this.getOrbElement(movement.to.x, movement.to.y);
      
      if (fromOrb && toOrb) {
        // Get orb type from 'from' position
        const orbType = Array.from(fromOrb.classList).find(c => 
          ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL'].includes(c)
        );
        const emoji = fromOrb.textContent;
        
        // Clear source position immediately
        fromOrb.classList.remove('FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL');
        fromOrb.classList.add('empty');
        fromOrb.textContent = '';
        
        // Set destination with dropping animation
        toOrb.classList.remove('empty');
        if (orbType) toOrb.classList.add(orbType);
        toOrb.classList.add('dropping');
        toOrb.textContent = emoji;
      }
    });

    await this.sleep(this.ANIM_GRAVITY);

    // Remove animation class
    document.querySelectorAll('.orb.dropping').forEach(orb => {
      orb.classList.remove('dropping');
    });
    
    console.log('[BoardAnimator] Gravity animated for', movements.length, 'movements');
  }

  // ============================================
  // ANIMATION: Spawn new orbs from top
  // ============================================
  async animateSpawn(newOrbs) {
    if (!newOrbs || newOrbs.length === 0) return;

    // Add new orbs with spawn animation
    newOrbs.forEach(orbData => {
      const orb = this.getOrbElement(orbData.position.x, orbData.position.y);
      if (orb) {
        orb.classList.remove('empty');
        orb.classList.add(orbData.type);
        orb.classList.add('spawning');
        orb.textContent = this.getOrbEmoji(orbData.type);
      }
    });

    await this.sleep(this.ANIM_SPAWN);

    // Remove animation class
    document.querySelectorAll('.orb.spawning').forEach(orb => {
      orb.classList.remove('spawning');
    });
    
    console.log('[BoardAnimator] Spawn animated for', newOrbs.length, 'orbs');
  }

  // ============================================
  // UI Helpers
  // ============================================
  highlightOrb(x, y, selected) {
    const orb = this.getOrbElement(x, y);
    if (orb) {
      orb.classList.toggle('selected', selected);
    }
  }

  shakeOrb(x, y) {
    const orb = this.getOrbElement(x, y);
    if (orb) {
      orb.style.animation = 'none';
      orb.offsetHeight; // Trigger reflow
      orb.style.animation = 'shake 0.3s ease';
    }
  }

  clearSelection() {
    document.querySelectorAll('.orb.selected').forEach(orb => {
      orb.classList.remove('selected');
    });
  }

  setOrbsInteractive(interactive) {
    document.querySelectorAll('.orb').forEach(orb => {
      orb.classList.toggle('disabled', !interactive);
    });
  }
}

window.BoardAnimator = BoardAnimator;

// Monster Puzzle Fight - Game Client (Refactored)
// Organized into classes for better maintainability

// ============================================================================
// SpriteAnimator - Handles character sprite animations
// ============================================================================
class SpriteAnimator {
  constructor() {
    this.animationState = {
      PLAYER_1: { current: 0, interval: null },
      PLAYER_2: { current: 0, interval: null }
    };
  }

  getSpriteBasePath(monsterName) {
    if (monsterName === 'Assassin') {
      return '/asset/Assassin/PNG/PNG Sequences';
    } else if (monsterName === 'Thug') {
      return '/asset/Thug/PNG/PNG Sequences';
    }
    return null;
  }

  getSpriteElement(playerNum) {
    const prefix = playerNum === 'PLAYER_1' ? 'p1' : 'p2';
    return document.getElementById(`${prefix}-sprite`);
  }

  stopAnimation(playerNum) {
    if (this.animationState[playerNum].interval) {
      clearInterval(this.animationState[playerNum].interval);
      this.animationState[playerNum].interval = null;
    }
  }

  startIdleAnimation(playerNum, monsterName) {
    const sprite = this.getSpriteElement(playerNum);
    const basePath = this.getSpriteBasePath(monsterName);
    
    if (!basePath || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const idlePath = `${basePath}/Front - Idle`;
    const frameCount = 16;
    let frame = 0;
    
    sprite.src = `${idlePath}/Front - Idle_${frame.toString().padStart(3, '0')}.png`;
    
    this.animationState[playerNum].interval = setInterval(() => {
      frame = (frame + 1) % frameCount;
      sprite.src = `${idlePath}/Front - Idle_${frame.toString().padStart(3, '0')}.png`;
    }, 100);
  }

  playAttackAnimation(playerNum, monsterName) {
    const sprite = this.getSpriteElement(playerNum);
    const basePath = this.getSpriteBasePath(monsterName);
    
    if (!basePath || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const attackPath = `${basePath}/Front - Attacking`;
    const frameCount = 10;
    let frame = 0;
    
    sprite.classList.add('attacking');
    sprite.src = `${attackPath}/Front - Attacking_${frame.toString().padStart(3, '0')}.png`;
    
    const attackInterval = setInterval(() => {
      frame++;
      if (frame >= frameCount) {
        clearInterval(attackInterval);
        sprite.classList.remove('attacking');
        this.startIdleAnimation(playerNum, monsterName);
      } else {
        sprite.src = `${attackPath}/Front - Attacking_${frame.toString().padStart(3, '0')}.png`;
      }
    }, 80);
  }

  playHurtAnimation(playerNum, monsterName) {
    const sprite = this.getSpriteElement(playerNum);
    const basePath = this.getSpriteBasePath(monsterName);
    
    if (!basePath || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const hurtPath = `${basePath}/Front - Hurt`;
    const frameCount = 10;
    let frame = 0;
    
    sprite.classList.add('hurt');
    sprite.src = `${hurtPath}/Front - Hurt_${frame.toString().padStart(3, '0')}.png`;
    
    const hurtInterval = setInterval(() => {
      frame++;
      if (frame >= frameCount) {
        clearInterval(hurtInterval);
        sprite.classList.remove('hurt');
        this.startIdleAnimation(playerNum, monsterName);
      } else {
        sprite.src = `${hurtPath}/Front - Hurt_${frame.toString().padStart(3, '0')}.png`;
      }
    }, 80);
  }
}

// ============================================================================
// BoardAnimator - Handles puzzle board rendering and animations
// ============================================================================
class BoardAnimator {
  constructor() {
    this.ANIM_MATCH_HIGHLIGHT = 400;
    this.ANIM_MATCH_CLEAR = 300;
    this.ANIM_GRAVITY_DROP = 250;
    this.ANIM_NEW_ORBS = 200;
    this.ANIM_CASCADE_DELAY = 150;
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

  renderBoard(boardData, onClick) {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    const grid = boardData.grid;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const orbType = grid[y][x];
        const orb = document.createElement('div');
        orb.className = `orb ${orbType || ''}`;
        orb.dataset.x = x;
        orb.dataset.y = y;
        orb.textContent = this.getOrbEmoji(orbType);

        if (onClick) {
          orb.addEventListener('click', () => onClick(x, y));
        }

        boardElement.appendChild(orb);
      }
    }
  }

  getOrbAt(x, y) {
    const orbs = document.querySelectorAll('.orb');
    for (const orb of orbs) {
      if (parseInt(orb.dataset.x) === x && parseInt(orb.dataset.y) === y) {
        return orb;
      }
    }
    return null;
  }

  async animateMatchHighlight(matches, soundCallback) {
    if (!matches || matches.length === 0) return;

    const positions = new Set();
    matches.forEach(match => {
      (match.orbs || match.positions || []).forEach(pos => {
        positions.add(`${pos.x},${pos.y}`);
      });
    });

    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      const key = `${orb.dataset.x},${orb.dataset.y}`;
      if (positions.has(key)) {
        orb.classList.add('matched');
      }
    });

    if (soundCallback) soundCallback('match');
    await this.sleep(this.ANIM_MATCH_HIGHLIGHT);
  }

  async animateClearOrbs(clearedPositions) {
    if (!clearedPositions || clearedPositions.length === 0) return;

    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      const x = parseInt(orb.dataset.x);
      const y = parseInt(orb.dataset.y);
      const isCleared = clearedPositions.some(pos => pos.x === x && pos.y === y);
      
      if (isCleared) {
        orb.classList.remove('matched');
        orb.classList.add('clearing');
      }
    });

    await this.sleep(this.ANIM_MATCH_CLEAR);

    orbs.forEach(orb => {
      if (orb.classList.contains('clearing')) {
        orb.classList.remove('clearing');
        orb.classList.add('empty');
        orb.textContent = '';
      }
    });

    await this.sleep(50);
  }

  async animateGravity(gravityMovements) {
    if (!gravityMovements || gravityMovements.length === 0) return;

    const orbs = document.querySelectorAll('.orb');
    const orbMap = new Map();
    
    orbs.forEach(orb => {
      const key = `${orb.dataset.x},${orb.dataset.y}`;
      orbMap.set(key, orb);
    });

    gravityMovements.forEach(movement => {
      const fromKey = `${movement.from.x},${movement.from.y}`;
      const toKey = `${movement.to.x},${movement.to.y}`;
      const fromOrb = orbMap.get(fromKey);
      const toOrb = orbMap.get(toKey);
      
      if (fromOrb && toOrb) {
        const orbType = fromOrb.className.split(' ').find(c => 
          ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL'].includes(c)
        );
        const emoji = fromOrb.textContent;
        
        fromOrb.className = 'orb empty';
        fromOrb.textContent = '';
        
        toOrb.className = `orb ${orbType || ''} dropping`;
        toOrb.textContent = emoji;
      }
    });

    await this.sleep(this.ANIM_GRAVITY_DROP);

    orbs.forEach(orb => {
      orb.classList.remove('dropping');
    });
  }

  async animateNewOrbs(newOrbs) {
    if (!newOrbs || newOrbs.length === 0) return;

    const orbs = document.querySelectorAll('.orb');
    const orbMap = new Map();
    
    orbs.forEach(orb => {
      const key = `${orb.dataset.x},${orb.dataset.y}`;
      orbMap.set(key, orb);
    });

    newOrbs.forEach(newOrb => {
      const key = `${newOrb.position.x},${newOrb.position.y}`;
      const orbElement = orbMap.get(key);
      
      if (orbElement) {
        orbElement.className = `orb ${newOrb.type} new-orb`;
        orbElement.textContent = this.getOrbEmoji(newOrb.type);
      }
    });

    await this.sleep(this.ANIM_NEW_ORBS);

    orbs.forEach(orb => {
      orb.classList.remove('new-orb');
    });
  }

  async animateCascadeStep(step, soundCallback) {
    await this.animateMatchHighlight(step.matches, soundCallback);
    await this.animateClearOrbs(step.clearedPositions);
    await this.animateGravity(step.gravityMovements);
    await this.animateNewOrbs(step.newOrbs);
    await this.sleep(this.ANIM_CASCADE_DELAY);
  }

  highlightOrb(x, y, selected) {
    const orb = this.getOrbAt(x, y);
    if (orb) {
      orb.classList.toggle('selected', selected);
    }
  }

  shakeOrb(x, y) {
    const orb = this.getOrbAt(x, y);
    if (orb) {
      orb.style.animation = 'none';
      orb.offsetHeight;
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

// ============================================================================
// UIManager - Handles UI updates
// ============================================================================
class UIManager {
  constructor() {
    this.turnTimerInterval = null;
    this.turnTimeRemaining = 30000;
  }

  updateStatus(text, showSpinner = false) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      statusEl.innerHTML = text + (showSpinner ? '<span class="loading-spinner"></span>' : '');
    }
  }

  updateMessage(text) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.textContent = text;
    }
  }

  updateMovesDisplay(movesRemaining) {
    const movesEl = document.getElementById('moves-remaining');
    if (movesEl) {
      movesEl.textContent = `Moves: ${movesRemaining}`;
    }
  }

  updatePlayerInfo(playerNum, playerData, spriteAnimator) {
    const prefix = playerNum === 'PLAYER_1' ? 'p1' : 'p2';

    const hpEl = document.getElementById(`${prefix}-hp`);
    const maxHpEl = document.getElementById(`${prefix}-maxhp`);
    if (hpEl) hpEl.textContent = playerData.hp;
    if (maxHpEl) maxHpEl.textContent = playerData.maxHp;

    const hpPercent = (playerData.hp / playerData.maxHp) * 100;
    const hpBar = document.getElementById(`${prefix}-hp-bar`);
    if (hpBar) hpBar.style.width = `${hpPercent}%`;

    if (spriteAnimator) {
      const sprite = document.getElementById(`${prefix}-sprite`);
      if (sprite && (!sprite.src || !sprite.src.includes(playerData.monsterName))) {
        spriteAnimator.startIdleAnimation(playerNum, playerData.monsterName);
      }
    }

    const elementBadge = document.getElementById(`${prefix}-element-badge`);
    if (elementBadge) {
      elementBadge.textContent = playerData.element;
      elementBadge.className = `element-badge ${playerData.element}`;
    }

    this.updateChargeMeter(prefix, playerData.charge, playerData.maxCharge || 6);
  }

  updateChargeMeter(prefix, charge, maxCharge) {
    const chargeBar = document.getElementById(`${prefix}-charge`);
    if (!chargeBar) return;

    const pips = chargeBar.querySelectorAll('.charge-pip');
    pips.forEach((pip, index) => {
      pip.classList.toggle('filled', index < charge);
    });
  }

  updateTurnIndicator(currentTurn) {
    const p1 = document.getElementById('player1');
    const p2 = document.getElementById('player2');
    if (p1) p1.classList.toggle('active', currentTurn === 'PLAYER_1');
    if (p2) p2.classList.toggle('active', currentTurn === 'PLAYER_2');
  }

  showDamageFloater(targetElementId, amount, isHeal) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();

    const floater = document.createElement('div');
    floater.className = `damage-floater ${isHeal ? 'heal' : ''}`;
    floater.textContent = isHeal ? `+${amount}` : `-${amount}`;
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1000);
  }

  resetTurnTimer() {
    this.turnTimeRemaining = 30000;
    this.stopTurnTimer();

    const timerFill = document.getElementById('turn-timer-fill');
    if (!timerFill) return;

    timerFill.style.width = '100%';
    timerFill.classList.remove('warning');

    this.turnTimerInterval = setInterval(() => {
      this.turnTimeRemaining -= 100;
      const percent = (this.turnTimeRemaining / 30000) * 100;
      timerFill.style.width = `${Math.max(0, percent)}%`;

      const seconds = Math.ceil(this.turnTimeRemaining / 1000);
      const timerText = document.getElementById('turn-timer-text');
      if (timerText) timerText.textContent = `⏱️ ${seconds}s`;

      if (this.turnTimeRemaining <= 10000) timerFill.classList.add('warning');
      if (this.turnTimeRemaining <= 0) this.stopTurnTimer();
    }, 100);
  }

  stopTurnTimer() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  showGame(playerNumber) {
    document.getElementById('status').style.display = 'none';
    document.getElementById('game-container').classList.add('active');

    const myPlayerElement = playerNumber === 'PLAYER_1' ? 'player1' : 'player2';
    const el = document.getElementById(myPlayerElement);
    if (el) el.classList.add('you');
  }

  showGameOver(isWinner, reason = '') {
    const overlay = document.getElementById('game-over-overlay');
    const content = overlay.querySelector('.game-over-content');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');

    if (isWinner) {
      content.className = 'game-over-content win';
      title.textContent = '🎉 YOU WIN!';
      message.textContent = reason || 'Congratulations, Champion!';
    } else {
      content.className = 'game-over-content lose';
      title.textContent = '😔 YOU LOSE';
      message.textContent = reason || 'Better luck next time!';
    }

    overlay.classList.add('active');
  }
}

// ============================================================================
// SoundManager - Handles audio (placeholder)
// ============================================================================
class SoundManager {
  constructor() {
    this.enabled = true;
  }

  play(soundName) {
    if (!this.enabled) return;
    console.log(`🔊 Sound: ${soundName}`);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// ============================================================================
// GameClient - Main game controller
// ============================================================================
class GameClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.playerNumber = null;
    this.gameState = null;
    this.selectedOrb = null;
    this.roomId = null;
    this.isMyTurn = false;
    this.isAnimating = false;
    this.movesRemaining = 2;

    // Initialize modules
    this.spriteAnimator = new SpriteAnimator();
    this.boardAnimator = new BoardAnimator();
    this.uiManager = new UIManager();
    this.soundManager = new SoundManager();

    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to server');
      this.uiManager.updateStatus('Connected! Waiting for opponent...', true);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.uiManager.updateStatus('Connection error', false);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.uiManager.updateStatus('Disconnected from server. Refresh to reconnect.', false);
      this.uiManager.stopTurnTimer();
    };
  }

  handleMessage(message) {
    console.log('Received:', message);

    switch (message.type) {
      case 'CONNECTED':
        this.playerId = message.payload.playerId;
        break;

      case 'WAITING_FOR_OPPONENT':
        this.uiManager.updateStatus('Waiting for opponent...', true);
        break;

      case 'PLAYER_ASSIGNED':
        this.playerNumber = message.payload.playerNumber;
        this.monsterName = message.payload.monsterName;
        this.element = message.payload.element;
        break;

      case 'GAME_START':
        this.roomId = message.payload.roomId;
        this.gameState = message.payload.gameState;
        this.startGame();
        break;

      case 'GAME_STATE_UPDATE':
        this.gameState = message.payload.gameState;
        this.updateGameState();
        this.uiManager.resetTurnTimer();
        break;

      case 'MOVE_RESULT':
        this.handleMoveResult(message.payload);
        break;

      case 'TURN_TIMEOUT_WARNING':
        this.handleTimeoutWarning();
        break;

      case 'TURN_TIMEOUT':
        this.handleTurnTimeout(message.payload);
        break;

      case 'GAME_END':
        this.handleGameEnd(message.payload);
        break;

      case 'OPPONENT_DISCONNECTED':
        this.handleOpponentDisconnect(message.payload);
        break;

      case 'ERROR':
        this.showError(message.payload.message);
        break;
    }
  }

  startGame() {
    console.log('Game started!');
    this.uiManager.showGame(this.playerNumber);
    this.updateGameState();
    this.uiManager.resetTurnTimer();
  }

  updateGameState() {
    if (!this.gameState) return;

    this.boardAnimator.renderBoard(this.gameState.board, (x, y) => this.handleOrbClick(x, y));
    this.uiManager.updatePlayerInfo('PLAYER_1', this.gameState.players.PLAYER_1, this.spriteAnimator);
    this.uiManager.updatePlayerInfo('PLAYER_2', this.gameState.players.PLAYER_2, this.spriteAnimator);
    this.uiManager.updateTurnIndicator(this.gameState.currentTurn);

    this.isMyTurn = this.gameState.currentTurn === this.playerNumber;
    this.movesRemaining = this.gameState.movesRemaining || 2;
    this.uiManager.updateMovesDisplay(this.movesRemaining);

    if (this.isMyTurn) {
      this.uiManager.updateMessage(`🎯 Your turn! ${this.movesRemaining} move${this.movesRemaining > 1 ? 's' : ''} left`);
    } else {
      this.uiManager.updateMessage("⏳ Opponent's turn...");
    }

    this.boardAnimator.setOrbsInteractive(this.isMyTurn && this.gameState.phase === 'PLAYING');
  }

  handleOrbClick(x, y) {
    if (!this.isMyTurn || this.gameState.phase !== 'PLAYING' || this.isAnimating) {
      return;
    }

    if (!this.selectedOrb) {
      this.selectedOrb = { x, y };
      this.boardAnimator.highlightOrb(x, y, true);
      this.soundManager.play('select');
    } else {
      const orb1 = this.selectedOrb;
      const orb2 = { x, y };

      if (orb1.x === x && orb1.y === y) {
        this.clearSelection();
        return;
      }

      if (this.isAdjacent(orb1, orb2)) {
        this.sendMove(orb1, orb2);
        this.isMyTurn = false;
      } else {
        this.boardAnimator.shakeOrb(x, y);
      }

      this.clearSelection();
    }
  }

  isAdjacent(orb1, orb2) {
    const dx = Math.abs(orb1.x - orb2.x);
    const dy = Math.abs(orb1.y - orb2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  clearSelection() {
    this.selectedOrb = null;
    this.boardAnimator.clearSelection();
  }

  sendMove(from, to) {
    const message = {
      type: 'MOVE',
      payload: {
        move: { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
      }
    };
    this.ws.send(JSON.stringify(message));
    this.soundManager.play('move');
  }

  async handleMoveResult(payload) {
    const { result, movesRemaining, gameState } = payload;

    // Update game state from server FIRST (authoritative state)
    if (gameState) {
      this.gameState = gameState;
    }

    this.isAnimating = true;

    // Animate each cascade step
    if (result.cascadeSteps && result.cascadeSteps.length > 0) {
      for (let i = 0; i < result.cascadeSteps.length; i++) {
        const step = result.cascadeSteps[i];
        
        if (result.cascadeCount > 1) {
          this.uiManager.updateMessage(`💥 Cascade ${i + 1}!`);
        }
        
        await this.boardAnimator.animateCascadeStep(step, (sound) => this.soundManager.play(sound));
      }
    }

    // After animations, render the FINAL board state from server
    // This ensures the visual matches the authoritative server state
    if (this.gameState && this.gameState.board) {
      this.boardAnimator.renderBoard(this.gameState.board, (x, y) => this.handleOrbClick(x, y));
    }

    // Update player info to reflect new HP/charge values
    if (this.gameState && this.gameState.players) {
      this.uiManager.updatePlayerInfo('PLAYER_1', this.gameState.players.PLAYER_1, this.spriteAnimator);
      this.uiManager.updatePlayerInfo('PLAYER_2', this.gameState.players.PLAYER_2, this.spriteAnimator);
    }

    // Character animations for attack/damage
    const attackerNum = payload.player;
    const defenderNum = payload.player === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
    const attackerData = this.gameState.players[attackerNum];
    const defenderData = this.gameState.players[defenderNum];

    if (result.totalDamage > 0 && result.attackExecuted) {
      this.spriteAnimator.playAttackAnimation(attackerNum, attackerData.monsterName);
      await this.sleep(300);
      
      this.spriteAnimator.playHurtAnimation(defenderNum, defenderData.monsterName);
      
      const targetPlayer = payload.player === 'PLAYER_1' ? 'player2' : 'player1';
      this.uiManager.showDamageFloater(targetPlayer, result.totalDamage, false);
      this.soundManager.play('damage');
      
      this.uiManager.updateMessage(`⚔️ ATTACK! ${result.totalDamage} damage dealt!`);
      await this.sleep(500);
    } else if (result.chargeGained > 0) {
      const currentCharge = attackerData?.charge || 0;
      const maxCharge = attackerData?.maxCharge || 6;
      if (currentCharge < maxCharge) {
        this.uiManager.updateMessage(`⚡ Charging... ${currentCharge}/${maxCharge}`);
      } else {
        this.uiManager.updateMessage(`⚡ FULLY CHARGED! Next match will ATTACK!`);
      }
    }

    if (result.healAmount > 0) {
      const healPlayer = payload.player === 'PLAYER_1' ? 'player1' : 'player2';
      this.uiManager.showDamageFloater(healPlayer, result.healAmount, true);
      this.soundManager.play('heal');
    }

    if (result.bonusMoves > 0) {
      this.uiManager.updateMessage(`🌟 +${result.bonusMoves} bonus move${result.bonusMoves > 1 ? 's' : ''}!`);
      this.soundManager.play('bonus');
      await this.sleep(500);
    }

    if (result.cascadeCount > 1) {
      this.uiManager.updateMessage(`💥 ${result.cascadeCount}x Cascade! ${result.totalDamage} damage!`);
    } else if (result.totalDamage > 0) {
      this.uiManager.updateMessage(`⚔️ ${result.totalDamage} damage dealt!`);
    }

    this.movesRemaining = movesRemaining;
    this.uiManager.updateMovesDisplay(this.movesRemaining);
    this.isAnimating = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleTimeoutWarning() {
    if (this.isMyTurn) {
      this.uiManager.updateMessage('⚠️ 10 seconds remaining!');
      this.soundManager.play('warning');
    }
  }

  handleTurnTimeout(payload) {
    this.uiManager.updateMessage(`⏰ ${payload.player} timed out! (${payload.afkCount}/2 AFK)`);
  }

  handleGameEnd(payload) {
    this.uiManager.stopTurnTimer();
    const isWinner = payload.winner === this.playerNumber;
    this.uiManager.showGameOver(isWinner, isWinner ? 'Congratulations, Champion!' : 'Better luck next time!');
    this.soundManager.play(isWinner ? 'win' : 'lose');
  }

  handleOpponentDisconnect() {
    this.uiManager.stopTurnTimer();
    this.uiManager.updateMessage('🚪 Opponent disconnected! You win!');
    this.uiManager.showGameOver(true, 'Opponent disconnected');
  }

  showError(msg) {
    console.error('Game error:', msg);
    this.uiManager.updateMessage(`❌ Error: ${msg}`);
  }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// Initialize
let gameClient;
window.addEventListener('DOMContentLoaded', () => {
  gameClient = new GameClient();
});

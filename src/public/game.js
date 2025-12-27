// Monster Puzzle Fight - Game Client

class GameClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.playerNumber = null;
    this.gameState = null;
    this.selectedOrb = null;
    this.roomId = null;
    this.turnTimerInterval = null;
    this.turnTimeRemaining = 30000;
    this.isMyTurn = false;
    this.isAnimating = false; // Lock input during animations
    this.movesRemaining = 2;

    // Animation timings (ms)
    this.ANIM_MATCH_HIGHLIGHT = 400;
    this.ANIM_MATCH_CLEAR = 300;
    this.ANIM_GRAVITY_DROP = 250;
    this.ANIM_NEW_ORBS = 200;
    this.ANIM_STEP_DELAY = 100;

    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to server');
      this.updateStatus('Connected! Waiting for opponent...', true);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('Connection error', false);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.updateStatus('Disconnected from server. Refresh to reconnect.', false);
      this.stopTurnTimer();
    };
  }

  handleMessage(message) {
    console.log('Received:', message);

    switch (message.type) {
      case 'CONNECTED':
        this.playerId = message.payload.playerId;
        break;

      case 'WAITING_FOR_OPPONENT':
        this.updateStatus('Waiting for opponent...', true);
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
        this.resetTurnTimer();
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
    document.getElementById('status').style.display = 'none';
    document.getElementById('game-container').classList.add('active');

    // Mark which player is "you"
    const myPlayerElement = this.playerNumber === 'PLAYER_1' ? 'player1' : 'player2';
    document.getElementById(myPlayerElement).classList.add('you');

    this.updateGameState();
    this.resetTurnTimer();
  }

  updateGameState() {
    if (!this.gameState) return;

    // Update board
    this.renderBoard(this.gameState.board);

    // Update player info
    this.updatePlayerInfo('PLAYER_1', this.gameState.players.PLAYER_1);
    this.updatePlayerInfo('PLAYER_2', this.gameState.players.PLAYER_2);

    // Update current turn indicator
    this.updateTurnIndicator(this.gameState.currentTurn);

    // Check if it's my turn
    this.isMyTurn = this.gameState.currentTurn === this.playerNumber;

    // Update moves remaining
    this.movesRemaining = this.gameState.movesRemaining || 2;
    this.updateMovesDisplay();

    // Update message
    if (this.isMyTurn) {
      this.updateMessage(`🎯 Your turn! ${this.movesRemaining} move${this.movesRemaining > 1 ? 's' : ''} left`);
    } else {
      this.updateMessage("⏳ Opponent's turn...");
    }

    // Enable/disable orbs based on turn
    this.updateOrbsInteractivity();
  }

  renderBoard(boardData) {
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

        orb.addEventListener('click', () => this.handleOrbClick(x, y));

        boardElement.appendChild(orb);
      }
    }
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

  handleOrbClick(x, y) {
    // Only allow moves on player's turn and when not animating
    if (!this.isMyTurn || this.gameState.phase !== 'PLAYING' || this.isAnimating) {
      return;
    }

    if (!this.selectedOrb) {
      // Select first orb
      this.selectedOrb = { x, y };
      this.highlightOrb(x, y, true);
      this.playSound('select');
    } else {
      // Select second orb and attempt swap
      const orb1 = this.selectedOrb;
      const orb2 = { x, y };

      // Check if same orb clicked
      if (orb1.x === x && orb1.y === y) {
        this.clearSelection();
        return;
      }

      // Check if adjacent
      if (this.isAdjacent(orb1, orb2)) {
        this.sendMove(orb1, orb2);
        this.isMyTurn = false; // Prevent double moves
      } else {
        // Not adjacent - show feedback
        this.shakeOrb(x, y);
      }

      // Clear selection
      this.clearSelection();
    }
  }

  isAdjacent(orb1, orb2) {
    const dx = Math.abs(orb1.x - orb2.x);
    const dy = Math.abs(orb1.y - orb2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  highlightOrb(x, y, selected) {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      if (parseInt(orb.dataset.x) === x && parseInt(orb.dataset.y) === y) {
        if (selected) {
          orb.classList.add('selected');
        } else {
          orb.classList.remove('selected');
        }
      }
    });
  }

  shakeOrb(x, y) {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      if (parseInt(orb.dataset.x) === x && parseInt(orb.dataset.y) === y) {
        orb.style.animation = 'none';
        orb.offsetHeight; // Trigger reflow
        orb.style.animation = 'shake 0.3s ease';
      }
    });
  }

  clearSelection() {
    this.selectedOrb = null;
    document.querySelectorAll('.orb.selected').forEach(orb => {
      orb.classList.remove('selected');
    });
  }

  updateOrbsInteractivity() {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      if (this.isMyTurn && this.gameState.phase === 'PLAYING') {
        orb.classList.remove('disabled');
      } else {
        orb.classList.add('disabled');
      }
    });
  }

  sendMove(from, to) {
    const message = {
      type: 'MOVE',
      payload: {
        move: {
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y
        }
      }
    };

    this.ws.send(JSON.stringify(message));
    this.playSound('move');
  }

  async handleMoveResult(payload) {
    const { result, movesRemaining, turnChanged } = payload;

    // Lock input during animation
    this.isAnimating = true;

    // Simple animation: just highlight matches and show effects
    // The actual board update comes from GAME_STATE_UPDATE
    if (result.cascadeSteps && result.cascadeSteps.length > 0) {
      for (let i = 0; i < result.cascadeSteps.length; i++) {
        const step = result.cascadeSteps[i];
        
        // Show cascade number for multi-cascades
        if (result.cascadeCount > 1) {
          this.updateMessage(`💥 Cascade ${i + 1}!`);
        }
        
        // Highlight matched orbs briefly
        await this.animateMatchHighlight(step.matches);
        
        // Brief pause between cascades
        await this.sleep(200);
      }
    }

    // Show damage floater after animations
    if (result.totalDamage > 0) {
      const targetPlayer = payload.player === 'PLAYER_1' ? 'player2' : 'player1';
      this.showDamageFloater(targetPlayer, result.totalDamage, false);
      this.playSound('damage');
    }

    // Show heal floater
    if (result.healAmount > 0) {
      const healPlayer = payload.player === 'PLAYER_1' ? 'player1' : 'player2';
      this.showDamageFloater(healPlayer, result.healAmount, true);
      this.playSound('heal');
    }

    // Show bonus move notification
    if (result.bonusMoves > 0) {
      this.updateMessage(`🌟 +${result.bonusMoves} bonus move${result.bonusMoves > 1 ? 's' : ''}!`);
      this.playSound('bonus');
      await this.sleep(500);
    }

    // Update message with result
    if (result.cascadeCount > 1) {
      this.updateMessage(`💥 ${result.cascadeCount}x Cascade! ${result.totalDamage} damage!`);
    } else if (result.totalDamage > 0) {
      this.updateMessage(`⚔️ ${result.totalDamage} damage dealt!`);
    }

    // Update moves remaining display
    this.movesRemaining = movesRemaining;
    this.updateMovesDisplay();

    // Unlock input
    this.isAnimating = false;
  }

  async animateMatchHighlight(matches) {
    const positions = new Set();
    matches.forEach(match => {
      // Match uses 'orbs' array for positions
      (match.orbs || match.positions || []).forEach(pos => {
        positions.add(`${pos.x},${pos.y}`);
      });
    });

    // Add highlight class to matched orbs
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach(orb => {
      const key = `${orb.dataset.x},${orb.dataset.y}`;
      if (positions.has(key)) {
        orb.classList.add('matched');
      }
    });

    this.playSound('match');
    await this.sleep(this.ANIM_MATCH_HIGHLIGHT);

    // Remove highlight
    orbs.forEach(orb => {
      orb.classList.remove('matched');
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateMovesDisplay() {
    const movesEl = document.getElementById('moves-remaining');
    if (movesEl) {
      movesEl.textContent = `Moves: ${this.movesRemaining}`;
    }
  }

  showDamageFloater(targetElementId, amount, isHeal) {
    const targetElement = document.getElementById(targetElementId);
    const rect = targetElement.getBoundingClientRect();

    const floater = document.createElement('div');
    floater.className = `damage-floater ${isHeal ? 'heal' : ''}`;
    floater.textContent = isHeal ? `+${amount}` : `-${amount}`;
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(floater);

    setTimeout(() => {
      floater.remove();
    }, 1000);
  }

  updatePlayerInfo(playerNum, playerData) {
    const prefix = playerNum === 'PLAYER_1' ? 'p1' : 'p2';

    // Update HP
    document.getElementById(`${prefix}-hp`).textContent = playerData.hp;
    document.getElementById(`${prefix}-maxhp`).textContent = playerData.maxHp;

    const hpPercent = (playerData.hp / playerData.maxHp) * 100;
    document.getElementById(`${prefix}-hp-bar`).style.width = `${hpPercent}%`;

    // Update monster info
    document.getElementById(`${prefix}-monster`).textContent = playerData.monsterName;

    // Update element badge
    const elementBadge = document.getElementById(`${prefix}-element-badge`);
    elementBadge.textContent = playerData.element;
    elementBadge.className = `element-badge ${playerData.element}`;

    // Update charge meter
    this.updateChargeMeter(prefix, playerData.charge, playerData.maxCharge);
  }

  updateChargeMeter(prefix, charge, maxCharge) {
    const chargeBar = document.getElementById(`${prefix}-charge`);
    const pips = chargeBar.querySelectorAll('.charge-pip');

    pips.forEach((pip, index) => {
      if (index < charge) {
        pip.classList.add('filled');
      } else {
        pip.classList.remove('filled');
      }
    });
  }

  updateTurnIndicator(currentTurn) {
    document.getElementById('player1').classList.toggle('active', currentTurn === 'PLAYER_1');
    document.getElementById('player2').classList.toggle('active', currentTurn === 'PLAYER_2');
  }

  // Turn Timer
  resetTurnTimer() {
    this.turnTimeRemaining = 30000;
    this.stopTurnTimer();

    const timerFill = document.getElementById('turn-timer-fill');
    timerFill.style.width = '100%';
    timerFill.classList.remove('warning');

    this.turnTimerInterval = setInterval(() => {
      this.turnTimeRemaining -= 100;
      const percent = (this.turnTimeRemaining / 30000) * 100;
      timerFill.style.width = `${Math.max(0, percent)}%`;

      // Update text
      const seconds = Math.ceil(this.turnTimeRemaining / 1000);
      document.getElementById('turn-timer-text').textContent = `⏱️ ${seconds}s`;

      if (this.turnTimeRemaining <= 10000) {
        timerFill.classList.add('warning');
      }

      if (this.turnTimeRemaining <= 0) {
        this.stopTurnTimer();
      }
    }, 100);
  }

  stopTurnTimer() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  handleTimeoutWarning() {
    if (this.isMyTurn) {
      this.updateMessage('⚠️ 10 seconds remaining!');
      this.playSound('warning');
    }
  }

  handleTurnTimeout(payload) {
    this.updateMessage(`⏰ ${payload.player} timed out! (${payload.afkCount}/2 AFK)`);
  }

  handleGameEnd(payload) {
    this.stopTurnTimer();

    const isWinner = payload.winner === this.playerNumber;
    const overlay = document.getElementById('game-over-overlay');
    const content = overlay.querySelector('.game-over-content');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');

    if (isWinner) {
      content.className = 'game-over-content win';
      title.textContent = '🎉 YOU WIN!';
      message.textContent = 'Congratulations, Champion!';
      this.playSound('win');
    } else {
      content.className = 'game-over-content lose';
      title.textContent = '😔 YOU LOSE';
      message.textContent = 'Better luck next time!';
      this.playSound('lose');
    }

    overlay.classList.add('active');
  }

  handleOpponentDisconnect(payload) {
    this.stopTurnTimer();
    this.updateMessage('🚪 Opponent disconnected! You win!');

    const overlay = document.getElementById('game-over-overlay');
    const content = overlay.querySelector('.game-over-content');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');

    content.className = 'game-over-content win';
    title.textContent = '🎉 YOU WIN!';
    message.textContent = 'Opponent disconnected';

    overlay.classList.add('active');
  }

  showError(msg) {
    console.error('Game error:', msg);
    this.updateMessage(`❌ Error: ${msg}`);
  }

  updateStatus(text, showSpinner = false) {
    const statusEl = document.getElementById('connection-status');
    statusEl.innerHTML = text + (showSpinner ? '<span class="loading-spinner"></span>' : '');
  }

  updateMessage(text) {
    document.getElementById('message').textContent = text;
  }

  // Sound effects (placeholder - can be replaced with actual audio)
  playSound(soundName) {
    // TODO: Add actual sound effects
    console.log(`🔊 Sound: ${soundName}`);
  }
}

// Add shake animation CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// Initialize game client when page loads
let gameClient;
window.addEventListener('DOMContentLoaded', () => {
  gameClient = new GameClient();
});

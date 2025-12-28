// GameClient - Main game controller with Event Queue Architecture
// CRITICAL: Follows check.md principles:
// - FE is REPLAY ENGINE, BE is GAME ENGINE
// - All WS events go through FIFO EventQueue
// - BoardModel updated ONLY AFTER animations complete
// - Input locked during animation playback

class GameClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.playerNumber = null;
    this.selectedOrb = null;
    this.roomId = null;
    this.movesRemaining = 2;

    // INPUT LOCK: True = cannot click orbs
    this.inputLocked = true;

    // Server state cache (for player info, etc)
    this.serverState = null;

    // Initialize core modules
    this.eventQueue = new window.EventQueue();
    this.boardModel = new window.BoardModel();
    this.spriteAnimator = new window.SpriteAnimator();
    this.boardAnimator = new window.BoardAnimator();
    this.uiManager = new window.UIManager();
    this.soundManager = new window.SoundManager();

    // Set up event processor
    this.eventQueue.setProcessor(async (event) => {
      await this.processEvent(event);
    });

    // When queue becomes idle, update input lock
    this.eventQueue.setOnIdle(() => {
      this.updateInputLock();
    });

    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WS] Connected to server');
      this.uiManager.updateStatus('Connected! Waiting for opponent...', true);
    };

    // ALL WS messages go through EventQueue
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('[WS] Received:', message.type);
      this.eventQueue.push(message);
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
      this.uiManager.updateStatus('Connection error', false);
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.uiManager.updateStatus('Disconnected from server. Refresh to reconnect.', false);
      this.uiManager.stopTurnTimer();
    };
  }

  // ============================================
  // EVENT PROCESSOR (one event at a time)
  // ============================================
  async processEvent(message) {
    console.log('[Event] Processing:', message.type);

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
        await this.handleGameStart(message.payload);
        break;

      case 'GAME_STATE_UPDATE':
        await this.handleGameStateUpdate(message.payload);
        break;

      case 'MOVE_RESULT':
        await this.handleMoveResult(message.payload);
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
        this.handleOpponentDisconnect();
        break;

      case 'ERROR':
        this.showError(message.payload.message);
        break;
    }
  }

  // ============================================
  // GAME START
  // ============================================
  async handleGameStart(payload) {
    console.log('[Game] Started!');
    this.roomId = payload.roomId;
    this.serverState = payload.gameState;

    // Initialize BoardModel with server state
    this.boardModel.forceSync(this.serverState.board);

    // Render visual board from model
    this.boardAnimator.renderFromModel(this.boardModel, (x, y) => this.handleOrbClick(x, y));

    // Update UI
    this.uiManager.showGame(this.playerNumber);
    this.updateUI();
    this.uiManager.resetTurnTimer();
    // Note: updateInputLock() called by EventQueue.onIdle
  }

  // ============================================
  // GAME STATE UPDATE (turn change, etc)
  // ============================================
  async handleGameStateUpdate(payload) {
    this.serverState = payload.gameState;

    // Sync board model with server
    this.boardModel.forceSync(this.serverState.board);

    // Re-render visual board from model
    this.boardAnimator.renderFromModel(this.boardModel, (x, y) => this.handleOrbClick(x, y));

    // Update UI
    this.updateUI();
    this.uiManager.resetTurnTimer();
    // Note: updateInputLock() called by EventQueue.onIdle
  }

  // ============================================
  // MOVE RESULT - Main animation sequence
  // ============================================
  async handleMoveResult(payload) {
    const { result, movesRemaining, gameState, move } = payload;

    // Lock input during animation
    this.inputLocked = true;
    this.boardAnimator.setOrbsInteractive(false);

    // Step 1: Animate the swap (visual only)
    if (move) {
      await this.boardAnimator.animateSwap(move.x1, move.y1, move.x2, move.y2);
      // Update board model after swap animation
      this.boardModel.applySwap(move.x1, move.y1, move.x2, move.y2);
    }

    // Step 2: Animate each cascade step from server data
    if (result.cascadeSteps && result.cascadeSteps.length > 0) {
      for (let i = 0; i < result.cascadeSteps.length; i++) {
        const step = result.cascadeSteps[i];

        if (result.cascadeCount > 1 && i > 0) {
          this.uiManager.updateMessage(`💥 Cascade ${i + 1}!`);
        }

        // 2a: Highlight matched orbs
        if (step.matches && step.matches.length > 0) {
          const allPositions = step.matches.flatMap(m => m.orbs);
          await this.boardAnimator.animateMatchHighlight(allPositions, (sound) => this.soundManager.play(sound));
        }

        // 2b: Clear matched orbs (animation)
        if (step.clearedPositions && step.clearedPositions.length > 0) {
          await this.boardAnimator.animateClear(step.clearedPositions);
          // Update board model after clear animation
          this.boardModel.clearOrbs(step.clearedPositions);
        }

        // 2c: Gravity drop (animation)
        if (step.gravityMovements && step.gravityMovements.length > 0) {
          await this.boardAnimator.animateGravity(step.gravityMovements);
          // Update board model after gravity animation
          this.boardModel.applyGravity(step.gravityMovements);
        }

        // 2d: Spawn new orbs (animation)
        if (step.newOrbs && step.newOrbs.length > 0) {
          await this.boardAnimator.animateSpawn(step.newOrbs);
          // Update board model after spawn animation
          this.boardModel.spawnOrbs(step.newOrbs);
        }
      }
    }

    // Step 3: Final sync with server state (safety net)
    if (gameState) {
      this.serverState = gameState;
      // Force sync board model to match server
      this.boardModel.forceSync(gameState.board);
      // Re-render to ensure visual matches model
      this.boardAnimator.renderFromModel(this.boardModel, (x, y) => this.handleOrbClick(x, y));
    }

    // Step 4: Update player info (HP, charge, etc)
    this.updateUI();

    // Step 5: Character animations for attack/damage
    const attackerNum = payload.player;
    const defenderNum = payload.player === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
    const attackerData = this.serverState?.players?.[attackerNum];
    const defenderData = this.serverState?.players?.[defenderNum];

    if (result.totalDamage > 0 && result.attackExecuted) {
      this.spriteAnimator.playAttackAnimation(attackerNum, attackerData?.spriteFolder);
      await this.sleep(300);

      this.spriteAnimator.playHurtAnimation(defenderNum, defenderData?.spriteFolder);

      const targetPlayer = payload.player === 'PLAYER_1' ? 'player2' : 'player1';
      this.uiManager.showDamageFloater(targetPlayer, result.totalDamage, false);
      this.soundManager.play('damage');

      this.uiManager.updateMessage(`⚔️ ATTACK! ${result.totalDamage} damage dealt!`);
      await this.sleep(500);
    } else if (result.chargeGained > 0) {
      const currentCharge = attackerData?.charge || 0;
      const maxCharge = attackerData?.maxCharge || 6;
      if (currentCharge >= maxCharge) {
        this.uiManager.updateMessage(`⚡ FULLY CHARGED! Next match will ATTACK!`);
      } else {
        this.uiManager.updateMessage(`⚡ Charging... ${currentCharge}/${maxCharge}`);
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

    // Update moves display
    this.movesRemaining = movesRemaining;
    this.uiManager.updateMovesDisplay(this.movesRemaining);
    // Note: updateInputLock() called by EventQueue.onIdle
  }

  // ============================================
  // UI HELPERS
  // ============================================
  updateUI() {
    if (!this.serverState) return;

    // Update player info
    this.uiManager.updatePlayerInfo('PLAYER_1', this.serverState.players.PLAYER_1, this.spriteAnimator);
    this.uiManager.updatePlayerInfo('PLAYER_2', this.serverState.players.PLAYER_2, this.spriteAnimator);
    this.uiManager.updateTurnIndicator(this.serverState.currentTurn);

    // Update moves display
    this.movesRemaining = this.serverState.movesRemaining || 2;
    this.uiManager.updateMovesDisplay(this.movesRemaining);

    // Update turn message
    const isMyTurn = this.serverState.currentTurn === this.playerNumber;
    if (isMyTurn) {
      this.uiManager.updateMessage(`🎯 Your turn! ${this.movesRemaining} move${this.movesRemaining > 1 ? 's' : ''} left`);
    } else {
      this.uiManager.updateMessage("⏳ Opponent's turn...");
    }
  }

  updateInputLock() {
    if (!this.serverState) {
      this.inputLocked = true;
      return;
    }

    const isMyTurn = this.serverState.currentTurn === this.playerNumber;
    const isPlaying = this.serverState.phase === 'PLAYING';
    const isIdle = this.eventQueue.isIdle();

    // Only unlock if: my turn, game is playing, and no events being processed
    this.inputLocked = !(isMyTurn && isPlaying && isIdle);
    this.boardAnimator.setOrbsInteractive(!this.inputLocked);

    console.log(`[InputLock] locked=${this.inputLocked}, myTurn=${isMyTurn}, playing=${isPlaying}, idle=${isIdle}`);
  }

  // ============================================
  // ORB INTERACTION
  // ============================================
  handleOrbClick(x, y) {
    if (this.inputLocked) {
      console.log('[Click] Ignored - input locked');
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
        // Lock input immediately after sending move
        this.inputLocked = true;
        this.boardAnimator.setOrbsInteractive(false);
        this.sendMove(orb1, orb2);
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
    console.log('[Move] Sent:', from, '->', to);
  }

  // ============================================
  // OTHER EVENT HANDLERS
  // ============================================
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleTimeoutWarning() {
    const isMyTurn = this.serverState?.currentTurn === this.playerNumber;
    if (isMyTurn) {
      this.uiManager.updateMessage('⚠️ 10 seconds remaining!');
      this.soundManager.play('warning');
    }
  }

  handleTurnTimeout(payload) {
    this.uiManager.updateMessage(`⏰ ${payload.player} timed out! (${payload.afkCount}/2 AFK)`);
  }

  handleGameEnd(payload) {
    this.inputLocked = true;
    this.uiManager.stopTurnTimer();
    const isWinner = payload.winner === this.playerNumber;
    this.uiManager.showGameOver(isWinner, isWinner ? 'Congratulations, Champion!' : 'Better luck next time!');
    this.soundManager.play(isWinner ? 'win' : 'lose');
  }

  handleOpponentDisconnect() {
    this.inputLocked = true;
    this.uiManager.stopTurnTimer();
    this.uiManager.updateMessage('🚪 Opponent disconnected! You win!');
    this.uiManager.showGameOver(true, 'Opponent disconnected');
  }

  showError(msg) {
    console.error('[Error]', msg);
    this.uiManager.updateMessage(`❌ Error: ${msg}`);
  }
}

// Export for use
window.GameClient = GameClient;

// UIManager - Handles UI updates

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

    // Update monster name in header
    const nameEl = document.getElementById(`${prefix}-name`);
    if (nameEl) nameEl.textContent = playerData.monsterName.toUpperCase();

    const hpEl = document.getElementById(`${prefix}-hp`);
    const maxHpEl = document.getElementById(`${prefix}-maxhp`);
    if (hpEl) hpEl.textContent = playerData.hp;
    if (maxHpEl) maxHpEl.textContent = playerData.maxHp;

    const hpPercent = (playerData.hp / playerData.maxHp) * 100;
    const hpBar = document.getElementById(`${prefix}-hp-bar`);
    if (hpBar) hpBar.style.width = `${hpPercent}%`;

    if (spriteAnimator) {
      const sprite = document.getElementById(`${prefix}-sprite`);
      if (sprite && (!sprite.src || !sprite.src.includes(playerData.spriteFolder))) {
        spriteAnimator.startIdleAnimation(playerNum, playerData.spriteFolder);
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

// Export for use in other modules
window.UIManager = UIManager;

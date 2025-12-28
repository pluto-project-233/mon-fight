// SpriteAnimator - Handles character sprite animations

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

// Export for use in other modules
window.SpriteAnimator = SpriteAnimator;

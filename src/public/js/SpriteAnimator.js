// SpriteAnimator - Handles character sprite animations

class SpriteAnimator {
  constructor() {
    this.animationState = {
      PLAYER_1: { current: 0, interval: null },
      PLAYER_2: { current: 0, interval: null }
    };
    
    // Character configurations
    this.characterConfig = {
      assassin_dark: { hasDirections: true, prefix: 'Front - ' },
      thug_fire: { hasDirections: true, prefix: 'Front - ' },
      robber_light: { hasDirections: true, prefix: 'Front - ' },
      golem_green: { hasDirections: false, prefix: 'Golem_03_' },
      minotaur_blue: { hasDirections: false, prefix: 'Minotaur_02_' }
    };
  }

  getSpriteBasePath(spriteFolder) {
    return `/asset/${spriteFolder}/PNG/sequences`;
  }

  getAnimationPath(spriteFolder, animation) {
    const config = this.characterConfig[spriteFolder];
    if (!config) return null;
    
    const basePath = this.getSpriteBasePath(spriteFolder);
    
    if (config.hasDirections) {
      // Directional characters (assassin, thug, robber)
      // File names are like "Front - Idle_000.png", "Front - Attacking_000.png"
      const animMap = {
        idle: { folder: 'front_idle', file: 'Idle' },
        attacking: { folder: 'front_attacking', file: 'Attacking' },
        hurt: { folder: 'front_hurt', file: 'Hurt' }
      };
      const anim = animMap[animation];
      return {
        path: `${basePath}/${anim.folder}`,
        filePrefix: `Front - ${anim.file}_`
      };
    } else {
      // Non-directional characters (golem, minotaur)
      // File names are like "Golem_03_Idle_000.png"
      const animMap = {
        idle: 'Idle',
        attacking: 'Attacking',
        hurt: 'Hurt'
      };
      return {
        path: `${basePath}/${animation}`,
        filePrefix: `${config.prefix}${animMap[animation]}_`
      };
    }
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

  startIdleAnimation(playerNum, spriteFolder) {
    const sprite = this.getSpriteElement(playerNum);
    const animInfo = this.getAnimationPath(spriteFolder, 'idle');
    
    if (!animInfo || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const frameCount = 12;
    let frame = 0;
    
    sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
    
    this.animationState[playerNum].interval = setInterval(() => {
      frame = (frame + 1) % frameCount;
      sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
    }, 100);
  }

  playAttackAnimation(playerNum, spriteFolder) {
    const sprite = this.getSpriteElement(playerNum);
    const animInfo = this.getAnimationPath(spriteFolder, 'attacking');
    
    if (!animInfo || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const frameCount = 12;
    let frame = 0;
    
    sprite.classList.add('attacking');
    sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
    
    const attackInterval = setInterval(() => {
      frame++;
      if (frame >= frameCount) {
        clearInterval(attackInterval);
        sprite.classList.remove('attacking');
        this.startIdleAnimation(playerNum, spriteFolder);
      } else {
        sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
      }
    }, 80);
  }

  playHurtAnimation(playerNum, spriteFolder) {
    const sprite = this.getSpriteElement(playerNum);
    const animInfo = this.getAnimationPath(spriteFolder, 'hurt');
    
    if (!animInfo || !sprite) return;
    
    this.stopAnimation(playerNum);
    
    const frameCount = 10;
    let frame = 0;
    
    sprite.classList.add('hurt');
    sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
    
    const hurtInterval = setInterval(() => {
      frame++;
      if (frame >= frameCount) {
        clearInterval(hurtInterval);
        sprite.classList.remove('hurt');
        this.startIdleAnimation(playerNum, spriteFolder);
      } else {
        sprite.src = `${animInfo.path}/${animInfo.filePrefix}${frame.toString().padStart(3, '0')}.png`;
      }
    }, 80);
  }
}

// Export for use in other modules
window.SpriteAnimator = SpriteAnimator;

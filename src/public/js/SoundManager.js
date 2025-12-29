// SoundManager - Handles audio playback

class SoundManager {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.bgMusic = null;
    this.bgMusicPlaying = false;
    this.bgMusicPending = false;
    
    // Load sound effects
    this.loadSounds();
  }

  loadSounds() {
    // Sound effects - using available assets
    this.sounds.attack = new Audio('/asset/sound/attack-effect.mp3');
    this.sounds.attack.volume = 0.5;
    
    this.sounds.victory = new Audio('/asset/sound/victory-effect.mp3');
    this.sounds.victory.volume = 0.6;
    
    // Aliases - map to available sounds
    this.sounds.damage = this.sounds.attack;
    this.sounds.win = this.sounds.victory;
    this.sounds.lose = this.sounds.victory;
    
    // These sounds aren't available yet - silent placeholders
    // They won't throw errors but won't play anything
    this.sounds.select = null;
    this.sounds.move = null;
    this.sounds.heal = null;
    this.sounds.bonus = null;
    this.sounds.warning = null;
    this.sounds.match = null;
    
    // Background music
    this.bgMusic = new Audio('/asset/sound/bg-loop-effect.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.3;
  }

  play(soundName) {
    if (!this.enabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode();
      clone.volume = sound.volume;
      clone.play().catch(() => {});
    }
    // Silently ignore sounds that aren't loaded
  }

  startBgMusic() {
    if (!this.enabled || this.bgMusicPlaying) return;
    
    this.bgMusicPending = true;
    
    const tryPlay = () => {
      if (!this.bgMusicPending || this.bgMusicPlaying) return;
      
      this.bgMusic.play().then(() => {
        this.bgMusicPlaying = true;
        this.bgMusicPending = false;
        console.log('🎵 Background music started');
      }).catch(() => {
        // Will retry on next user interaction
      });
    };
    
    // Try immediately
    tryPlay();
    
    // Also set up listeners for user interaction (for autoplay policy)
    const onInteraction = () => {
      tryPlay();
      if (this.bgMusicPlaying) {
        document.removeEventListener('click', onInteraction);
        document.removeEventListener('touchstart', onInteraction);
        document.removeEventListener('keydown', onInteraction);
      }
    };
    
    document.addEventListener('click', onInteraction);
    document.addEventListener('touchstart', onInteraction);
    document.addEventListener('keydown', onInteraction);
  }

  stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
      this.bgMusicPlaying = false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBgMusic();
    }
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgMusic();
    }
  }

  setBgMusicVolume(volume) {
    if (this.bgMusic) {
      this.bgMusic.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Export for use in other modules
window.SoundManager = SoundManager;

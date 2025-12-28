// SoundManager - Handles audio (placeholder for future implementation)

class SoundManager {
  constructor() {
    this.enabled = true;
    this.sounds = {};
  }

  play(soundName) {
    if (!this.enabled) return;
    console.log(`🔊 Sound: ${soundName}`);
    // TODO: Play actual audio when sound files are added
    // if (this.sounds[soundName]) {
    //   this.sounds[soundName].currentTime = 0;
    //   this.sounds[soundName].play();
    // }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Load sound files (for future use)
  load(name, url) {
    // const audio = new Audio(url);
    // this.sounds[name] = audio;
  }
}

// Export for use in other modules
window.SoundManager = SoundManager;

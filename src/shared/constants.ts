// Game constants
export const BOARD_WIDTH = 7;
export const BOARD_HEIGHT = 5;

export const INITIAL_HP = 100;
export const INITIAL_ATTACK = 10;
export const INITIAL_DEFENSE = 5;

export const MATCH_MIN_LENGTH = 3;
export const CHARGE_MAX = 6;

// Turn timer
export const TURN_TIME_MS = 30000; // 30 seconds
export const TURN_WARNING_MS = 10000; // Warning at 10 seconds left
export const MAX_AFK_COUNT = 2;

// Damage constants
export const BASE_DAMAGE_PER_ORB = 5;
export const HEAL_PER_ORB = 3;

// Moves per turn
export const MOVES_PER_TURN = 2;
export const BONUS_MOVE_THRESHOLD = 4; // Match 4+ orbs = +1 move

export const ORB_TYPES = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL'] as const;

export const ELEMENTS = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK'] as const;

export const GAME_PHASES = ['WAITING', 'PLAYING', 'RESOLVING', 'END'] as const;

// Monster definitions
export const MONSTERS = [
  {
    id: 'assassin_dark',
    name: 'Assassin',
    element: 'DARK' as const,
    hp: 100,
    attack: 14,
    defense: 4,
    spriteFolder: 'assassin_dark',
    hasDirections: true,
    skill: {
      id: 'shadow_strike',
      name: 'Shadow Strike',
      type: 'PASSIVE' as const,
      description: 'Dark orb damage +20%'
    }
  },
  {
    id: 'thug_fire',
    name: 'Thug',
    element: 'FIRE' as const,
    hp: 120,
    attack: 10,
    defense: 6,
    spriteFolder: 'thug_fire',
    hasDirections: true,
    skill: {
      id: 'brute_force',
      name: 'Brute Force',
      type: 'PASSIVE' as const,
      description: 'Fire orb damage +20%'
    }
  },
  {
    id: 'robber_light',
    name: 'Robber',
    element: 'LIGHT' as const,
    hp: 90,
    attack: 16,
    defense: 3,
    spriteFolder: 'robber_light',
    hasDirections: true,
    skill: {
      id: 'quick_hands',
      name: 'Quick Hands',
      type: 'PASSIVE' as const,
      description: 'Light orb damage +20%'
    }
  },
  {
    id: 'golem_green',
    name: 'Golem',
    element: 'GRASS' as const,
    hp: 150,
    attack: 8,
    defense: 10,
    spriteFolder: 'golem_green',
    hasDirections: false,
    skill: {
      id: 'stone_skin',
      name: 'Stone Skin',
      type: 'PASSIVE' as const,
      description: 'Grass orb damage +20%'
    }
  },
  {
    id: 'minotaur_blue',
    name: 'Minotaur',
    element: 'WATER' as const,
    hp: 130,
    attack: 12,
    defense: 7,
    spriteFolder: 'minotaur_blue',
    hasDirections: false,
    skill: {
      id: 'tidal_rage',
      name: 'Tidal Rage',
      type: 'PASSIVE' as const,
      description: 'Water orb damage +20%'
    }
  }
];

// Shared types for game logic

export type PlayerNumber = 'PLAYER_1' | 'PLAYER_2';

export type OrbType = 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK' | 'HEAL';

export type ElementType = 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK';

export interface Position {
  x: number;
  y: number;
}

export interface SwapMove {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Match {
  orbs: Position[];
  type: OrbType;
  count: number;
}

export interface GameMessage {
  type: string;
  payload: any;
}

export interface MonsterData {
  id: string;
  name: string;
  element: ElementType;
  hp: number;
  attack: number;
  defense: number;
  skill: SkillData;
}

export interface SkillData {
  id: string;
  name: string;
  type: 'ACTIVE' | 'PASSIVE';
  description: string;
}

export interface PlayerState {
  odlplayerId: string;
  odlplayerNumber: PlayerNumber;
  monsterId: string;
  monsterName: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  element: ElementType;
  charge: number;
  maxCharge: number;
  afkCount: number;
  skill: SkillData;
}

export interface ResolveResult {
  matches: Match[];
  totalDamage: number;
  chargeGained: number;
  cascadeCount: number;
  healAmount: number;
  orbsCleared: Position[];
}

// WebSocket message types
export type ServerMessageType =
  | 'CONNECTED'
  | 'WAITING_FOR_OPPONENT'
  | 'PLAYER_ASSIGNED'
  | 'GAME_START'
  | 'GAME_STATE_UPDATE'
  | 'TURN_START'
  | 'TURN_TIMEOUT_WARNING'
  | 'MOVE_RESULT'
  | 'GAME_END'
  | 'OPPONENT_DISCONNECTED'
  | 'ERROR';

export type ClientMessageType = 'MOVE';

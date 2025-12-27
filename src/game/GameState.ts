import { Board } from '../puzzle/Board';
import { CHARGE_MAX, MONSTERS, MOVES_PER_TURN } from '../shared/constants';
import { SeededRandom } from '../shared/rng';

export type GamePhase = 'WAITING' | 'PLAYING' | 'RESOLVING' | 'END';
export type PlayerNumber = 'PLAYER_1' | 'PLAYER_2';

export interface PlayerState {
  odlplayerId: string;
  odlplayerNumber: PlayerNumber;
  monsterId: string;
  monsterName: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  element: string;
  charge: number;
  maxCharge: number;
  afkCount: number;
  skill: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
}

export class GameState {
  public board: Board;
  public players: Map<PlayerNumber, PlayerState>;
  public currentTurn: PlayerNumber;
  public phase: GamePhase;
  public turnCount: number;
  public winner: PlayerNumber | null;
  public lastResolveResult: any | null;
  public movesRemaining: number;  // Moves left in current turn

  constructor(seed: number) {
    this.board = new Board(seed);

    // Randomly assign monsters to players
    const rng = new SeededRandom(seed);
    const shuffledMonsters = rng.shuffle([...MONSTERS]);

    this.players = new Map([
      ['PLAYER_1', this.createPlayerState('PLAYER_1', shuffledMonsters[0])],
      ['PLAYER_2', this.createPlayerState('PLAYER_2', shuffledMonsters[1])]
    ]);

    this.currentTurn = 'PLAYER_1';
    this.phase = 'WAITING';
    this.turnCount = 0;
    this.winner = null;
    this.lastResolveResult = null;
    this.movesRemaining = MOVES_PER_TURN;
  }

  private createPlayerState(playerNumber: PlayerNumber, monster: typeof MONSTERS[number]): PlayerState {
    return {
      odlplayerId: '',
      odlplayerNumber: playerNumber,
      monsterId: monster.id,
      monsterName: monster.name,
      hp: monster.hp,
      maxHp: monster.hp,
      attack: monster.attack,
      defense: monster.defense,
      element: monster.element,
      charge: 0,
      maxCharge: CHARGE_MAX,
      afkCount: 0,
      skill: { ...monster.skill }
    };
  }

  serialize() {
    return {
      board: this.board.serialize(),
      players: {
        PLAYER_1: this.players.get('PLAYER_1'),
        PLAYER_2: this.players.get('PLAYER_2')
      },
      currentTurn: this.currentTurn,
      phase: this.phase,
      turnCount: this.turnCount,
      winner: this.winner,
      lastResolveResult: this.lastResolveResult,
      movesRemaining: this.movesRemaining
    };
  }

  getOpponent(player: PlayerNumber): PlayerNumber {
    return player === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  }

  switchTurn() {
    this.currentTurn = this.getOpponent(this.currentTurn);
    this.turnCount++;
    this.movesRemaining = MOVES_PER_TURN; // Reset moves for new turn
  }

  // Use a move - returns true if turn should continue, false if turn ends
  useMove(bonusMoves: number = 0): boolean {
    this.movesRemaining = this.movesRemaining - 1 + bonusMoves;
    return this.movesRemaining > 0;
  }

  checkGameEnd(): boolean {
    const p1 = this.players.get('PLAYER_1')!;
    const p2 = this.players.get('PLAYER_2')!;

    if (p1.hp <= 0) {
      this.phase = 'END';
      this.winner = 'PLAYER_2';
      return true;
    }

    if (p2.hp <= 0) {
      this.phase = 'END';
      this.winner = 'PLAYER_1';
      return true;
    }

    return false;
  }
}

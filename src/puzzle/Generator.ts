import { OrbType } from './Board';
import { SeededRandom } from '../shared/rng';

export class Generator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generateOrb(): OrbType {
    const orbs: OrbType[] = ['FIRE', 'WATER', 'GRASS', 'LIGHT', 'DARK', 'HEAL'];
    const index = Math.floor(this.rng.next() * orbs.length);
    return orbs[index];
  }

  generateRow(width: number): OrbType[] {
    const row: OrbType[] = [];
    for (let i = 0; i < width; i++) {
      row.push(this.generateOrb());
    }
    return row;
  }
}

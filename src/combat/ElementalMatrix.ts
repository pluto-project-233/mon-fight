export type ElementType = 'FIRE' | 'WATER' | 'GRASS' | 'LIGHT' | 'DARK';

export class ElementalMatrix {
  private matrix: Map<string, number>;

  constructor() {
    this.matrix = new Map();
    this.initializeMatrix();
  }

  private initializeMatrix() {
    // Fire > Grass > Water > Fire (1.5x advantage, 0.67x disadvantage)
    this.matrix.set('FIRE:GRASS', 1.5);
    this.matrix.set('GRASS:FIRE', 0.67);

    this.matrix.set('GRASS:WATER', 1.5);
    this.matrix.set('WATER:GRASS', 0.67);

    this.matrix.set('WATER:FIRE', 1.5);
    this.matrix.set('FIRE:WATER', 0.67);

    // Light and Dark: 1.3x to all other elements
    const otherElements: ElementType[] = ['FIRE', 'WATER', 'GRASS'];
    for (const elem of otherElements) {
      this.matrix.set(`LIGHT:${elem}`, 1.3);
      this.matrix.set(`DARK:${elem}`, 1.3);
    }

    // Light <> Dark: 1.5x to each other
    this.matrix.set('LIGHT:DARK', 1.5);
    this.matrix.set('DARK:LIGHT', 1.5);
  }

  getMultiplier(attackerElement: string, defenderElement: string): number {
    if (attackerElement === defenderElement) return 1.0;
    const key = `${attackerElement}:${defenderElement}`;
    return this.matrix.get(key) || 1.0;
  }
}

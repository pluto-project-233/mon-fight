import { ElementalMatrix } from './ElementalMatrix';
import { Match } from '../puzzle/Matcher';
import { OrbType } from '../puzzle/Board';
import { BASE_DAMAGE_PER_ORB, HEAL_PER_ORB } from '../shared/constants';

export interface DamageResult {
  totalDamage: number;
  healAmount: number;
  damageByElement: Map<string, number>;
}

export class DamageCalculator {
  private elementalMatrix: ElementalMatrix;

  constructor() {
    this.elementalMatrix = new ElementalMatrix();
  }

  calculateFromMatches(
    matches: Match[],
    attackerElement: string,
    defenderElement: string,
    attackStat: number,
    skillModifier: number = 1.0
  ): DamageResult {
    let totalDamage = 0;
    let healAmount = 0;
    const damageByElement = new Map<string, number>();

    for (const match of matches) {
      if (match.type === 'HEAL') {
        // HEAL orbs restore HP to the attacker
        healAmount += match.count * HEAL_PER_ORB;
      } else {
        // Calculate damage for this match
        const baseDamage = match.count * BASE_DAMAGE_PER_ORB;

        // Apply elemental multiplier based on orb type vs defender element
        const elementMultiplier = this.elementalMatrix.getMultiplier(
          match.type,
          defenderElement
        );

        // Apply attack stat scaling (base attack = 10, so /10 for multiplier)
        const attackMultiplier = attackStat / 10;

        const matchDamage = Math.floor(
          baseDamage * elementMultiplier * attackMultiplier * skillModifier
        );

        totalDamage += matchDamage;

        // Track damage by element
        const current = damageByElement.get(match.type) || 0;
        damageByElement.set(match.type, current + matchDamage);
      }
    }

    return { totalDamage, healAmount, damageByElement };
  }

  calculateDamage(
    baseDamage: number,
    attackerElement: string,
    defenderElement: string,
    skillModifier: number = 1.0
  ): number {
    const elementMultiplier = this.elementalMatrix.getMultiplier(
      attackerElement,
      defenderElement
    );

    return Math.floor(baseDamage * elementMultiplier * skillModifier);
  }
}

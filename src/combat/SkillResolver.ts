interface Skill {
  id: string;
  name: string;
  type: 'ACTIVE' | 'PASSIVE';
  trigger: 'ON_MATCH' | 'ON_ATTACK' | 'ON_DAMAGE' | 'START_TURN' | 'END_TURN';
  effect: any; // TODO: Define effect interface
}

export class SkillResolver {
  private skills: Map<string, Skill> = new Map();

  registerSkill(skill: Skill) {
    this.skills.set(skill.id, skill);
  }

  resolveSkill(skillId: string, context: any) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      console.warn(`Skill ${skillId} not found`);
      return;
    }

    // TODO: Implement skill resolution logic
    console.log(`Resolving skill: ${skill.name}`);
  }

  getTriggerSkills(trigger: Skill['trigger']): Skill[] {
    return Array.from(this.skills.values()).filter(
      skill => skill.trigger === trigger
    );
  }
}

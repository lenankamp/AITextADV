import { Character } from '../character.js';

class Monster extends Character {
    constructor(template) {
        super(template.name);
        this.level = template.level || 1;
        this.baseStats = template.stats;
        this.currentJob = 'monster';
        this.position = template.position || 'front';

        // Structure abilities to match Character class format
        const structuredAbilities = {};
        if (template.abilities) {
            Object.entries(template.abilities).forEach(([id, ability]) => {
                structuredAbilities[id] = {
                    ...ability,
                    id
                };
            });
        }

        this.jobs = {
            monster: {
                level: this.level,
                jp: 0,
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: structuredAbilities,
                    reaction: {},
                    support: {}
                }
            }
        };

        this.experience = template.experience || this.level * 50;
        this.loot = template.loot || [];
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };
    }

}

export { Monster };
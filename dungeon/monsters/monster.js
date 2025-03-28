import { Character } from '../character.js';

class Monster extends Character {
    constructor(template) {
        super(template.name);
        this.type = 'monster';
        this.level = template.level || 1;
        this.baseStats = template.stats;
        this.currentJob = 'monster';
        this.position = template.position || 'front';

        // Structure abilities to match Character class format with proper categorization
        const monsterAbilities = {
            active: {},
            reaction: {},
            support: {}
        };

        // Also track which abilities should be learned
        const learnedAbilities = {
            active: {},
            reaction: {},
            support: {}
        };

        if (template.abilities) {
            Object.entries(template.abilities).forEach(([id, ability]) => {
                const abilityType = ability.type || 'active';
                const category = 
                    (abilityType === 'physical' || abilityType === 'magical' || 
                     abilityType === 'healing' || abilityType === 'drain' || abilityType === 'buff') ? 'active' :
                    (abilityType === 'reaction') ? 'reaction' :
                    (abilityType === 'support') ? 'support' : 'active';

                monsterAbilities[category][id] = {
                    ...ability,
                    id,
                    type: abilityType,
                    power: ability.power || 1,
                    mp: ability.mp || 0,
                    ranged: ability.ranged || false
                };

                // Mark this ability as learned
                learnedAbilities[category][id] = true;
            });
        }

        // Initialize monster-specific job data
        this.jobs = {
            monster: {
                level: this.level,
                jp: 0,
                spentJp: 0,
                mastered: false,
                learnedAbilities: learnedAbilities
            }
        };

        this.experience = template.experience || this.level * 50;
        this.loot = template.loot || [];
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };

        // Cache monster abilities
        this._cachedJobData.set('monster', {
            abilities: monsterAbilities,
            baseStats: template.stats
        });
    }

    // Override to disable setting new secondary abilities for monsters
    setSecondaryActive() {
        return false;
    }

    // Override to disable setting new reaction abilities for monsters
    setReactionAbility() {
        return false;
    }

    // Override to disable setting new support abilities for monsters
    setSupportAbility() {
        return false;
    }

    getReactionAbility() {
        return null;
    }

    getSupportAbility() {
        return null;
    }
    

    // Override to return monster's predefined abilities
    getAvailableAbilities() {
        const monsterData = this._cachedJobData.get('monster');
        const jobData = this.jobs.monster;

        // Start with base abilities
        const abilities = {
            active: { ...this.baseAbilities.active },
            reaction: {},
            support: []
        };

        // Add monster's learned abilities
        if (monsterData?.abilities && jobData?.learnedAbilities) {
            // Add active abilities
            Object.entries(monsterData.abilities.active).forEach(([id, ability]) => {
                if (jobData.learnedAbilities.active[id]) {
                    abilities.active[id] = ability;
                }
            });

            // Add reaction abilities
            Object.entries(monsterData.abilities.reaction).forEach(([id, ability]) => {
                if (jobData.learnedAbilities.reaction[id]) {
                    abilities.reaction[id] = ability;
                }
            });

            // Add support abilities
            Object.entries(monsterData.abilities.support).forEach(([id, ability]) => {
                if (jobData.learnedAbilities.support[id]) {
                    abilities.support.push(ability);
                }
            });
        }

        return abilities;
    }
}

export { Monster };
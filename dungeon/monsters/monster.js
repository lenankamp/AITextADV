import { CHARACTER } from '../character.js';

class MONSTER extends CHARACTER {
    constructor(template) {
        super(template.name);
        this.type = 'monster'; // Override type
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

        // Initialize monster-specific job data
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

        // Cache monster abilities
        this._cachedJobData.set('monster', {
            abilities: {
                active: structuredAbilities,
                reaction: {},
                support: {}
            },
            baseStats: template.stats
        });
    }

    // Override to disable secondary abilities for monsters
    setSecondaryActive() {
        return false;
    }

    // Override to disable reaction abilities for monsters
    setReactionAbility() {
        return false;
    }

    // Override to disable support abilities for monsters
    setSupportAbility() {
        return false;
    }

    // Override to return only monster's core abilities
    getAvailableAbilities() {
        const monsterData = this._cachedJobData.get('monster');
        return {
            active: monsterData?.abilities?.active || {},
            reaction: {},
            support: []
        };
    }
}

export { MONSTER };
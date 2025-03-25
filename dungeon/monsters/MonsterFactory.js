import { MONSTER } from './Monster.js';

// Monster template definitions
const MonsterTemplates = {
    goblin: {
        name: 'Goblin',
        stats: {
            hp: 50,
            mp: 20,
            pa: 8,
            ma: 4,
            sp: 6,
            ev: 5
        },
        abilities: {
            ATTACK: {
                name: 'Attack',
                type: 'physical',
                power: 1,
                description: 'Basic attack'
            },
            THROW_ROCK: {
                name: 'Throw Rock',
                type: 'physical',
                power: 0.8,
                ranged: true,
                mp: 0,
                description: 'Throws a rock at the target'
            }
        },
        position: 'front'
    },

    archer_goblin: {
        name: 'Goblin Archer',
        stats: {
            hp: 45,
            mp: 25,
            pa: 7,
            ma: 4,
            sp: 8,
            ev: 7
        },
        abilities: {
            ATTACK: {
                name: 'Attack',
                type: 'physical',
                power: 1,
                ranged: true,
                description: 'Bow attack'
            },
            QUICK_SHOT: {
                name: 'Quick Shot',
                type: 'physical',
                power: 0.7,
                ranged: true,
                mp: 5,
                description: 'Rapid bow attack with chance to act again'
            }
        },
        position: 'back'
    },

    dark_mage: {
        name: 'Dark Mage',
        stats: {
            hp: 40,
            mp: 45,
            pa: 4,
            ma: 9,
            sp: 5,
            ev: 4
        },
        abilities: {
            ATTACK: {
                name: 'Attack',
                type: 'physical',
                power: 0.8,
                description: 'Staff strike'
            },
            DARK_BOLT: {
                name: 'Dark Bolt',
                type: 'magical',
                power: 1.2,
                mp: 8,
                description: 'Dark elemental attack'
            },
            WEAKEN: {
                name: 'Weaken',
                type: 'status',
                mp: 12,
                effect: 'attack_down',
                duration: 3,
                description: 'Reduces target\'s physical attack'
            }
        },
        position: 'back'
    },

    orc: {
        name: 'Orc',
        stats: {
            hp: 75,
            mp: 15,
            pa: 10,
            ma: 3,
            sp: 4,
            ev: 3
        },
        abilities: {
            ATTACK: {
                name: 'Attack',
                type: 'physical',
                power: 1.2,
                description: 'Strong melee attack'
            },
            BATTLE_CRY: {
                name: 'Battle Cry',
                type: 'buff',
                mp: 10,
                effect: 'attack_up',
                duration: 3,
                aoe: true,
                description: 'Increases physical attack of all allies'
            }
        },
        position: 'front'
    }
};

// Monster template factory
class MONSTERFACTORY {
    static createMonster(type, level = 1) {
        const template = MonsterTemplates[type];
        if (!template) {
            throw new Error(`Monster type ${type} not found`);
        }

        // Deep clone the template to avoid mutations
        const monsterTemplate = {
            ...template,
            level,
            stats: { ...template.stats }
        };

        // Deep clone abilities and ensure proper structure
        if (template.abilities) {
            monsterTemplate.abilities = {};
            Object.entries(template.abilities).forEach(([id, ability]) => {
                monsterTemplate.abilities[id] = {
                    ...ability,
                    id,
                    type: ability.type || 'physical', // Default to physical if not specified
                    power: ability.power || 1,
                    mp: ability.mp || 0,
                    ranged: ability.ranged || false
                };
            });
        }

        // Scale stats based on level
        if (level > 1) {
            const scaling = (level - 1) * 0.1; // 10% increase per level
            Object.keys(monsterTemplate.stats).forEach(stat => {
                monsterTemplate.stats[stat] = Math.floor(monsterTemplate.stats[stat] * (1 + scaling));
            });
        }

        return new MONSTER(monsterTemplate);
    }
}

export { MONSTERFACTORY, MonsterTemplates };
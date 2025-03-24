import { JobInterface } from './JobInterface.js';
import { JOBS } from '../jobs.js';

export class Knight extends JobInterface {
    static getDescription() {
        return "Elite warriors trained in the arts of sword and shield. Masters of defense who can protect allies and withstand powerful attacks. Their ability to cover for allies and maintain defensive formations makes them essential frontline fighters and protectors.";
    }

    static getBaseStats() {
        return {
            hp: 120,
            mp: 40,
            pa: 10,
            ma: 4,
            sp: 6,
            ev: 4
        };
    }

    static getGrowthRates() {
        return {
            hp: 40,
            mp: 5,
            pa: 0.5,
            ma: 0.1,
            sp: 0.2,
            ev: 0.1
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Arts of War',
                abilities: {
                    SLASH_BLADE: {
                        name: 'Slash Blade',
                        type: 'physical',
                        power: 2.0,
                        mp: 15,
                        jpCost: 200,
                        description: 'Basic powerful sword attack'
                    },
                    BREAK_ARMOR: {
                        name: 'Break Armor',
                        type: 'physical',
                        power: 1.2,
                        effect: 'defense_down',
                        mp: 18,
                        jpCost: 250,
                        description: 'Reduces target defense'
                    },
                    SHIELD_BASH: {
                        name: 'Shield Bash',
                        type: 'physical',
                        power: 1.4,
                        effect: 'stun',
                        mp: 20,
                        jpCost: 300,
                        description: 'Shield attack that may stun target'
                    },
                    COVER: {
                        name: 'Cover',
                        type: 'support',
                        effect: 'protect_ally',
                        mp: 25,
                        jpCost: 400,
                        description: 'Take damage in place of an ally'
                    },
                    HOLY_BLADE: {
                        name: 'Holy Blade',
                        type: 'physical',
                        element: 'holy',
                        power: 2.2,
                        mp: 28,
                        jpCost: 450,
                        description: 'Holy-aspected sword attack'
                    },
                    SENTINEL: {
                        name: 'Sentinel',
                        type: 'support',
                        effect: ['defense_up', 'provoke'],
                        mp: 30,
                        jpCost: 500,
                        description: 'Greatly increase defense and draw attacks'
                    },
                    DEFENSIVE_STANCE: {
                        name: 'Defensive Stance',
                        type: 'support',
                        effect: ['physical_immunity', 'move_down'],
                        mp: 35,
                        jpCost: 600,
                        description: 'Become immobile but immune to physical damage'
                    },
                    MIGHTY_GUARD: {
                        name: 'Mighty Guard',
                        type: 'support',
                        effect: ['protect', 'shell'],
                        aoe: true,
                        target: 'allies',
                        mp: 45,
                        jpCost: 700,
                        description: 'Grant protective barriers to all allies'
                    },
                    SWORD_BREAK: {
                        name: 'Sword Break',
                        type: 'physical',
                        power: 1.8,
                        effect: 'disarm',
                        mp: 32,
                        jpCost: 550,
                        description: 'Attack that may disarm the target'
                    },
                    DIVINE_GUARD: {
                        name: 'Divine Guard',
                        type: 'support',
                        effect: ['regen', 'protect', 'shell'],
                        mp: 50,
                        jpCost: 800,
                        description: 'Ultimate defensive technique with regeneration'
                    }
                }
            },
            reaction: {
                PARRY: {
                    name: 'Parry',
                    chance: 0.35,
                    effect: 'reduce_physical_damage',
                    jpCost: 400,
                    description: 'Chance to reduce physical damage'
                },
                DEFENSE_BOOST: {
                    name: 'Defense Boost',
                    chance: 0.3,
                    effect: 'increase_defense',
                    jpCost: 450,
                    description: 'Chance to increase defense when hit'
                }
            },
            support: {
                EQUIP_SHIELD: {
                    name: 'Equip Shield',
                    effect: 'enable_shield',
                    jpCost: 300,
                    description: 'Allows equipping of shields'
                },
                DEFENSE_MASTERY: {
                    name: 'Defense Mastery',
                    effect: 'defense_up',
                    jpCost: 400,
                    description: 'Passive increase to defense'
                },
                STONESKIN: {
                    name: 'Stoneskin',
                    effect: 'damage_reduction',
                    jpCost: 600,
                    description: 'Reduces all damage taken'
                },
                WEAPON_GUARD: {
                    name: 'Weapon Guard',
                    effect: 'weapon_block',
                    jpCost: 500,
                    description: 'Chance to block with equipped weapon'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.SQUIRE]: 2
        };
    }
}
import { JobInterface } from './JobInterface.js';
import { JOBS } from '../jobs.js';

export class Dragoon extends JobInterface {
    static getDescription() {
        return "Masters of aerial combat and verticality. Specializing in powerful jump attacks and mobility options, they excel at traversing difficult terrain and attacking from above. Their abilities to breach vertical barriers and scout from high vantage points make them invaluable for exploration.";
    }

    static getBaseStats() {
        return {
            hp: 115,
            mp: 50,
            pa: 10,
            ma: 5,
            sp: 9,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 38,
            mp: 10,
            pa: 0.5,
            ma: 0.2,
            sp: 0.4,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Jump',
                abilities: {
                    JUMP: {
                        name: 'Jump',
                        type: 'physical',
                        power: 2.0,
                        charge: 1,
                        mp: 12,
                        jpCost: 200,
                        description: 'Basic jumping attack with height-based bonus'
                    },
                    LANCET: {
                        name: 'Lancet',
                        type: 'drain',
                        power: 1.0,
                        mp: 8,
                        jpCost: 200,
                        description: 'Drain HP and MP from target'
                    },
                    HIGH_JUMP: {
                        name: 'High Jump',
                        type: 'physical',
                        power: 2.8,
                        charge: 2,
                        mp: 20,
                        jpCost: 400,
                        description: 'Powerful jump with longer charge time'
                    },
                    AERIAL_SURVEY: {
                        name: 'Aerial Survey',
                        type: 'dungeon',
                        effect: 'reveal_high_areas',
                        mp: 15,
                        jpCost: 300,
                        description: 'Scout high areas and upper floors'
                    },
                    BREACH: {
                        name: 'Breach',
                        type: 'dungeon',
                        effect: 'break_ceiling',
                        mp: 28,
                        jpCost: 450,
                        description: 'Break through weakened ceilings to new areas'
                    },
                    VERTICAL_PATH: {
                        name: 'Vertical Path',
                        type: 'dungeon',
                        effect: 'find_vertical_route',
                        mp: 22,
                        jpCost: 350,
                        description: 'Find paths between floor levels'
                    },
                    SWEEP_DIVE: {
                        name: 'Sweep Dive',
                        type: 'physical',
                        power: 1.8,
                        aoe: true,
                        mp: 25,
                        jpCost: 500,
                        description: 'Area-of-effect diving attack'
                    },
                    DRAGON_BREATH: {
                        name: 'Dragon Breath',
                        type: 'magical',
                        element: 'dragon',
                        power: 2.2,
                        mp: 16,
                        jpCost: 400,
                        description: 'Channel dragon energy in cone attack'
                    },
                    PIERCING_STRIKE: {
                        name: 'Piercing Strike',
                        type: 'physical',
                        power: 2.0,
                        effect: 'armor_pierce',
                        mp: 22,
                        jpCost: 400,
                        description: 'Ignore portion of enemy defense'
                    },
                    GEIRSKOGUL: {
                        name: 'Geirskogul',
                        type: 'physical',
                        power: 3.2,
                        element: 'dragon',
                        aoe: true,
                        mp: 45,
                        jpCost: 800,
                        description: 'Ultimate dragoon technique'
                    }
                }
            },
            reaction: {
                DRAGON_SPIRIT: {
                    name: 'Dragon Spirit',
                    chance: 0.3,
                    effect: 'nullify_air_damage',
                    jpCost: 400,
                    description: 'Chance to nullify damage while airborne'
                },
                AERIAL_RECOVERY: {
                    name: 'Aerial Recovery',
                    chance: 0.35,
                    effect: 'recover_fall',
                    jpCost: 350,
                    description: 'Chance to recover from falling damage'
                }
            },
            support: {
                DRAGON_MIGHT: {
                    name: 'Dragon Might',
                    effect: 'jump_damage_up',
                    jpCost: 500,
                    description: 'Increase jump attack damage'
                },
                SURE_LANDING: {
                    name: 'Sure Landing',
                    effect: 'safe_landing',
                    jpCost: 300,
                    description: 'Always land safely from jumps'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.THIEF]: 3
        };
    }
}
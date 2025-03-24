import { JobInterface } from './JobInterface.js';
import { JOBS } from '../jobs.js';

export class Samurai extends JobInterface {
    static getBaseStats() {
        return {
            hp: 125,
            mp: 70,
            pa: 11,
            ma: 7,
            sp: 7,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 42,
            mp: 15,
            pa: 0.5,
            ma: 0.3,
            sp: 0.3,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Draw Out',
                abilities: {
                    IAIDO: {
                        name: 'Iaido',
                        type: 'physical',
                        power: 2.4,
                        mp: 20,
                        jpCost: 300,
                        description: 'Quick-draw technique with high accuracy'
                    },
                    BLADE_SPIRIT: {
                        name: 'Blade Spirit',
                        type: 'physical',
                        power: 1.8,
                        aoe: true,
                        mp: 25,
                        jpCost: 400,
                        description: 'Area attack that releases sword energy'
                    },
                    STORM_EDGE: {
                        name: 'Storm Edge',
                        type: 'physical',
                        element: 'wind',
                        power: 2.2,
                        mp: 22,
                        jpCost: 350
                    },
                    DEMON_SLICE: {
                        name: 'Demon Slice',
                        type: 'physical',
                        power: 2.6,
                        effect: 'defense_down',
                        mp: 28,
                        jpCost: 450
                    },
                    ZEN_SLASH: {
                        name: 'Zen Slash',
                        type: 'physical',
                        power: 2.8,
                        effect: 'ignore_defense',
                        mp: 35,
                        jpCost: 500
                    },
                    SOUL_BLADE: {
                        name: 'Soul Blade',
                        type: 'physical',
                        element: 'spirit',
                        power: 2.5,
                        effect: 'spirit_drain',
                        mp: 32,
                        jpCost: 450,
                        description: 'Sword technique that drains spiritual energy'
                    },
                    MEDITATION: {
                        name: 'Meditation',
                        type: 'support',
                        effect: ['attack_up', 'accuracy_up'],
                        mp: 25,
                        jpCost: 400,
                        description: 'Focus mind to enhance combat abilities'
                    },
                    BLADE_WARD: {
                        name: 'Blade Ward',
                        type: 'support',
                        effect: 'blade_barrier',
                        mp: 30,
                        jpCost: 500,
                        description: 'Create defensive barrier of spinning blades'
                    },
                    BINDING_BLADE: {
                        name: 'Binding Blade',
                        type: 'physical',
                        power: 2.0,
                        effect: 'stop',
                        mp: 30,
                        jpCost: 400
                    },
                    MASAMUNE: {
                        name: 'Masamune',
                        type: 'physical',
                        power: 3.0,
                        effect: ['critical_up', 'haste'],
                        mp: 45,
                        jpCost: 600,
                        description: 'Ultimate sword technique with multiple effects'
                    }
                }
            },
            reaction: {
                THIRD_EYE: {
                    name: 'Third Eye',
                    chance: 0.35,
                    effect: 'anticipate_attack',
                    jpCost: 450,
                    description: 'Chance to completely avoid next physical attack'
                },
                RETRIBUTION: {
                    name: 'Retribution',
                    chance: 0.25,
                    effect: 'counter_with_power',
                    jpCost: 500,
                    description: 'Counter physical attacks with increased power'
                }
            },
            support: {
                KATANA_MASTERY: {
                    name: 'Katana Mastery',
                    effect: 'katana_damage_up',
                    jpCost: 500
                },
                INNER_PEACE: {
                    name: 'Double Handed',
                    effect: 'enable_two_hand',
                    jpCost: 600,
                    description: 'Allows wielding one-handed weapons in both hands for increased damage'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.KNIGHT]: 3,
            [JOBS.MONK]: 4,
            [JOBS.DRAGOON]: 2
        };
    }

    static getDescription() {
        return "Elite warriors who combine martial prowess with spiritual techniques. Masters of the blade who excel at powerful single-target attacks and tactical positioning. Capable of drawing out a weapon's spiritual energy for devastating effects.";
    }
}
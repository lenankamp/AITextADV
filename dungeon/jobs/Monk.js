import { JobInterface } from './JobInterface.js';
import { JOBS } from './constants.js';

export class Monk extends JobInterface {
    static getDescription() {
        return "Disciplined martial artists who channel inner energy into powerful combat techniques. Masters of unarmed combat who combine physical prowess with spiritual power. Their meditation abilities and powerful strikes make them excellent frontline fighters who can sustain themselves through inner strength.";
    }

    static getBaseStats() {
        return {
            hp: 130,
            mp: 40,
            pa: 11,
            ma: 5,
            sp: 8,
            ev: 7
        };
    }

    static getGrowthRates() {
        return {
            hp: 45,
            mp: 8,
            pa: 0.6,
            ma: 0.2,
            sp: 0.3,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Martial Arts',
                abilities: {
                    CHAKRA: {
                        name: 'Chakra',
                        type: 'healing',
                        power: 1.5,
                        target: 'self',
                        mp: 0,
                        jpCost: 200,
                        description: 'Restore HP through meditation'
                    },
                    PUMMEL: {
                        name: 'Pummel',
                        type: 'physical',
                        power: 1.2,
                        hits: 3,
                        mp: 0,
                        jpCost: 300,
                        description: 'Strike multiple times with bare hands'
                    },
                    EARTH_SLASH: {
                        name: 'Earth Slash',
                        type: 'physical',
                        element: 'earth',
                        power: 2.0,
                        mp: 0,
                        jpCost: 400,
                        description: 'Channel earth energy into an attack'
                    },
                    INTERNAL_RELEASE: {
                        name: 'Internal Release',
                        type: 'support',
                        effect: { pa: 1.5, sp: 1.3 },
                        mp: 15,
                        jpCost: 450,
                        description: 'Release inner power to enhance abilities'
                    },
                    MEDITATION: {
                        name: 'Meditation',
                        type: 'support',
                        effect: ['hp_regen', 'mp_regen'],
                        target: 'self',
                        mp: 20,
                        jpCost: 350,
                        description: 'Meditate to regenerate HP and MP over time'
                    },
                    PRESSURE_POINT: {
                        name: 'Pressure Point',
                        type: 'status',
                        effect: 'paralyze',
                        mp: 18,
                        jpCost: 400,
                        description: 'Strike vital points to paralyze target'
                    },
                    SPIRIT_BLADE: {
                        name: 'Spirit Blade',
                        type: 'physical',
                        power: 2.2,
                        element: 'holy',
                        mp: 25,
                        jpCost: 450,
                        description: 'Infuse attacks with spiritual energy'
                    },
                    CHAKRA_BLAST: {
                        name: 'Chakra Blast',
                        type: 'magical',
                        power: 2.4,
                        mp: 30,
                        jpCost: 500,
                        description: 'Release concentrated spiritual energy'
                    },
                    MANTRA: {
                        name: 'Mantra',
                        type: 'support',
                        effect: ['protect', 'shell'],
                        aoe: true,
                        mp: 35,
                        jpCost: 550,
                        description: 'Project spiritual barrier around allies'
                    },
                    HUNDRED_FISTS: {
                        name: 'Hundred Fists',
                        type: 'physical',
                        power: 0.5,
                        hits: 10,
                        mp: 45,
                        jpCost: 800,
                        description: 'Ultimate martial arts technique'
                    }
                }
            },
            reaction: {
                COUNTER: {
                    name: 'Counter',
                    chance: 0.4,
                    power: 1.0,
                    jpCost: 300,
                    description: 'Counter physical attacks'
                },
                INNER_STRENGTH: {
                    name: 'Inner Strength',
                    chance: 0.35,
                    effect: 'hp_restore',
                    jpCost: 400,
                    description: 'Chance to restore HP when damaged'
                },
            },
            support: {
                BRAWLER: {
                    name: 'Brawler',
                    effect: 'unarmed_damage_up',
                    jpCost: 500,
                    description: 'Increase unarmed combat damage'
                },
                MARTIAL_MASTERY: {
                    name: 'Martial Mastery',
                    effect: 'improve_martial_arts',
                    jpCost: 600,
                    description: 'Enhance all martial arts abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.KNIGHT]: 2
        };
    }
}
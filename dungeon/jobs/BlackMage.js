import { JobInterface, JOBS } from './index.js';

export class BlackMage extends JobInterface {
    static getDescription() {
        return "Powerful spellcasters specializing in destructive elemental magic. Masters of offensive magic who can devastate enemies with fire, ice, and lightning. Their magical prowess allows them to break through enemy defenses and exploit elemental weaknesses. In dungeons, they excel at detecting and dispelling magical barriers, analyzing magical anomalies, and dealing with supernatural threats.";
    }

    static getBaseStats() {
        return {
            hp: 80,
            mp: 100,
            pa: 4,
            ma: 12,
            sp: 6,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 20,
            mp: 25,
            pa: 0.1,
            ma: 0.6,
            sp: 0.2,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Black Magic',
                abilities: {
                    FIRE: {
                        name: 'Fire',
                        type: 'magical',
                        element: 'fire',
                        power: 1.8,
                        mp: 16,
                        jpCost: 200
                    },
                    FIRA: {
                        name: 'Fira',
                        type: 'magical',
                        element: 'fire',
                        power: 2.4,
                        mp: 24,
                        jpCost: 400
                    },
                    FIRAGA: {
                        name: 'Firaga',
                        type: 'magical',
                        element: 'fire',
                        power: 3.0,
                        aoe: true,
                        mp: 48,
                        jpCost: 600
                    },
                    THUNDER: {
                        name: 'Thunder',
                        type: 'magical',
                        element: 'lightning',
                        power: 1.9,
                        mp: 18,
                        jpCost: 200
                    },
                    THUNDARA: {
                        name: 'Thundara',
                        type: 'magical',
                        element: 'lightning',
                        power: 2.5,
                        mp: 26,
                        jpCost: 400
                    },
                    THUNDAGA: {
                        name: 'Thundaga',
                        type: 'magical',
                        element: 'lightning',
                        power: 3.1,
                        aoe: true,
                        mp: 50,
                        jpCost: 600
                    },
                    BLIZZARD: {
                        name: 'Blizzard',
                        type: 'magical',
                        element: 'ice',
                        power: 1.7,
                        mp: 14,
                        jpCost: 200
                    },
                    BLIZZARA: {
                        name: 'Blizzara',
                        type: 'magical',
                        element: 'ice',
                        power: 2.3,
                        mp: 22,
                        jpCost: 400
                    },
                    BLIZZAGA: {
                        name: 'Blizzaga',
                        type: 'magical',
                        element: 'ice',
                        power: 2.9,
                        aoe: true,
                        mp: 46,
                        jpCost: 600
                    },
                    BREAK: {
                        name: 'Break',
                        type: 'status',
                        effect: 'petrify',
                        mp: 30,
                        jpCost: 450
                    },
                    DEATH: {
                        name: 'Death',
                        type: 'status',
                        effect: 'instant_death',
                        mp: 40,
                        jpCost: 750
                    },
                    FLARE: {
                        name: 'Flare',
                        type: 'magical',
                        element: 'non-elemental',
                        power: 3.5,
                        mp: 60,
                        jpCost: 900,
                        description: 'Ultimate single-target damage spell'
                    },
                    ARCANE_DISRUPTION: {
                        name: 'Arcane Disruption',
                        type: 'dungeon',
                        effect: ['detect_magic', 'dispel_field'],
                        aoe: true,
                        mp: 35,
                        jpCost: 450,
                        description: 'Detect and dispel magical effects in an area'
                    },
                    ARCANE_EYE: {
                        name: 'Arcane Eye',
                        type: 'dungeon',
                        effect: ['detect_magical_traps', 'analyze_curses'],
                        mp: 15,
                        jpCost: 200,
                        description: 'Reveals magical traps and analyzes curses'
                    }
                }
            },
            reaction: {
                MAGIC_SHIELD: {
                    name: 'Magic Shield',
                    chance: 0.3,
                    effect: 'shell',
                    jpCost: 400,
                    description: 'Chance to reduce incoming magical damage'
                },
                SPELL_RETURN: {
                    name: 'Spell Return',
                    chance: 0.2,
                    effect: 'reflect',
                    jpCost: 500,
                    description: 'Chance to reflect magical attacks'
                }
            },
            support: {
                MAGIC_BOOST: {
                    name: 'Magic Boost',
                    effect: 'increase_magic_power',
                    jpCost: 500,
                    description: 'Increases magical damage'
                },
                DUAL_CAST: {
                    name: 'Dual Cast',
                    effect: 'cast_twice',
                    jpCost: 999,
                    description: 'Cast two spells in one turn'
                },
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Chemist]: 2
        };
    }
}
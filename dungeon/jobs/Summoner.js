import { JobInterface } from './JobInterface.js';
import { JOBS } from './constants.js';

export class Summoner extends JobInterface {
    static getDescription() {
        return "Masters of summoning magic who call forth powerful beings from other realms. Specialists in devastating area-of-effect damage and versatile elemental coverage through their various summons. Critical for dealing with powerful threats and providing strategic options through diverse summon effects.";
    }

    static getBaseStats() {
        return {
            hp: 90,
            mp: 110,
            pa: 6,
            ma: 12,
            sp: 6,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 30,
            mp: 40,
            pa: 0.2,
            ma: 0.6,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Summon Magic',
                abilities: {
                    IFRIT: {
                        name: 'Ifrit',
                        type: 'magical',
                        element: 'fire',
                        power: 2.8,
                        aoe: true,
                        mp: 32,
                        jpCost: 400,
                        description: 'Summon fire elemental for massive damage'
                    },
                    SHIVA: {
                        name: 'Shiva',
                        type: 'magical',
                        element: 'ice',
                        power: 2.6,
                        effect: 'slow',
                        aoe: true,
                        mp: 30,
                        jpCost: 400,
                        description: 'Summon ice queen for damage and slow'
                    },
                    RAMUH: {
                        name: 'Ramuh',
                        type: 'magical',
                        element: 'lightning',
                        power: 2.7,
                        effect: 'paralyze',
                        aoe: true,
                        mp: 34,
                        jpCost: 400,
                        description: 'Summon thunder god for lightning assault'
                    },
                    BAHAMUT: {
                        name: 'Bahamut',
                        type: 'magical',
                        element: 'non-elemental',
                        power: 3.2,
                        aoe: true,
                        mp: 45,
                        jpCost: 800,
                        description: 'Summon dragon king for ultimate destruction'
                    },
                    CARBUNCLE: {
                        name: 'Carbuncle',
                        type: 'support',
                        effect: 'reflect',
                        aoe: true,
                        mp: 28,
                        jpCost: 300,
                        description: 'Summon mystic beast for party reflection'
                    },
                    TITAN: {
                        name: 'Titan',
                        type: 'magical',
                        element: 'earth',
                        power: 2.5,
                        effect: 'stun',
                        aoe: true,
                        mp: 35,
                        jpCost: 450,
                        description: 'Summon earth giant for ground-shaking attack'
                    },
                    LEVIATHAN: {
                        name: 'Leviathan',
                        type: 'magical',
                        element: 'water',
                        power: 3.0,
                        effect: 'drown',
                        aoe: true,
                        mp: 40,
                        jpCost: 600,
                        description: 'Summon sea serpent for tidal wave'
                    },
                    PHOENIX: {
                        name: 'Phoenix',
                        type: 'magical',
                        element: 'fire',
                        power: 2.4,
                        effect: 'party_raise',
                        aoe: true,
                        mp: 50,
                        jpCost: 800,
                        description: 'Summon immortal bird for revival'
                    },
                    ODIN: {
                        name: 'Odin',
                        type: 'magical',
                        element: 'non-elemental',
                        power: 3.5,
                        effect: 'instant_death',
                        mp: 45,
                        jpCost: 750,
                        description: 'Summon warrior king for devastating strike'
                    },
                    MOOGLE: {
                        name: 'Moogle',
                        type: 'healing',
                        effect: 'party_heal',
                        power: 1.5,
                        aoe: true,
                        mp: 22,
                        jpCost: 250,
                        description: 'Summon helpful moogle for party healing'
                    }
                }
            },
            reaction: {
                SUMMON_BOOST: {
                    name: 'Summon Boost',
                    chance: 0.3,
                    effect: 'enhance_next_summon',
                    jpCost: 400,
                    description: 'Chance to enhance next summon\'s power'
                },
                EIDOLON_SHIELD: {
                    name: 'Eidolon Shield',
                    chance: 0.25,
                    effect: 'summon_barrier',
                    jpCost: 500,
                    description: 'Chance to summon protective barrier when hit'
                }
            },
            support: {
                SUMMON_MASTERY: {
                    name: 'Summon Mastery',
                    effect: 'reduce_summon_mp_cost',
                    jpCost: 600,
                    description: 'Reduces MP cost of summons'
                },
                EIDOLON_BOND: {
                    name: 'Eidolon Bond',
                    effect: 'enhance_summons',
                    jpCost: 450,
                    description: 'Strengthens summoned creatures'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.BLACK_MAGE]: 4,
            [JOBS.TIME_MAGE]: 3,
            [JOBS.ORACLE]: 2
        };
    }
}
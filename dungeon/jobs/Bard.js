import { JobInterface } from './JobInterface.js';
import { JOBS } from '../jobs.js';

export class Bard extends JobInterface {
    static getDescription() {
        return "Musical specialists who empower allies and weaken foes through magical songs. Their varied repertoire includes defensive chants, restorative melodies, and disruptive harmonies. While their direct combat abilities are limited, their party-wide support capabilities and ability to inflict status effects make them invaluable strategists.";
    }

    static getBaseStats() {
        return {
            hp: 85,
            mp: 85,
            pa: 6,
            ma: 9,
            sp: 8,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 25,
            pa: 0.2,
            ma: 0.45,
            sp: 0.4,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Songs',
                abilities: {
                    BATTLE_CHANT: {
                        name: 'Battle Chant',
                        type: 'support',
                        effect: 'defense_up',
                        aoe: true,
                        mp: 18,
                        jpCost: 200,
                        description: 'Increase party defense through song'
                    },
                    LIFE_SONG: {
                        name: 'Life Song',
                        type: 'healing',
                        effect: 'regen',
                        aoe: true,
                        mp: 22,
                        jpCost: 250,
                        description: 'Grant regeneration to party'
                    },
                    MANA_PAEAN: {
                        name: 'Mana Paean',
                        type: 'support',
                        effect: 'mp_regen',
                        aoe: true,
                        mp: 25,
                        jpCost: 300,
                        description: 'Grant MP regeneration to party'
                    },
                    HERO_BALLAD: {
                        name: 'Hero Ballad',
                        type: 'support',
                        effect: ['attack_up', 'defense_up'],
                        aoe: true,
                        mp: 35,
                        jpCost: 400,
                        description: 'Major boost to party combat stats'
                    },
                    SILENCE_SONG: {
                        name: 'Silence Song',
                        type: 'status',
                        effect: 'silence',
                        aoe: true,
                        mp: 28,
                        jpCost: 350,
                        description: 'Silence all enemies in range'
                    },
                    CONFUSION_CAROL: {
                        name: 'Confusion Carol',
                        type: 'status',
                        effect: 'confuse',
                        aoe: true,
                        mp: 30,
                        jpCost: 375,
                        description: 'Confuse enemies with discordant notes'
                    },
                    PEACEFUL_NOCTURNE: {
                        name: 'Peaceful Nocturne',
                        type: 'status',
                        effect: 'sleep',
                        aoe: true,
                        mp: 32,
                        jpCost: 400,
                        description: 'Put enemies to sleep with soothing melody'
                    },
                    NAMELESS_SONG: {
                        name: 'Nameless Song',
                        type: 'support',
                        effect: 'random_buff',
                        aoe: true,
                        mp: 20,
                        jpCost: 300,
                        description: 'Grant random positive effects to party'
                    },
                    DISSONANT_WAVE: {
                        name: 'Dissonant Wave',
                        type: 'magical',
                        power: 2.0,
                        element: 'sonic',
                        aoe: true,
                        mp: 32,
                        jpCost: 450,
                        description: 'Damage enemies with sonic waves'
                    },
                    GRAND_FINALE: {
                        name: 'Grand Finale',
                        type: 'magical',
                        power: 2.5,
                        effect: 'dispel_buffs',
                        aoe: true,
                        mp: 45,
                        jpCost: 500,
                        description: 'Powerful sonic attack that removes buffs'
                    }
                }
            },
            reaction: {
                PERFECT_PITCH: {
                    name: 'Perfect Pitch',
                    chance: 0.3,
                    effect: 'counter_with_song',
                    jpCost: 400,
                    description: 'Counter attacks with random song effect'
                },
                HARMONY_SHIELD: {
                    name: 'Harmony Shield',
                    chance: 0.35,
                    effect: 'reduce_magic_damage',
                    jpCost: 450,
                    description: 'Reduce incoming magical damage'
                }
            },
            support: {
                SONG_MASTERY: {
                    name: 'Song Mastery',
                    effect: 'extend_song_duration',
                    jpCost: 500,
                    description: 'Increase duration of song effects'
                },
                RESONANCE: {
                    name: 'Resonance',
                    effect: 'enhance_song_power',
                    jpCost: 450,
                    description: 'Increase potency of song effects'
                },
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.WHITE_MAGE]: 3,
            [JOBS.ORACLE]: 2,
            [JOBS.DANCER]: 2
        };
    }
}
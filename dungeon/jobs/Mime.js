import { JobInterface } from './JobInterface.js';
import { JOBS } from '../jobs.js';

export class Mime extends JobInterface {
    static getDescription() {
        return "Unique specialists who can perfectly replicate the abilities of others. Through their mastery of mimicry, they can copy and enhance both ally and enemy techniques, making them incredibly versatile but demanding to master. Their ability to adapt and utilize multiple skill types simultaneously makes them powerful but requires deep understanding of various combat styles.";
    }

    static getBaseStats() {
        return {
            hp: 110,
            mp: 90,
            pa: 8,
            ma: 8,
            sp: 8,
            ev: 7
        };
    }

    static getGrowthRates() {
        return {
            hp: 35,
            mp: 28,
            pa: 0.4,
            ma: 0.4,
            sp: 0.4,
            ev: 0.35
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Mimic',
                abilities: {
                    REPLICATE: {
                        name: 'Replicate',
                        type: 'special',
                        effect: 'copy_last_action',
                        mp: 'variable',
                        jpCost: 300,
                        description: 'Copies the last action performed by any character'
                    },
                    MIMIC_MASTERY: {
                        name: 'Mimic Mastery',
                        type: 'special',
                        effect: 'improved_copy',
                        mp: 'variable',
                        jpCost: 450,
                        description: 'Enhanced version of basic mimicry with increased power'
                    },
                    PERFECT_COPY: {
                        name: 'Perfect Copy',
                        type: 'special',
                        effect: 'exact_copy',
                        mp: 'original_cost',
                        jpCost: 600,
                        description: 'Creates an exact replica of the copied ability'
                    },
                    MIME_SEQUENCE: {
                        name: 'Mime Sequence',
                        type: 'special',
                        effect: 'repeat_action_sequence',
                        mp: 35,
                        jpCost: 500,
                        description: 'Repeats a sequence of previously used actions'
                    },
                    BATTLE_MEMORY: {
                        name: 'Battle Memory',
                        type: 'special',
                        effect: 'learn_enemy_skill',
                        mp: 40,
                        jpCost: 550,
                        description: 'Learn and store an enemy ability for later use'
                    },
                    TACTICAL_COPY: {
                        name: 'Tactical Copy',
                        type: 'special',
                        effect: 'copy_with_bonus',
                        mp: 'variable',
                        jpCost: 450,
                        description: 'Copy an ability with enhanced tactical effects'
                    },
                    MIMIC_FORM: {
                        name: 'Mimic Form',
                        type: 'special',
                        effect: 'copy_enemy_type',
                        mp: 40,
                        jpCost: 550,
                        description: 'Temporarily copies enemy type and resistances'
                    },
                    ABILITY_SYNTHESIS: {
                        name: 'Ability Synthesis',
                        type: 'special',
                        effect: 'combine_abilities',
                        mp: 45,
                        jpCost: 650,
                        description: 'Combine two copied abilities into a new effect'
                    },
                    PERFECT_MIMICRY: {
                        name: 'Perfect Mimicry',
                        type: 'special',
                        effect: ['copy_all_actions', 'enhanced_power'],
                        mp: 50,
                        jpCost: 800,
                        description: 'Copy all actions from last round with enhanced power'
                    }
                }
            },
            reaction: {
                ADAPTIVE_FORM: {
                    name: 'Adaptive Form',
                    chance: 0.2,
                    effect: 'adapt_to_damage_type',
                    jpCost: 500,
                    description: 'Temporarily gains resistance to damage type received'
                }
            },
            support: {
                EXPERIENCED_MIMIC: {
                    name: 'Experienced Mimic',
                    effect: 'improve_copy_accuracy',
                    jpCost: 450,
                    description: 'Increases accuracy of mimicked abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.SAMURAI]: 3,
            [JOBS.CALCULATOR]: 3,
            [JOBS.DANCER]: 2,
            [JOBS.BARD]: 2
        };
    }
}
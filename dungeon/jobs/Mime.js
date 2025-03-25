import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class MIME extends JOBINTERFACE {
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
                        mp: 'variable',
                        jpCost: 300,
                        description: 'Copies the last action performed by any character'
                    },
                    BATTLE_MEMORY: {
                        name: 'Battle Memory',
                        type: 'special',
                        mp: 40,
                        jpCost: 550,
                        description: 'Learn and store an enemy ability for later use'
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
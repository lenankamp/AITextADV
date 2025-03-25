import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class ORATOR extends JOBINTERFACE {
    static getDescription() {
        return "Masters of persuasion and rhetoric who can influence both allies and enemies through speech. Their unique abilities allow them to negotiate with enemies, boost party morale, and even convince foes to retreat or join their cause.";
    }

    static getBaseStats() {
        return {
            hp: 88,
            mp: 85,
            pa: 5,
            ma: 9,
            sp: 8,
            ev: 7
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 18,
            pa: 0.2,
            ma: 0.4,
            sp: 0.3,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Speechcraft',
                abilities: {
                    PERSUADE: {
                        name: 'Persuade',
                        type: 'status',
                        effect: 'charm',
                        mp: 25,
                        jpCost: 350,
                        description: 'Convince enemy to temporarily join'
                    },
                    NEGOTIATE: {
                        name: 'Negotiate',
                        type: 'special',
                        mp: 15,
                        jpCost: 200,
                        description: 'Convince enemy to give up gil'
                    },
                    ENTHRALL: {
                        name: 'Enthrall',
                        type: 'status',
                        effect: 'confusion',
                        mp: 22,
                        jpCost: 300,
                        description: 'Confuse target with rhetoric'
                    },
                    PRAISE: {
                        name: 'Praise',
                        type: 'buff',
                        effect: 'increase_stats',
                        mp: 20,
                        jpCost: 250,
                        description: 'Boost ally morale and stats'
                    },
                    CONDEMN: {
                        name: 'Condemn',
                        type: 'status',
                        effect: 'decrease_stats',
                        mp: 20,
                        jpCost: 250,
                        description: 'Lower enemy morale and stats'
                    },
                    PEACE_TALK: {
                        name: 'Peace Talk',
                        type: 'special',
                        mp: 30,
                        jpCost: 400,
                        description: 'Attempt to end combat peacefully'
                    },
                    INTIMIDATE: {
                        name: 'Intimidate',
                        type: 'status',
                        effect: ['fear', 'retreat'],
                        mp: 28,
                        jpCost: 450,
                        description: 'Frighten enemy into retreat'
                    },
                    RALLYING_CRY: {
                        name: 'Rallying Cry',
                        type: 'buff',
                        effect: ['attack_up', 'protect', 'haste'],
                        aoe: true,
                        mp: 45,
                        jpCost: 600,
                        description: 'Powerful party-wide morale boost'
                    },
                    FINAL_ARGUMENT: {
                        name: 'Final Argument',
                        type: 'special',
                        power: 2.5,
                        mp: 50,
                        jpCost: 750,
                        description: 'Ultimate persuasion technique'
                    }
                }
            },
            reaction: {
                COUNTER_ARGUE: {
                    name: 'Counter Argue',
                    chance: 0.3,
                    effect: 'reflect_status',
                    jpCost: 400,
                    description: 'Chance to reflect status effects'
                },
                DIPLOMATIC_IMMUNITY: {
                    name: 'Diplomatic Immunity',
                    chance: 0.35,
                    effect: 'avoid_damage',
                    jpCost: 450,
                    description: 'Chance to avoid damage through negotiation'
                }
            },
            support: {
                NEGOTIATOR: {
                    name: 'Negotiator',
                    effect: 'improve_persuasion',
                    jpCost: 500,
                    description: 'Improve success rate of all speechcraft'
                },
                SILVER_TONGUE: {
                    name: 'Silver Tongue',
                    effect: 'reduce_mp_cost',
                    jpCost: 400,
                    description: 'Reduce MP cost of speechcraft abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.ORACLE]: 2,
            [JOBS.TIME_MAGE]: 2
        };
    }
}
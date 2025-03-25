import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class SQUIRE extends JOBINTERFACE {
    static getDescription() {
        return "Entry-level warriors who form the foundation of military training. While their abilities may seem basic, they excel at fundamental combat techniques and basic battlefield support. Their versatile skill set includes basic healing, equipment maintenance, and tactical awareness, making them surprisingly adaptable in various situations.";
    }

    static getBaseStats() {
        return {
            hp: 100,
            mp: 50,
            pa: 8,
            ma: 6,
            sp: 8,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 30,
            mp: 10,
            pa: 0.4,
            ma: 0.2,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Basic Skills',
                abilities: {
                    THROW_STONE: {
                        name: 'Throw Stone',
                        type: 'physical',
                        ranged: true,
                        power: 1.2,
                        mp: 0,
                        jpCost: 100,
                        description: 'Basic ranged attack using stones'
                    },
                    ACCUMULATE: {
                        name: 'Accumulate',
                        type: 'buff',
                        effect: 'attack_up',
                        target: 'self',
                        mp: 0,
                        jpCost: 150,
                        description: 'Build up physical strength'
                    },
                    DASH: {
                        name: 'Dash',
                        type: 'physical',
                        power: 1.4,
                        mp: 0,
                        jpCost: 200,
                        description: 'Quick rushing attack'
                    },
                    RALLY_CRY: {
                        name: 'Rally Cry',
                        type: 'buff',
                        effect: 'party_stats_up',
                        mp: 15,
                        jpCost: 300,
                        description: 'Boost party morale, increasing stats slightly'
                    },
                    FIRST_AID: {
                        name: 'First Aid',
                        type: 'healing',
                        power: 1.2,
                        mp: 8,
                        jpCost: 250,
                        description: 'Basic healing technique'
                    },
                    FOCUS: {
                        name: 'Focus',
                        type: 'buff',
                        effect: 'accuracy_up',
                        mp: 5,
                        jpCost: 200,
                        description: 'Increase accuracy for next attack'
                    },
                    INSPECT: {
                        name: 'Inspect',
                        type: 'analyze',
                        mp: 12,
                        jpCost: 250,
                        description: 'Analyze enemy or object for weaknesses'
                    },
                    BATTLE_TACTICS: {
                        name: 'Battle Tactics',
                        type: 'buff',
                        effect: 'party_defense_up',
                        mp: 18,
                        jpCost: 300,
                        description: 'Grant defensive bonus to nearby allies'
                    },
                    DETERMINATION: {
                        name: 'Determination',
                        type: 'buff',
                        effect: 'survive_fatal',
                        mp: 25,
                        jpCost: 400,
                        description: 'Chance to survive a fatal blow'
                    }
                }
            },
            reaction: {
                COUNTER_TACKLE: {
                    name: 'Counter Tackle',
                    chance: 0.25,
                    effect: 'counter_attack',
                    jpCost: 300,
                    description: 'Counter physical attacks with a tackle'
                },
                DEFENSIVE_STANCE: {
                    name: 'Defensive Stance',
                    chance: 0.3,
                    effect: 'reduce_damage',
                    jpCost: 250,
                    description: 'Chance to reduce incoming damage'
                }
            },
            support: {
                JP_BOOST: {
                    name: 'JP Boost',
                    effect: 'increase_jp_gain',
                    jpCost: 300,
                    description: 'Increase JP gained from battles'
                },
                MOVE_HP_UP: {
                    name: 'Move HP Up',
                    effect: 'heal_while_moving',
                    jpCost: 250,
                    description: 'Recover HP while moving'
                }
            }
        };
    }
}
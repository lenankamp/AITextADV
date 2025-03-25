import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class DANCER extends JOBINTERFACE {
    static getDescription() {
        return "Agile performers who weave combat and artistry into mesmerizing techniques. Specialists in area-of-effect status conditions and party support through various dances. In combat, they excel at crowd control and debuffing multiple enemies simultaneously.";
    }

    static getBaseStats() {
        return {
            hp: 90,
            mp: 75,
            pa: 7,
            ma: 8,
            sp: 9,
            ev: 7
        };
    }

    static getGrowthRates() {
        return {
            hp: 30,
            mp: 20,
            pa: 0.3,
            ma: 0.4,
            sp: 0.5,
            ev: 0.4
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Dance',
                abilities: {
                    SLOW_DANCE: {
                        name: 'Slow Dance',
                        type: 'status',
                        effect: 'slow',
                        aoe: true,
                        mp: 16,
                        jpCost: 200,
                        description: 'Reduce enemy speed through dance'
                    },
                    TEMPTING_WALTZ: {
                        name: 'Tempting Waltz',
                        type: 'status',
                        effect: 'charm',
                        mp: 24,
                        jpCost: 300,
                        description: 'Charm target with mesmerizing dance'
                    },
                    WAR_DANCE: {
                        name: 'War Dance',
                        type: 'buff',
                        effect: 'attack_up',
                        aoe: true,
                        mp: 20,
                        jpCost: 250,
                        description: 'Boost party attack through dance'
                    },
                    EXHAUSTING_POLKA: {
                        name: 'Exhausting Polka',
                        type: 'drain',
                        effect: ['fatigue', 'mp_drain'],
                        aoe: true,
                        mp: 28,
                        jpCost: 350,
                        description: 'Drain enemy stamina and MP'
                    },
                    SIREN_DANCE: {
                        name: 'Siren Dance',
                        type: 'status',
                        effect: 'confusion',
                        aoe: true,
                        mp: 30,
                        jpCost: 400,
                        description: 'Confuse enemies with alluring dance'
                    },
                    BEWITCHING_DANCE: {
                        name: 'Bewitching Dance',
                        type: 'status',
                        effect: ['sleep', 'silence'],
                        aoe: true,
                        mp: 35,
                        jpCost: 450,
                        description: 'Put enemies to sleep with enchanting dance'
                    },
                    HEALING_WALTZ: {
                        name: 'Healing Waltz',
                        type: 'special',
                        aoe: true,
                        mp: 22,
                        jpCost: 280,
                        description: 'Remove status effects with restorative dance'
                    },
                    FORBIDDEN_DANCE: {
                        name: 'Forbidden Dance',
                        type: 'drain',
                        power: 2.2,
                        effect: 'mp_drain',
                        aoe: true,
                        mp: 40,
                        jpCost: 500,
                        description: 'Drain MP with dark dance'
                    },
                    TRANCE_DANCE: {
                        name: 'Trance Dance',
                        type: 'buff',
                        effect: ['attack_up', 'magic_up', 'haste'],
                        target: 'self',
                        mp: 45,
                        jpCost: 600,
                        description: 'Enter powerful trance state'
                    },
                    LAST_WALTZ: {
                        name: 'Last Waltz',
                        type: 'drain',
                        power: 3.0,
                        effect: ['mp_drain', 'hp_drain'],
                        aoe: true,
                        mp: 50,
                        jpCost: 800,
                        description: 'Ultimate dance draining HP and MP'
                    }
                }
            },
            reaction: {
                RHYTHM_SENSE: {
                    name: 'Rhythm Sense',
                    chance: 0.3,
                    effect: 'evade_melee',
                    jpCost: 400,
                    description: 'Chance to dodge physical attacks'
                },
                MOVING_GRACE: {
                    name: 'Moving Grace',
                    chance: 0.25,
                    effect: 'counter_with_dance',
                    jpCost: 450,
                    description: 'Counter attacks with dance effect'
                }
            },
            support: {
                DANCE_MASTERY: {
                    name: 'Dance Mastery',
                    effect: 'increase_dance_success',
                    jpCost: 500,
                    description: 'Improve success rate of dance abilities'
                },
                PERFORMANCE_FOCUS: {
                    name: 'Performance Focus',
                    effect: ['extend_dance_duration', 'increase_dance_potency'],
                    jpCost: 450,
                    description: 'Enhances duration and effectiveness of dance abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.MONK]: 3,
            [JOBS.ORACLE]: 3,
            [JOBS.GEOMANCER]: 2
        };
    }
}
import { JobInterface, JOBS } from './index.js';

export class Archer extends JobInterface {
    static getDescription() {
        return "Skilled ranged combatants who excel at precision attacks from a distance. Masters of tactical positioning and battlefield control through various arrow types. In combat, they provide reliable single-target and area damage while maintaining safe distance.";
    }

    static getBaseStats() {
        return {
            hp: 95,
            mp: 45,
            pa: 9,
            ma: 5,
            sp: 9,
            ev: 7
        };
    }

    static getGrowthRates() {
        return {
            hp: 30,
            mp: 8,
            pa: 0.4,
            ma: 0.2,
            sp: 0.4,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Aim',
                abilities: {
                    CHARGE: {
                        name: 'Charge',
                        type: 'physical',
                        power: 2.0,
                        mp: 12,
                        charge: 1,
                        jpCost: 100,
                        description: 'Powerful charged shot'
                    },
                    RAPID_FIRE: {
                        name: 'Rapid Fire',
                        type: 'physical',
                        power: 0.8,
                        hits: 4,
                        mp: 15,
                        jpCost: 200,
                        description: 'Multiple quick shots'
                    },
                    ARROW_RAIN: {
                        name: 'Arrow Rain',
                        type: 'physical',
                        power: 1.2,
                        aoe: true,
                        mp: 20,
                        jpCost: 300,
                        description: 'Deals damage to all enemies in an area'
                    },
                    PRECISION_SHOT: {
                        name: 'Precision Shot',
                        type: 'physical',
                        power: 1.8,
                        accuracy: 1.5,
                        critRate: 0.3,
                        mp: 18,
                        jpCost: 400,
                        description: 'High accuracy shot with increased critical rate'
                    },
                    SNIPER_SHOT: {
                        name: 'Sniper Shot',
                        type: 'physical',
                        power: 2.2,
                        mp: 25,
                        jpCost: 450,
                        description: 'Long-range precision attack'
                    },
                    DISABLING_SHOT: {
                        name: 'Disabling Shot',
                        type: 'physical',
                        power: 0.7,
                        effect: 'slow',
                        mp: 15,
                        jpCost: 250,
                        description: 'Deals damage and slows the target'
                    },
                    WEAKNESS_SHOT: {
                        name: 'Weakness Shot',
                        type: 'physical',
                        power: 1.0,
                        effect: 'defense_down',
                        mp: 25,
                        jpCost: 450,
                        description: 'Reduces target defense while dealing damage'
                    },
                    PIERCING_ARROW: {
                        name: 'Piercing Arrow',
                        type: 'physical',
                        power: 1.6,
                        effect: 'armor_pierce',
                        mp: 28,
                        jpCost: 400,
                        description: 'Arrow that pierces through defenses'
                    },
                    TAKEDOWN_SHOT: {
                        name: 'Takedown Shot',
                        type: 'physical',
                        power: 2.0,
                        effect: 'knockback',
                        mp: 32,
                        jpCost: 500,
                        description: 'Powerful shot that knocks target back'
                    },
                    BARRAGE: {
                        name: 'Barrage',
                        type: 'physical',
                        power: 1.4,
                        hits: 3,
                        aoe: true,
                        mp: 35,
                        jpCost: 600,
                        description: 'Multiple shots hitting all enemies in area'
                    }
                }
            },
            reaction: {
                Archer_GUARD: {
                    name: 'Archer Guard',
                    chance: 0.3,
                    effect: 'ranged_defense_up',
                    jpCost: 200,
                    description: 'Reduces damage from ranged attacks'
                },
                COUNTER_SHOT: {
                    name: 'Counter Shot',
                    chance: 0.25,
                    type: 'physical',
                    power: 0.8,
                    jpCost: 300,
                    description: 'Chance to counter with a ranged attack'
                }
            },
            support: {
                CONCENTRATE: {
                    name: 'Concentrate',
                    effect: 'accuracy_up',
                    jpCost: 150,
                    description: 'Increases accuracy of attacks'
                },
                PRECISE_AIM: {
                    name: 'Precise Aim',
                    effect: 'increase_critical',
                    jpCost: 300,
                    description: 'Improves critical hit chance'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Squire]: 2
        };
    }
}
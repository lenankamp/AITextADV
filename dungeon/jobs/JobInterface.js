export class JobInterface {
    static getBaseStats() {
        return {
            hp: 0,
            mp: 0,
            pa: 0,
            ma: 0,
            sp: 0,
            ev: 0
        };
    }
    static getGrowthRates() {
        return {
            hp: 0,
            mp: 0,
            pa: 0,
            ma: 0,
            sp: 0,
            ev: 0
        };
    }
    static getAbilities() {
        return {
            active: {
                name: 'Melee Attack',
                type: 'physical',
                power: 1,
                element: null,
                effect: null,
                mp: 0,
                jpCost: 0,
                description: 'Basic melee attack'
            },
            reaction: {
                FLINCH: {
                    name: 'Flinch',
                    chance: 0.4,
                    effect: null,
                    jpCost: 0,
                    description: 'Chance to do nothing when damaged'
                }
            },
            support: {
                HARDY: {
                    name: 'Hardy',
                    effect: null,
                    jpCost: 0,
                    description: 'Status wears off at normal rate'
                }
            }
        };
    }
    static getRequirements() {
        return null;
    }
    static getDescription() {
        return "This is the default job description. Actual jobs should override all of the methods of this class.";
    }
}

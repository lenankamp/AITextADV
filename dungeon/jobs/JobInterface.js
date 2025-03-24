// Base interface for all jobs
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
                name: '',
                abilities: {}
            },
            reaction: {},
            support: {}
        };
    }

    static getRequirements() {
        return null;
    }
}
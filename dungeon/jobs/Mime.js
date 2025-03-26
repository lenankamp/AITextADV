import { JobInterface, JOBS } from './index.js';

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
            [JOBS.Samurai]: 3,
            [JOBS.Calculator]: 3,
            [JOBS.Dancer]: 2,
            [JOBS.Bard]: 2
        };
    }

    // Store the last ability used by any character
    static lastAbilityUsed = null;

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'MIMIC':
                return this._resolveMimic(user, ability, target);
            case 'REPLAY':
                return this._resolveReplay(user, ability, target);
            case 'PERFECT_COPY':
                return this._resolvePerfectCopy(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveMimic(user, ability, target) {
        if (!this.lastAbilityUsed) {
            return {
                success: false,
                message: 'No ability to mimic'
            };
        }

        // Calculate mimic effectiveness based on user's stats vs original user's stats
        const originalStats = this.lastAbilityUsed.user.getStats();
        const mimicStats = user.getStats();
        const effectivenessMultiplier = Math.min(1, 
            (mimicStats.ma / originalStats.ma + mimicStats.pa / originalStats.pa) / 2
        );

        // Copy the ability but potentially with reduced effectiveness
        const mimickedAbility = {
            ...this.lastAbilityUsed.ability,
            power: this.lastAbilityUsed.ability.power * effectivenessMultiplier
        };

        // Use the appropriate job's resolveSpecialAbility if it exists
        const jobClass = this.lastAbilityUsed.jobClass;
        if (jobClass && jobClass.resolveSpecialAbility) {
            const result = jobClass.resolveSpecialAbility(user, mimickedAbility, target);
            result.mimicked = true;
            return result;
        }

        // Default handling if no special resolution exists
        if (mimickedAbility.type === 'damage') {
            const damage = Math.floor(mimicStats.pa * mimickedAbility.power);
            target.status.hp = Math.max(0, target.status.hp - damage);
            return {
                success: true,
                damage,
                mimicked: true
            };
        }

        return {
            success: true,
            message: 'Mimicked ability with basic effect',
            mimicked: true
        };
    }

    static _resolveReplay(user, ability, target) {
        // Replay last ability with increased effectiveness
        if (!this.lastAbilityUsed) {
            return {
                success: false,
                message: 'No ability to replay'
            };
        }

        // Replaying uses memory of the ability for better execution
        const replayBonus = 1.2; // 20% more effective
        const modifiedAbility = {
            ...this.lastAbilityUsed.ability,
            power: (this.lastAbilityUsed.ability.power || 1) * replayBonus
        };

        return this._resolveMimic(user, {
            ...ability,
            replayBonus
        }, target);
    }

    static _resolvePerfectCopy(user, ability, target) {
        // Perfect copy requires significant MP but executes at full effectiveness
        const mpCost = Math.floor(ability.mp * 1.5);
        if (user.status.mp < mpCost) {
            return {
                success: false,
                message: 'Not enough MP for perfect copy'
            };
        }

        // Consume extra MP
        user.status.mp -= mpCost;

        if (!this.lastAbilityUsed) {
            return {
                success: false,
                message: 'No ability to copy'
            };
        }

        // Execute the ability at full effectiveness of original user
        const result = this.lastAbilityUsed.jobClass.resolveSpecialAbility(
            this.lastAbilityUsed.user,
            this.lastAbilityUsed.ability,
            target
        );

        return {
            ...result,
            perfectCopy: true,
            mpUsed: mpCost
        };
    }

    // Static method to record abilities for mimicry
    static recordAbility(user, ability, jobClass) {
        this.lastAbilityUsed = {
            user,
            ability,
            jobClass,
            timestamp: Date.now()
        };
    }
}
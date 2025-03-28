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
            case 'REPLICATE':
                return this._resolveReplicate(user, target);
            case 'BATTLE_MEMORY':
                return this._resolveBattleMemory(user, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveReplicate(user, target) {
        // Get the last action performed by the target
        const lastAction = target.lastAction;
        if (!lastAction) {
            return {
                success: false,
                message: 'No action to replicate'
            };
        }

        // Try to execute the same ability
        const result = user.useAbility(lastAction.ability.id, lastAction.target);

        // Add mimic bonus effect
        if (result.success) {
            if (result.damage) {
                result.damage = Math.floor(result.damage * 1.2); // 20% bonus damage
            }
            if (result.healing) {
                result.healing = Math.floor(result.healing * 1.2); // 20% bonus healing
            }
            result.message = `Mimicked ${lastAction.ability.name} with enhanced effect!`;
        }

        return result;
    }

    static _resolveBattleMemory(user, target) {
        // Check if target has any usable abilities
        const targetJob = target.currentJob;
        if (!targetJob) {
            return {
                success: false,
                message: 'No abilities to learn from target'
            };
        }

        // Temporarily learn a random ability from target's job
        const abilities = target.getAvailableAbilities().active.abilities;
        if (!abilities) {
            return {
                success: false,
                message: 'No abilities to learn from target'
            };
        }
        const abilityKeys = Object.keys(abilities);
        const randomAbility = abilities[abilityKeys[Math.floor(Math.random() * abilityKeys.length)]];

        // Store the ability for later use
        if (!user.mimeMemory) {
            user.mimeMemory = [];
        }
        user.mimeMemory.push({
            id: randomAbility.id,
            name: randomAbility.name,
            duration: 3 // Ability can be used for 3 turns
        });

        return {
            success: true,
            message: `Learned ${randomAbility.name} from target!`,
            effects: [{
                type: 'memory_gain',
                ability: randomAbility.name,
                duration: 3
            }]
        };
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
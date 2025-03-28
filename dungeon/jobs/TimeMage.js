import { JobInterface, JOBS } from './index.js';

export class TimeMage extends JobInterface {
    static getBaseStats() {
        return {
            hp: 82,
            mp: 98,
            pa: 4,
            ma: 11,
            sp: 7,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 22,
            mp: 24,
            pa: 0.1,
            ma: 0.5,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Time Magic',
                abilities: {
                    HASTE: {
                        name: 'Haste',
                        type: 'buff',
                        effect: 'haste',
                        mp: 24,
                        jpCost: 300,
                        description: 'Increase target\'s speed'
                    },
                    SLOW: {
                        name: 'Slow',
                        type: 'status',
                        effect: 'slow',
                        mp: 20,
                        jpCost: 300,
                        description: 'Decrease target\'s speed'
                    },
                    STOP: {
                        name: 'Stop',
                        type: 'status',
                        effect: 'stop',
                        mp: 30,
                        jpCost: 500,
                        description: 'Freeze target in time'
                    },
                    FLOAT: {
                        name: 'Float',
                        type: 'buff',
                        effect: 'levitate',
                        mp: 18,
                        jpCost: 200,
                        description: 'Allow target to float above ground'
                    },
                    GRAVITY: {
                        name: 'Gravity',
                        type: 'magical',
                        effect: 'gravity_damage',
                        mp: 32,
                        jpCost: 400,
                        description: 'Deal damage based on target\'s max HP'
                    },
                    TIME_SLIP: {
                        name: 'Time Slip',
                        type: 'dungeon',
                        effect: 'reset_room',
                        mp: 35,
                        jpCost: 450,
                        description: 'Reset a room to its original state'
                    },
                    TEMPORAL_ANCHOR: {
                        name: 'Temporal Anchor',
                        type: 'dungeon',
                        effect: 'create_checkpoint',
                        mp: 40,
                        jpCost: 500,
                        description: 'Create a temporal checkpoint to return to'
                    },
                    QUICK: {
                        name: 'Quick',
                        type: 'special',
                        mp: 45,
                        jpCost: 800,
                        description: 'Grant an immediate extra turn'
                    },
                    METEOR: {
                        name: 'Meteor',
                        type: 'magical',
                        power: 3.5,
                        aoe: true,
                        mp: 60,
                        jpCost: 900,
                        description: 'Call down devastating meteors'
                    }
                }
            },
            reaction: {
                TIME_WARD: {
                    name: 'Time Ward',
                    chance: 0.3,
                    effect: 'resist_time_magic',
                    jpCost: 400,
                    description: 'Chance to resist time magic'
                },
                TEMPORAL_SHIFT: {
                    name: 'Temporal Shift',
                    chance: 0.25,
                    effect: 'evade',
                    jpCost: 500,
                    description: 'Phase through time to avoid damage'
                }
            },
            support: {
                TIME_SENSE: {
                    name: 'Time Sense',
                    effect: 'initiative_up',
                    jpCost: 300,
                    description: 'Improve chance of acting first'
                },
                TEMPORAL_MASTERY: {
                    name: 'Temporal Mastery',
                    effect: 'enhance_time_magic',
                    jpCost: 600,
                    description: 'Strengthen all time magic effects'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.BlackMage]: 2
        };
    }

    static getDescription() {
        return "Enigmatic spellcasters who manipulate the flow of time itself. Their mastery over temporal magic allows them to speed allies, slow enemies, and even stop time briefly. In combat, they excel at battlefield control through time manipulation. Their unique abilities to reset rooms and create temporal checkpoints make them invaluable for dungeon exploration and puzzle-solving.";
    }

    // Track active temporal effects
    static activeTimeEffects = new Map();

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'QUICK':
                return this._resolveQuick(user, ability, target);
            case 'TIME_SLIP':
                return this._resolveTimeSlip(user, ability, target);
            case 'TEMPORAL_ANCHOR':
                return this._resolveTemporalAnchor(user, ability, target);
            case 'GRAVITY':
                return this._resolveGravity(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveQuick(user, ability, target) {
        // Grant an immediate extra turn
        const stats = user.getStats();
        const timeEffect = {
            name: 'quick',
            duration: 1,
            power: stats.ma * 0.1,
            bonuses: {
                actionPoints: 1,
                speed: 1.5
            }
        };

        if (!target.isImmuneToEffect(timeEffect.name)) {
            target.addEffect(timeEffect);
            // Track effect
            this._addTimeEffect(target, timeEffect);
        }

        return {
            success: true,
            message: `${target.name} gains an extra turn`,
            effects: [timeEffect]
        };
    }

    static _resolveTimeSlip(user, ability, target) {
        // Reset target to previous state
        const stats = user.getStats();
        const slipPower = Math.floor(stats.ma * ability.power);
        const timeEffect = {
            name: 'time_slip',
            duration: 2,
            power: slipPower,
            onApply: (target) => {
                // Store current state
                target.savedState = {
                    hp: target.status.hp,
                    mp: target.status.mp,
                    effects: [...target.status.effects]
                };
            },
            onRemove: (target) => {
                // Revert to saved state
                if (target.savedState) {
                    target.status.hp = target.savedState.hp;
                    target.status.mp = target.savedState.mp;
                    target.status.effects = target.savedState.effects;
                    delete target.savedState;
                }
            }
        };

        if (!target.isImmuneToEffect(timeEffect.name)) {
            target.addEffect(timeEffect);
            this._addTimeEffect(target, timeEffect);
        }

        return {
            success: true,
            message: `${target.name} becomes unstuck in time`,
            effects: [timeEffect]
        };
    }

    static _resolveTemporalAnchor(user, ability, target) {
        // Create a checkpoint to return to
        const stats = user.getStats();
        const anchorPower = Math.floor(stats.ma * ability.power);
        
        const timeEffect = {
            name: 'temporal_anchor',
            duration: 5,
            power: anchorPower,
            checkpoint: {
                position: target.position,
                hp: target.status.hp,
                mp: target.status.mp,
                effects: [...target.status.effects]
            },
            onTrigger: (target) => {
                if (target.status.hp <= 0 && this.checkpoint) {
                    // Return to checkpoint state
                    target.position = this.checkpoint.position;
                    target.status.hp = this.checkpoint.hp;
                    target.status.mp = this.checkpoint.mp;
                    target.status.effects = [...this.checkpoint.effects];
                    return true; // Effect is consumed
                }
                return false;
            }
        };

        if (!target.isImmuneToEffect(timeEffect.name)) {
            target.addEffect(timeEffect);
            this._addTimeEffect(target, timeEffect);
        }

        return {
            success: true,
            message: `${target.name} is anchored in time`,
            effects: [timeEffect]
        };
    }

    static _resolveGravity(user, ability, target) {
        // Deal damage based on target's max HP
        const stats = user.getStats();
        const gravityPower = Math.min(0.5, 0.25 + (stats.ma * 0.01)); // Cap at 50% max HP
        const damage = Math.floor(target.getMaxHP() * gravityPower);

        // Apply damage
        target.status.hp = Math.max(1, target.status.hp - damage);

        // Apply gravity effect
        const timeEffect = {
            name: 'gravity',
            duration: 2,
            power: stats.ma * 0.1,
            penalties: {
                speed: 0.7,
                jumpHeight: 0.5,
                evasion: 0.6
            }
        };

        if (!target.isImmuneToEffect(timeEffect.name)) {
            target.addEffect(timeEffect);
            this._addTimeEffect(target, timeEffect);
        }

        return {
            success: true,
            damage,
            message: `${target.name} takes ${damage} gravity damage`,
            effects: [timeEffect]
        };
    }

    static _addTimeEffect(target, effect) {
        if (!target.id) {
            target.id = Math.random().toString(36).substr(2, 9);
        }

        let activeEffects = this.activeTimeEffects.get(target.id) || [];
        // Remove any existing effect of the same type
        activeEffects = activeEffects.filter(e => e.name !== effect.name);
        // Add new effect
        activeEffects.push(effect);
        this.activeTimeEffects.set(target.id, activeEffects);
    }
}
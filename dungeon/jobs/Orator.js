import { JobInterface, JOBS } from './index.js';

export class Orator extends JobInterface {
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
            [JOBS.Oracle]: 2,
            [JOBS.TimeMage]: 2
        };
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'NEGOTIATE':
                return this._resolveNegotiate(user, ability, target);
            case 'PEACE_TALK':
                return this._resolvePeaceTalk(user, ability, target);
            case 'FINAL_ARGUMENT':
                return this._resolveFinalArgument(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveNegotiate(user, ability, target) {
        // Base success rate based on user's MA and target's level
        const baseChance = 0.4 + (user.getStats().ma - target.level) * 0.03;
        const successRate = Math.min(0.85, Math.max(0.15, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Negotiation failed'
            };
        }

        // Calculate gil amount based on target's level and a random factor
        const gilAmount = Math.floor(target.level * (15 + Math.random() * 25));

        return {
            success: true,
            message: `Successfully negotiated ${gilAmount} gil`,
            gilAmount,
            effects: [{
                name: 'negotiate_success',
                duration: 2
            }]
        };
    }

    static _resolvePeaceTalk(user, ability, target) {
        // Peace Talk attempts to end combat by convincing enemies to leave
        // Higher chance with lower enemy HP
        const hpRatio = target.status.hp / target.getMaxHP();
        const baseChance = 0.3 + (1 - hpRatio) * 0.4 + (user.getStats().ma - target.level) * 0.02;
        const successRate = Math.min(0.75, Math.max(0.1, baseChance));

        // Bosses and certain enemies might be immune
        if (target.type === 'boss' || target.isImmuneToEffect('peace')) {
            return {
                success: false,
                message: 'Target is immune to persuasion'
            };
        }

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Peace talk failed'
            };
        }

        return {
            success: true,
            message: 'Successfully convinced enemy to leave',
            effects: [{
                name: 'peace',
                duration: 1,
                forceRetreat: true
            }]
        };
    }

    static _resolveFinalArgument(user, ability, target) {
        // Final Argument is a powerful ability that combines damage with status effects
        const stats = user.getStats();
        const baseDamage = Math.floor(stats.ma * ability.power);
        
        // Calculate bonus damage based on active debate effects
        const debateEffects = target.status.effects.filter(
            effect => effect.name === 'debate_stack'
        ).length;
        
        const totalDamage = Math.floor(baseDamage * (1 + debateEffects * 0.5));
        target.status.hp = Math.max(0, target.status.hp - totalDamage);

        // Clear debate stacks and apply final effects
        target.status.effects = target.status.effects.filter(
            effect => effect.name !== 'debate_stack'
        );

        const effects = [{
            name: 'silence',
            duration: 3
        }, {
            name: 'confusion',
            duration: 2
        }];

        // Apply effects if target isn't immune
        effects.forEach(effect => {
            if (!target.isImmuneToEffect(effect.name)) {
                target.addEffect(effect);
            }
        });

        return {
            success: true,
            damage: totalDamage,
            debateEffectsConsumed: debateEffects,
            effects
        };
    }
}
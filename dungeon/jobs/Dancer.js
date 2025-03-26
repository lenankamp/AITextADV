import { JobInterface, JOBS } from './index.js';

export class Dancer extends JobInterface {
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
            [JOBS.Monk]: 3,
            [JOBS.Oracle]: 3,
            [JOBS.Geomancer]: 2
        };
    }

    // Track active dances and their effects
    static activeDances = new Map();

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'SWORD_DANCE':
                return this._resolveSwordDance(user, ability, target);
            case 'TRANCE_DANCE':
                return this._resolveTranceDance(user, ability, target);
            case 'FORBIDDEN_DANCE':
                return this._resolveForbiddenDance(user, ability, target);
            case 'DANCE_OF_LIFE':
                return this._resolveDanceOfLife(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveSwordDance(user, ability, target) {
        // Offensive dance that increases critical hit rate and damage
        const stats = user.getStats();
        const dancePower = Math.floor(stats.pa * ability.power);

        const effect = {
            name: 'sword_dance',
            duration: 3,
            power: dancePower,
            bonuses: {
                criticalRate: 0.25,
                criticalDamage: 1.5,
                attack: 1.2
            }
        };

        this._applyDanceEffect(user, effect);
        return {
            success: true,
            message: 'The rhythm of battle flows through your movements',
            effects: [effect]
        };
    }

    static _resolveTranceDance(user, ability, target) {
        // Mystical dance that enhances magical abilities
        const stats = user.getStats();
        const dancePower = Math.floor(stats.ma * ability.power);

        const effect = {
            name: 'trance_dance',
            duration: 4,
            power: dancePower,
            bonuses: {
                magicPower: 1.4,
                mpCost: 0.7
            }
        };

        this._applyDanceEffect(user, effect);
        return {
            success: true,
            message: 'Mystical energies swirl in response to your dance',
            effects: [effect]
        };
    }

    static _resolveForbiddenDance(user, ability, target) {
        // High-risk, high-reward dance that drains HP but greatly increases power
        const hpCost = Math.floor(user.status.hp * 0.3);
        user.status.hp = Math.max(1, user.status.hp - hpCost);

        const effect = {
            name: 'forbidden_dance',
            duration: 3,
            power: ability.power * 2,
            bonuses: {
                attack: 1.8,
                magicPower: 1.8,
                speed: 1.4
            },
            penalties: {
                defense: 0.7,
                magicDefense: 0.7
            }
        };

        this._applyDanceEffect(user, effect);
        return {
            success: true,
            message: 'The forbidden dance exchanges life force for power',
            effects: [effect],
            hpLost: hpCost
        };
    }

    static _resolveDanceOfLife(user, ability, target) {
        // Healing dance that restores HP and removes negative status effects
        const stats = user.getStats();
        const healPower = Math.floor(stats.ma * ability.power);
        const maxHeal = target.getMaxHP() * 0.4; // Cap at 40% of max HP
        const healAmount = Math.min(healPower, maxHeal);

        // Heal target
        target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healAmount);

        // Remove negative status effects
        const removedEffects = [];
        if (target.status.effects) {
            const negativeEffects = ['poison', 'blind', 'silence', 'paralysis', 'confusion'];
            target.status.effects = target.status.effects.filter(effect => {
                if (negativeEffects.includes(effect.name)) {
                    removedEffects.push(effect.name);
                    return false;
                }
                return true;
            });
        }

        // Apply regeneration effect
        const regenEffect = {
            name: 'dance_of_life',
            duration: 3,
            power: healPower * 0.2,
            tickEffect: (target) => {
                const regenAmount = Math.floor(healPower * 0.2);
                target.status.hp = Math.min(target.getMaxHP(), target.status.hp + regenAmount);
                return regenAmount;
            }
        };

        this._applyDanceEffect(target, regenEffect);
        return {
            success: true,
            healAmount,
            removedEffects,
            message: `Healing dance restores ${healAmount} HP` + 
                    (removedEffects.length > 0 ? ` and removes ${removedEffects.join(', ')}` : ''),
            effects: [regenEffect]
        };
    }

    static _applyDanceEffect(target, effect) {
        if (!target.id) {
            target.id = Math.random().toString(36).substr(2, 9);
        }

        let activeEffects = this.activeDances.get(target.id) || [];
        // Remove any existing effect of the same type
        activeEffects = activeEffects.filter(e => e.name !== effect.name);
        // Add new effect
        activeEffects.push(effect);
        this.activeDances.set(target.id, activeEffects);

        // Apply effect to target
        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
        }
    }
}
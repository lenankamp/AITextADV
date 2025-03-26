import { JobInterface, JOBS } from './index.js';

export class WhiteMage extends JobInterface {
    static getDescription() {
        return "Primary healers and support specialists who wield holy magic. Masters of recovery magic, status ailment removal, and protective enchantments. Essential for party survival with powerful healing spells and defensive buffs. In dungeons, they excel at creating safe zones through purification magic and are particularly effective at dealing with undead threats and cursed areas.";
    }
    
    static getBaseStats() {
        return {
            hp: 85,
            mp: 90,
            pa: 4,
            ma: 10,
            sp: 6,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 25,
            mp: 20,
            pa: 0.1,
            ma: 0.5,
            sp: 0.2,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'White Magic',
                abilities: {
                    CURE: {
                        name: 'Cure',
                        type: 'healing',
                        power: 1.8,
                        mp: 14,
                        jpCost: 200
                    },
                    CURA: {
                        name: 'Cura',
                        type: 'healing',
                        power: 2.4,
                        mp: 20,
                        jpCost: 400
                    },
                    CURAGA: {
                        name: 'Curaga',
                        type: 'healing',
                        power: 3.0,
                        aoe: true,
                        mp: 40,
                        jpCost: 600
                    },
                    RAISE: {
                        name: 'Raise',
                        type: 'healing',
                        effect: 'revive',
                        mp: 30,
                        jpCost: 500
                    },
                    RERAISE: {
                        name: 'Reraise',
                        type: 'buff',
                        effect: 'auto_revive',
                        mp: 40,
                        jpCost: 800
                    },
                    ESUNA: {
                        name: 'Esuna',
                        type: 'special',
                        mp: 18,
                        jpCost: 300
                    },
                    PROTECT: {
                        name: 'Protect',
                        type: 'buff',
                        effect: 'protect',
                        mp: 15,
                        jpCost: 250
                    },
                    SHELL: {
                        name: 'Shell',
                        type: 'buff',
                        effect: 'shell',
                        mp: 15,
                        jpCost: 250
                    },
                    HOLY: {
                        name: 'Holy',
                        type: 'magical',
                        element: 'holy',
                        power: 3.2,
                        mp: 56,
                        jpCost: 900
                    },
                    REGEN: {
                        name: 'Regen',
                        type: 'buff',
                        effect: 'heal_over_time',
                        mp: 22,
                        jpCost: 400
                    },
                    DISPEL: {
                        name: 'Dispel',
                        type: 'special',
                        mp: 25,
                        jpCost: 350
                    },
                    SACRED_PURIFICATION: {
                        name: 'Sacred Purification',
                        type: 'dungeon',
                        effect: ['purify_area', 'create_holy_barrier', 'cure_status'],
                        aoe: true,
                        mp: 38,
                        jpCost: 500,
                        description: 'Creates a purified holy zone that cleanses and protects'
                    },
                    BANISH: {
                        name: 'Banish',
                        type: 'magical',
                        element: 'holy',
                        power: 2.5,
                        effect: 'undead_repel',
                        mp: 30,
                        jpCost: 450,
                        description: 'Forces undead creatures to flee'
                    }
                }
            },
            reaction: {
                AUTO_REGEN: {
                    name: 'Auto-Regen',
                    chance: 0.4,
                    effect: 'regen',
                    jpCost: 400,
                    description: 'Chance to gain regen when damaged'
                },
                DIVINE_GRACE: {
                    name: 'Divine Grace',
                    chance: 0.25,
                    effect: 'enhance_healing',
                    jpCost: 450,
                    description: 'Chance to enhance healing received'
                }
            },
            support: {
                HEALING_BOOST: {
                    name: 'Healing Boost',
                    effect: 'increase_heal_power',
                    jpCost: 500,
                    description: 'Increases healing power'
                },
                MP_RECOVERY: {
                    name: 'MP Recovery',
                    effect: 'mp_regen_walking',
                    jpCost: 600,
                    description: 'Gradually restore MP while walking'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Chemist]: 2
        };
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'REGEN':
                return this._resolveRegen(user, ability, target);
            case 'ESUNA':
                return this._resolveEsuna(user, ability, target);
            case 'RAISE':
                return this._resolveRaise(user, ability, target);
            case 'HOLY':
                return this._resolveHoly(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveRegen(user, ability, target) {
        const stats = user.getStats();
        const regenPower = Math.floor(stats.ma * ability.power);
        const duration = ability.duration || 3;

        // Apply regen effect
        const regenEffect = {
            name: 'regen',
            duration: duration,
            power: regenPower,
            tickEffect: (target) => {
                const healAmount = Math.floor(regenPower / 3);
                target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healAmount);
                return healAmount;
            }
        };

        if (!target.isImmuneToEffect('regen')) {
            target.addEffect(regenEffect);
        }

        return {
            success: true,
            message: `Applied regen for ${duration} turns`,
            effects: [regenEffect]
        };
    }

    static _resolveEsuna(user, ability, target) {
        const curableEffects = ['poison', 'blind', 'silence', 'paralysis', 'confusion'];
        const removedEffects = [];

        // Remove negative status effects
        if (target.status.effects) {
            target.status.effects = target.status.effects.filter(effect => {
                if (curableEffects.includes(effect.name)) {
                    removedEffects.push(effect.name);
                    return false;
                }
                return true;
            });
        }

        return {
            success: removedEffects.length > 0,
            message: removedEffects.length > 0 
                ? `Removed status effects: ${removedEffects.join(', ')}` 
                : 'No curable status effects found',
            removedEffects
        };
    }

    static _resolveRaise(user, ability, target) {
        if (target.status.hp > 0) {
            return {
                success: false,
                message: 'Target is not KO\'d'
            };
        }

        const stats = user.getStats();
        const raiseHPRatio = ability.power || 0.5; // Default to 50% HP restore
        const restoredHP = Math.floor(target.getMaxHP() * raiseHPRatio);

        // Revive target with partial HP
        target.status.hp = restoredHP;
        
        // Apply reraise effect if ability has it
        if (ability.grantReraise) {
            const reraiseEffect = {
                name: 'reraise',
                duration: 5,
                power: raiseHPRatio
            };
            
            if (!target.isImmuneToEffect('reraise')) {
                target.addEffect(reraiseEffect);
            }
        }

        return {
            success: true,
            message: `Raised target with ${restoredHP} HP`,
            restoredHP,
            effects: ability.grantReraise ? ['reraise'] : []
        };
    }

    static _resolveHoly(user, ability, target) {
        const stats = user.getStats();
        const baseDamage = Math.floor(stats.ma * ability.power);
        
        // Calculate bonus damage against undead
        const isUndead = target.type === 'undead';
        const totalDamage = isUndead ? Math.floor(baseDamage * 2) : baseDamage;

        // Apply damage
        target.status.hp = Math.max(0, target.status.hp - totalDamage);

        // Holy has a chance to inflict blind
        const blindChance = isUndead ? 0.75 : 0.25;
        let effects = [];

        if (Math.random() < blindChance && !target.isImmuneToEffect('blind')) {
            const blindEffect = {
                name: 'blind',
                duration: 3
            };
            target.addEffect(blindEffect);
            effects.push(blindEffect);
        }

        return {
            success: true,
            damage: totalDamage,
            isUndeadBonus: isUndead,
            effects
        };
    }

    static _getHealingMultiplier(target) {
        // Calculate healing multiplier based on target's deficits and status
        let multiplier = 1;

        // Increase healing on targets with critical HP
        const hpRatio = target.status.hp / target.getMaxHP();
        if (hpRatio < 0.25) {
            multiplier *= 1.5;
        }

        // Bonus healing on targets with regeneration
        if (target.hasEffect('regen')) {
            multiplier *= 1.2;
        }

        return multiplier;
    }
}
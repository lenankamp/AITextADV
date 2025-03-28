import { JobInterface, JOBS } from './index.js';

export class Samurai extends JobInterface {
    static getBaseStats() {
        return {
            hp: 125,
            mp: 70,
            pa: 11,
            ma: 7,
            sp: 7,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 42,
            mp: 15,
            pa: 0.5,
            ma: 0.3,
            sp: 0.3,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Draw Out',
                abilities: {
                    IAIDO: {
                        name: 'Iaido',
                        type: 'physical',
                        power: 2.4,
                        mp: 20,
                        jpCost: 300,
                        description: 'Quick-draw technique with high accuracy'
                    },
                    BLADE_SPIRIT: {
                        name: 'Blade Spirit',
                        type: 'physical',
                        power: 1.8,
                        aoe: true,
                        mp: 25,
                        jpCost: 400,
                        description: 'Area attack that releases sword energy'
                    },
                    STORM_EDGE: {
                        name: 'Storm Edge',
                        type: 'physical',
                        element: 'wind',
                        power: 2.2,
                        mp: 22,
                        jpCost: 350
                    },
                    DEMON_SLICE: {
                        name: 'Demon Slice',
                        type: 'physical',
                        power: 2.6,
                        effect: 'defense_down',
                        mp: 28,
                        jpCost: 450
                    },
                    ZEN_SLASH: {
                        name: 'Zen Slash',
                        type: 'physical',
                        power: 2.8,
                        effect: 'armor_pierce',
                        mp: 35,
                        jpCost: 500
                    },
                    SOUL_BLADE: {
                        name: 'Soul Blade',
                        type: 'physical',
                        element: 'holy',
                        power: 2.5,
                        effect: 'spirit_drain',
                        mp: 32,
                        jpCost: 450,
                        description: 'Sword technique that drains spiritual energy'
                    },
                    MEDITATION: {
                        name: 'Meditation',
                        type: 'buff',
                        effect: ['attack_up', 'accuracy_up'],
                        mp: 25,
                        jpCost: 400,
                        description: 'Focus mind to enhance combat abilities'
                    },
                    BINDING_BLADE: {
                        name: 'Binding Blade',
                        type: 'physical',
                        power: 2.0,
                        effect: 'stop',
                        mp: 30,
                        jpCost: 400
                    },
                    MASAMUNE: {
                        name: 'Masamune',
                        type: 'physical',
                        power: 3.0,
                        effect: ['critical_up', 'haste'],
                        mp: 45,
                        jpCost: 600,
                        description: 'Ultimate sword technique with multiple effects'
                    }
                }
            },
            reaction: {
                THIRD_EYE: {
                    name: 'Third Eye',
                    chance: 0.35,
                    effect: 'anticipate_attack',
                    jpCost: 450,
                    description: 'Chance to completely avoid next physical attack'
                },
                RETRIBUTION: {
                    name: 'Retribution',
                    chance: 0.25,
                    effect: 'counter_with_power',
                    jpCost: 500,
                    description: 'Counter physical attacks with increased power'
                }
            },
            support: {
                KATANA_MASTERY: {
                    name: 'Katana Mastery',
                    effect: 'katana_damage_up',
                    jpCost: 500
                },
                INNER_PEACE: {
                    name: 'Double Handed',
                    effect: 'enable_two_hand',
                    jpCost: 600,
                    description: 'Allows wielding one-handed weapons in both hands for increased damage'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Knight]: 3,
            [JOBS.Monk]: 4,
            [JOBS.Dragoon]: 2
        };
    }

    static getDescription() {
        return "Elite warriors who combine martial prowess with spiritual techniques. Masters of the blade who excel at powerful single-target attacks and tactical positioning. Capable of drawing out a weapon's spiritual energy for devastating effects.";
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'IAIDO':
                return this._resolveIaidoTechnique(user, ability, target);
            case 'BUSHIDO':
                return this._resolveBushidoTechnique(user, ability, target);
            case 'DRAW_OUT':
                return this._resolveDrawOut(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveIaidoTechnique(user, ability, target) {
        // Check if user has a katana equipped
        if (!user.equipment.mainHand?.type === 'katana') {
            return {
                success: false,
                message: 'Must have a katana equipped to use Iaido'
            };
        }

        const stats = user.getStats();
        let damage = Math.floor(stats.pa * ability.power);

        // Apply Iaido-specific bonuses
        if (ability.element) {
            const elementalMultiplier = target.getElementalMultiplier(ability.element);
            damage = Math.floor(damage * elementalMultiplier);
        }

        // Special Iaido effects
        if (ability.effects) {
            ability.effects.forEach(effect => {
                if (!target.isImmuneToEffect(effect)) {
                    target.addEffect({
                        name: effect,
                        duration: ability.duration || 3,
                        power: ability.effectPower || 1
                    });
                }
            });
        }

        // Apply damage
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            effects: ability.effects || []
        };
    }

    static _resolveBushidoTechnique(user, ability, target) {
        // Bushido techniques require meditation stacks
        const meditationStacks = user.status.effects
            .filter(effect => effect.name === 'meditation')
            .length;

        if (meditationStacks < ability.requiredStacks) {
            return {
                success: false,
                message: `Requires ${ability.requiredStacks} meditation stacks`
            };
        }

        // Consume meditation stacks
        for (let i = 0; i < ability.requiredStacks; i++) {
            const index = user.status.effects.findIndex(effect => effect.name === 'meditation');
            if (index !== -1) {
                user.status.effects.splice(index, 1);
            }
        }

        // Calculate and apply damage with bushido bonus
        const stats = user.getStats();
        const damage = Math.floor(stats.pa * ability.power * (1 + (meditationStacks * 0.2)));
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            effects: ability.effects || []
        };
    }

    static _resolveDrawOut(user, ability, target) {
        // Draw Out requires a special katana
        if (!user.equipment.mainHand?.specialType === ability.requiredKatanaType) {
            return {
                success: false,
                message: `Requires ${ability.requiredKatanaType} to use this technique`
            };
        }

        // Calculate special Draw Out damage
        const stats = user.getStats();
        const baseDamage = Math.floor(stats.pa * ability.power);
        
        // Draw Out effects vary based on the katana type
        let additionalEffects = [];
        switch (ability.requiredKatanaType) {
            case 'Masamune':
                additionalEffects.push('haste');
                break;
            case 'Muramasa':
                additionalEffects.push('berserk');
                break;
            case 'Kikuichimonji':
                additionalEffects.push('protect');
                break;
        }

        // Apply effects
        additionalEffects.forEach(effect => {
            if (!target.isImmuneToEffect(effect)) {
                target.addEffect({
                    name: effect,
                    duration: ability.duration || 3
                });
            }
        });

        // Apply damage
        target.status.hp = Math.max(0, target.status.hp - baseDamage);

        return {
            success: true,
            damage: baseDamage,
            effects: [...(ability.effects || []), ...additionalEffects]
        };
    }
}
import { JobInterface, JOBS } from './index.js';

export class Ninja extends JobInterface {
    static getDescription() {
        return "Highly skilled infiltrators and combat specialists who excel in stealth and agility. Masters of deception who can throw weapons, walk on walls, and create illusions. Their versatile skillset combines offensive capabilities with exceptional mobility and evasion, making them equally adept at combat and covert operations.";
    }

    static getBaseStats() {
        return {
            hp: 95,
            mp: 60,
            pa: 9,
            ma: 7,
            sp: 11,
            ev: 8
        };
    }

    static getGrowthRates() {
        return {
            hp: 32,
            mp: 12,
            pa: 0.4,
            ma: 0.3,
            sp: 0.6,
            ev: 0.4
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Ninjutsu',
                abilities: {
                    THROW: {
                        name: 'Throw',
                        type: 'special',
                        power: 'weapon_dependent',
                        mp: 0,
                        jpCost: 200,
                        description: 'Throw any weapon as a projectile'
                    },
                    SHADOW_WALK: {
                        name: 'Shadow Walk',
                        type: 'dungeon',
                        effect: 'stealth_movement',
                        mp: 15,
                        jpCost: 300,
                        description: 'Move silently through areas undetected'
                    },
                    WALL_WALK: {
                        name: 'Wall Walk',
                        type: 'dungeon',
                        effect: 'traverse_walls',
                        mp: 25,
                        jpCost: 400,
                        description: 'Walk on walls to bypass obstacles'
                    },
                    SMOKE_BOMB: {
                        name: 'Smoke Bomb',
                        type: 'status',
                        effect: 'blind',
                        aoe: true,
                        mp: 12,
                        jpCost: 250,
                        description: 'Create smoke screen that blinds enemies'
                    },
                    INFILTRATE: {
                        name: 'Infiltrate',
                        type: 'dungeon',
                        effect: 'bypass_enemies',
                        mp: 20,
                        jpCost: 350,
                        description: 'Sneak past enemy patrols undetected'
                    },
                    FLAME_VEIL: {
                        name: 'Flame Veil',
                        type: 'magical',
                        element: 'fire',
                        power: 1.8,
                        mp: 16,
                        jpCost: 300,
                        description: 'Fire-based ninjutsu attack'
                    },
                    WATER_VEIL: {
                        name: 'Water Veil',
                        type: 'magical',
                        element: 'water',
                        power: 1.9,
                        mp: 20,
                        jpCost: 300,
                        description: 'Water-based ninjutsu attack'
                    },
                    SHADOW_STITCH: {
                        name: 'Shadow Stitch',
                        type: 'status',
                        effect: 'immobilize',
                        mp: 18,
                        jpCost: 350,
                        description: 'Bind target\'s shadow to prevent movement'
                    },
                    MIRROR_IMAGE: {
                        name: 'Mirror Image',
                        type: 'buff',
                        effect: 'create_decoy',
                        mp: 28,
                        jpCost: 450,
                        description: 'Create illusory copies to evade attacks'
                    },
                    ASSASSINATE: {
                        name: 'Assassinate',
                        type: 'physical',
                        power: 3.0,
                        effect: 'instant_death',
                        mp: 45,
                        jpCost: 600,
                        description: 'Powerful strike with chance of instant death'
                    }
                }
            },
            reaction: {
                VANISH: {
                    name: 'Vanish',
                    chance: 0.3,
                    effect: 'temporary_invisibility',
                    jpCost: 400,
                    description: 'Become temporarily invisible when hit'
                },
                SHADOW_RETURN: {
                    name: 'Shadow Return',
                    chance: 0.25,
                    effect: 'counter_with_status',
                    jpCost: 500,
                    description: 'Counter attacks with status effect'
                }
            },
            support: {
                DUAL_WIELD: {
                    name: 'Dual Wield',
                    effect: 'enable_dual_wielding',
                    jpCost: 500,
                    description: 'Equip weapons in both hands'
                },
                STEALTH: {
                    name: 'Stealth',
                    effect: 'improve_sneaking',
                    jpCost: 400,
                    description: 'Improved stealth movement and detection avoidance'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Archer]: 3,
            [JOBS.Thief]: 4,
            [JOBS.Geomancer]: 2
        };
    }

    // Track active effects
    static activeNinjaEffects = new Map();

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'THROW':
                return this._resolveThrow(user, ability, target);
            case 'MIRROR_IMAGE':
                return this._resolveMirrorImage(user, ability, target);
            case 'ASSASSINATE':
                return this._resolveAssassinate(user, ability, target);
            case 'SHADOW_STITCH':
                return this._resolveShadowStitch(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveThrow(user, ability, target) {
        const { item } = ability;
        if (!item) {
            return {
                success: false,
                message: 'No item specified to throw'
            };
        }

        // Remove item from inventory
        const itemIndex = user.inventory.findIndex(i => i.id === item.id);
        if (itemIndex === -1) {
            return {
                success: false,
                message: 'Item not found in inventory'
            };
        }

        user.inventory.splice(itemIndex, 1);

        // Calculate throw effect - items are more effective when thrown
        const throwMultiplier = 1.5;
        let effect;

        const damage = Math.floor((item.stats?.pa + user.GetStats().pa) * throwMultiplier);
        target.status.hp = Math.max(0, target.status.hp - damage);
        effect = {
            type: 'damage',
            value: damage
        };

        return {
            success: true,
            message: `Threw ${item.name}`,
            effect
        };
    }

    static _resolveMirrorImage(user, ability, target) {
        // Create illusory copies for evasion
        const stats = user.getStats();
        const copies = Math.floor(1 + (stats.ma * 0.1));
        
        const effect = {
            name: 'mirror_image',
            duration: 3,
            power: stats.ma * 0.2,
            copies,
            onAttacked: (target, damage) => {
                if (effect.copies > 0) {
                    effect.copies--;
                    return 0; // Damage is negated
                }
                return damage; // Take full damage when no copies remain
            }
        };

        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
            this._addNinjaEffect(target, effect);
        }

        return {
            success: true,
            message: `${copies} mirror images appear around ${target.name}`,
            effects: [effect]
        };
    }

    static _resolveAssassinate(user, ability, target) {
        // High damage attack with chance of instant death
        const stats = user.getStats();
        const baseDamage = Math.floor(stats.pa * ability.power);
        
        // Calculate instant death chance
        const levelDiff = stats.level - target.level;
        const deathChance = Math.min(0.3, 0.1 + (levelDiff * 0.02) + (stats.sp * 0.005));

        if (Math.random() < deathChance && !target.isImmuneToEffect('instant_death')) {
            target.status.hp = 0;
            return {
                success: true,
                message: `${target.name} is instantly defeated!`,
                instantDeath: true
            };
        }

        // Apply regular damage if instant death fails
        const damage = Math.floor(baseDamage * (1 + (stats.sp * 0.01)));
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            message: `${target.name} takes ${damage} assassination damage`
        };
    }

    static _resolveShadowStitch(user, ability, target) {
        // Bind target by pinning their shadow
        const stats = user.getStats();
        const shadowPower = Math.floor(stats.ma * 0.8 + stats.sp * 0.2);
        
        // Calculate success chance based on speed difference
        const speedDiff = stats.sp - target.getStats().sp;
        const baseChance = 0.6 + (speedDiff * 0.02);
        const successRate = Math.min(0.9, Math.max(0.3, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: `${target.name} evades the shadow binding`
            };
        }

        const effect = {
            name: 'shadow_stitch',
            duration: 2,
            power: shadowPower,
            penalties: {
                movement: 0,
                evasion: 0.5,
                speed: 0.4
            }
        };

        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
            this._addNinjaEffect(target, effect);
        }

        return {
            success: true,
            message: `${target.name}'s shadow is bound`,
            effects: [effect]
        };
    }

    static _addNinjaEffect(target, effect) {
        if (!target.id) {
            target.id = Math.random().toString(36).substr(2, 9);
        }

        let activeEffects = this.activeNinjaEffects.get(target.id) || [];
        // Remove any existing effect of the same type
        activeEffects = activeEffects.filter(e => e.name !== effect.name);
        // Add new effect
        activeEffects.push(effect);
        this.activeNinjaEffects.set(target.id, activeEffects);
    }
}
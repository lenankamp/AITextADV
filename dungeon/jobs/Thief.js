import { JobInterface, JOBS } from './index.js';


export class Thief extends JobInterface {
    static getDescription() {
        return "Masters of stealth and acquisition who excel at obtaining resources through cunning. Their high speed and evasion make them difficult targets, while their stealing abilities provide crucial resources and strategic advantages. In dungeons, they are essential for disarming traps, picking locks, and finding hidden treasures, making them invaluable for exploration and resource gathering.";
    }
    static getBaseStats() {
        return {
            hp: 90,
            mp: 45,
            pa: 8,
            ma: 5,
            sp: 10,
            ev: 9
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 10,
            pa: 0.3,
            ma: 0.2,
            sp: 0.5,
            ev: 0.4
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Thievery',
                abilities: {
                    STEAL_GIL: {
                        name: 'Steal Gil',
                        type: 'special',
                        mp: 0,
                        jpCost: 200
                    },
                    STEAL_ITEM: {
                        name: 'Steal Item',
                        type: 'special',
                        mp: 0,
                        jpCost: 300
                    },
                    STEAL_WEAPON: {
                        name: 'Steal Weapon',
                        type: 'special',
                        mp: 10,
                        jpCost: 400
                    },
                    STEAL_HEART: {
                        name: 'Steal Heart',
                        type: 'status',
                        effect: 'charm',
                        mp: 18,
                        jpCost: 350
                    },
                    STEAL_EXP: {
                        name: 'Steal EXP',
                        type: 'special',
                        mp: 25,
                        jpCost: 450
                    },
                    MUG: {
                        name: 'Mug',
                        type: 'physical',
                        power: 1.5,
                        effect: 'damage_and_steal',
                        mp: 15,
                        jpCost: 400
                    },
                    TRAPSMITH: {
                        name: 'Trapsmith',
                        type: 'dungeon',
                        effect: ['detect_traps'],
                        autoDisarm: true,
                        mp: 18,
                        jpCost: 350,
                        description: 'Detect and safely disarm traps in the area'
                    },
                    LOCKPICK: {
                        name: 'Lockpick',
                        type: 'dungeon',
                        effect: 'unlock',
                        mp: 10,
                        jpCost: 200,
                        description: 'Pick locks on doors and chests'
                    },
                    PILFER: {
                        name: 'Pilfer',
                        type: 'special',
                        mp: 20,
                        jpCost: 500,
                        description: 'Steals positive status effects from target'
                    }
                }
            },
            reaction: {
                VIGILANCE: {
                    name: 'Vigilance',
                    chance: 0.3,
                    effect: 'detect_ambush',
                    jpCost: 300,
                    description: 'Chance to detect and prevent surprise attacks'
                },
                STICKY_FINGERS: {
                    name: 'Sticky Fingers',
                    chance: 0.25,
                    effect: 'counter_steal',
                    jpCost: 400,
                    description: 'Chance to steal items when hit'
                }
            },
            support: {
                TREASURE_HUNTER: {
                    name: 'Treasure Hunter',
                    effect: 'increase_steal_rate',
                    jpCost: 400,
                    description: 'Improves success rate of stealing abilities'
                },
                TRAP_MASTERY: {
                    name: 'Trap Mastery',
                    effect: ['extended_trap_detection', 'auto_disarm'],
                    jpCost: 450,
                    description: 'Enhances trap detection range and grants chance to auto-disarm'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Archer]: 2
        };
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'PILFER':
                return this._resolvePilfer(user, ability, target);
            case 'STEAL_GIL':
                return this._resolveStealGil(user, ability, target);
            case 'STEAL_ITEM':
                return this._resolveStealItem(user, ability, target);
            case 'STEAL_WEAPON':
                return this._resolveStealEquipment(user, ability, target, 'mainHand');
            case 'STEAL_ARMOR':
                return this._resolveStealEquipment(user, ability, target, 'body');
            case 'STEAL_ACCESSORY':
                return this._resolveStealEquipment(user, ability, target, 'accessory');
            case 'MUG':
                return this._resolveMug(user, ability, target);
            case 'STEAL_EXP':
                return this._resolveStealExp(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveStealExp(user, ability, target) {
        const baseChance = 0.2 + (user.getStats().sp - target.getStats().sp) * 0.02;
        const successRate = Math.min(0.8, Math.max(0.1, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Failed to steal EXP'
            };
        }

        const stolenExp = Math.floor(target.level * (10 + Math.random() * 20));
        target.exp -= stolenExp;
        user.exp += stolenExp;

        return {
            success: true,
            message: `Stole ${stolenExp} EXP`,
            stolenExp
        };
    }

    static _resolvePilfer(user, ability, target) {
        if (!target.status) {
            return {
                success: false,
                message: 'Target has no status effects to steal'
            };
        }

        const stolenEffects = Object.keys(target.status).filter(key => key !== 'hp' && Math.random() < 0.5);
        if (stolenEffects.length === 0) {
            return {
                success: false,
                message: 'Failed to steal status effects'
            };
        }

        // Copy and remove effects from target
        const stolenEffectsData = {};
        stolenEffects.forEach(key => {
            stolenEffectsData[key] = target.status[key];
            delete target.status[key];
        });

        // Add to user
        user.status = {
            ...user.status,
            ...stolenEffectsData
        };

        return {
            success: true,
            message: `Stole ${stolenEffects.join(', ')}`,
            stolenEffects: stolenEffectsData
        };
    }

    static _resolveStealGil(user, ability, target) {
        // Base success rate based on user's speed vs target's speed
        const baseChance = 0.5 + (user.getStats().sp - target.getStats().sp) * 0.05;
        const successRate = Math.min(0.95, Math.max(0.05, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Failed to steal gil'
            };
        }

        // Amount of gil stolen based on target's level and a random factor
        const stolenAmount = Math.floor(target.level * (10 + Math.random() * 20));
        
        // Add gil to user's inventory/wallet
        user.gil = (user.gil || 0) + stolenAmount;

        return {
            success: true,
            message: `Stole ${stolenAmount} gil`,
            stolenGil: stolenAmount
        };
    }

    static _resolveStealItem(user, ability, target) {
        const baseChance = 0.4 + (user.getStats().sp - target.getStats().sp) * 0.04;
        const successRate = Math.min(0.9, Math.max(0.1, baseChance));

        if (!target.inventory || target.inventory.length === 0) {
            return {
                success: false,
                message: 'Target has no items to steal'
            };
        }

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Failed to steal item'
            };
        }

        // Select random item from target's inventory
        const itemIndex = Math.floor(Math.random() * target.inventory.length);
        const stolenItem = target.inventory[itemIndex];
        
        // Remove from target and add to user
        target.inventory.splice(itemIndex, 1);
        user.inventory.push(stolenItem);

        return {
            success: true,
            message: `Stole ${stolenItem.name}`,
            stolenItem
        };
    }

    static _resolveStealEquipment(user, ability, target, slot) {
        const baseChance = 0.3 + (user.getStats().sp - target.getStats().sp) * 0.03;
        const successRate = Math.min(0.75, Math.max(0.05, baseChance));

        if (!target.equipment[slot]) {
            return {
                success: false,
                message: `Target has no equipment in ${slot}`
            };
        }

        if (Math.random() > successRate) {
            return {
                success: false,
                message: `Failed to steal ${slot} equipment`
            };
        }

        const stolenEquipment = target.equipment[slot];
        target.equipment[slot] = null;
        user.inventory.push(stolenEquipment);

        return {
            success: true,
            message: `Stole ${stolenEquipment.name}`,
            stolenEquipment
        };
    }

    static _resolveMug(user, ability, target) {
        // Mug combines a physical attack with steal
        const stats = user.getStats();
        const damage = Math.floor(stats.pa * ability.power);
        
        // Apply damage
        target.status.hp = Math.max(0, target.status.hp - damage);

        // Try to steal with increased success rate
        const stealResult = this._resolveStealGil(user, {
            ...ability,
            successRateBonus: 0.2
        }, target);

        return {
            success: true,
            damage,
            effects: ability.effects || [],
            stealResult
        };
    }
}
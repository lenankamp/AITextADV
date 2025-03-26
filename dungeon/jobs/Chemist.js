import { JobInterface, JOBS } from './index.js';

export class Chemist extends JobInterface {
    static getDescription() {
        return "Masters of item manipulation and alchemy. Specializing in item usage, creation, and enhancement, they provide crucial support through potions and crafted goods. Their expertise allows them to identify, analyze, and mix items for maximum effectiveness.";
    }

    static getBaseStats() {
        return {
            hp: 90,
            mp: 70,
            pa: 6,
            ma: 8,
            sp: 7,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 25,
            mp: 15,
            pa: 0.2,
            ma: 0.3,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Item',
                abilities: {
                    USE_POTION: {
                        name: 'Use Potion',
                        type: 'healing',
                        effect: 'enhance_item',
                        jpCost: 100,
                        description: 'Use healing items with increased effectiveness'
                    },
                    THROW_ITEM: {
                        name: 'Throw Item',
                        type: 'special',
                        power: 'item_dependent',
                        jpCost: 200,
                        description: 'Throw items at enemies for various effects'
                    },
                    MIX: {
                        name: 'Mix',
                        type: 'special',
                        mp: 10,
                        jpCost: 400,
                        description: 'Combine two items for unique effects'
                    },
                    ANALYZE: {
                        name: 'Analyze',
                        type: 'analyze',
                        mp: 12,
                        jpCost: 250,
                        description: 'Reveal enemy stats and weaknesses'
                    },
                    BREW_POTION: {
                        name: 'Brew Potion',
                        type: 'special',
                        mp: 15,
                        jpCost: 300,
                        description: 'Create basic healing potion'
                    },
                    ANTIDOTE_BREW: {
                        name: 'Antidote Brew',
                        type: 'special',
                        mp: 15,
                        jpCost: 300,
                        description: 'Create antidote for status effects'
                    },
                    SAMPLE: {
                        name: 'Sample',
                        type: 'special',
                        mp: 20,
                        jpCost: 350,
                        description: 'Extract useful components from monsters'
                    },
                    BOMB_CRAFT: {
                        name: 'Bomb Craft',
                        type: 'special',
                        mp: 25,
                        jpCost: 450,
                        description: 'Create explosive items from materials'
                    },
                    MEGA_POTION: {
                        name: 'Mega Potion',
                        type: 'healing',
                        aoe: true,
                        jpCost: 600,
                        description: 'Use powerful healing potion that affects area'
                    },
                    ELIXIR_CRAFT: {
                        name: 'Elixir Craft',
                        type: 'special',
                        jpCost: 800,
                        description: 'Use powerful elixir that fully restores and buffs'
                    }
                }
            },
            reaction: {
                AUTO_POTION: {
                    name: 'Auto Potion',
                    chance: 0.35,
                    effect: 'use_potion_when_hurt',
                    jpCost: 400,
                    description: 'Automatically use potion when damaged'
                },
                QUICK_POCKET: {
                    name: 'Quick Pocket',
                    chance: 0.3,
                    effect: 'free_item_use',
                    jpCost: 450,
                    description: 'Chance to use items without consuming them'
                }
            },
            support: {
                ITEM_BOOST: {
                    name: 'Item Boost',
                    effect: 'improve_item_effect',
                    jpCost: 500,
                    description: 'Increase effectiveness of used items'
                },
                MEDICINE_LORE: {
                    name: 'Medicine Lore',
                    effect: 'improve_healing',
                    jpCost: 400,
                    description: 'Increase healing from items and abilities'
                }
            }
        };
    }

    static getRequirements() {
        return null; // Base job, no requirements
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'MIX':
                return this._resolveMix(user, ability, target);
            case 'THROW_ITEM':
                return this._resolveThrowItem(user, ability, target);
            case 'SALVE':
                return this._resolveSalve(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveMix(user, ability, target) {
        const { item1, item2 } = ability.items;
        if (!item1 || !item2) {
            return {
                success: false,
                message: 'Two items are required for mixing'
            };
        }

        // Remove items from inventory
        const item1Index = user.inventory.findIndex(i => i.id === item1.id);
        const item2Index = user.inventory.findIndex(i => i.id === item2.id);
        
        if (item1Index === -1 || item2Index === -1) {
            return {
                success: false,
                message: 'Required items not found in inventory'
            };
        }

        user.inventory.splice(item1Index, 1);
        user.inventory.splice(item2Index > item1Index ? item2Index - 1 : item2Index, 1);

        // Calculate mix effect based on item combinations
        const mixResult = this._calculateMixEffect(item1, item2);
        
        // Apply the mixed effect
        if (mixResult.type === 'damage') {
            target.status.hp = Math.max(0, target.status.hp - mixResult.value);
        } else if (mixResult.type === 'healing') {
            target.status.hp = Math.min(target.getMaxHP(), target.status.hp + mixResult.value);
        }

        // Apply any status effects from the mix
        if (mixResult.effects) {
            mixResult.effects.forEach(effect => {
                if (!target.isImmuneToEffect(effect.name)) {
                    target.addEffect(effect);
                }
            });
        }

        return {
            success: true,
            ...mixResult
        };
    }

    static _resolveThrowItem(user, ability, target) {
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

        if (item.type === 'potion') {
            const healAmount = Math.floor(item.power * throwMultiplier);
            target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healAmount);
            effect = {
                type: 'healing',
                value: healAmount
            };
        } else if (item.type === 'damage_item') {
            const damage = Math.floor(item.power * throwMultiplier);
            target.status.hp = Math.max(0, target.status.hp - damage);
            effect = {
                type: 'damage',
                value: damage
            };
        }

        return {
            success: true,
            message: `Threw ${item.name}`,
            effect
        };
    }

    static _resolveSalve(user, ability, target) {
        // Salve applies an item effect to all allies without consuming the item
        const { item } = ability;
        if (!item) {
            return {
                success: false,
                message: 'No item specified for salve'
            };
        }

        // Check if user has the item
        const hasItem = user.inventory.some(i => i.id === item.id);
        if (!hasItem) {
            return {
                success: false,
                message: 'Required item not found in inventory'
            };
        }

        // Calculate effect (weaker than normal use but affects all)
        const salveMultiplier = 0.7;
        let effect;

        if (item.type === 'potion') {
            const healAmount = Math.floor(item.power * salveMultiplier);
            target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healAmount);
            effect = {
                type: 'healing',
                value: healAmount
            };
        }

        // Apply any status effects
        if (item.effects) {
            item.effects.forEach(effect => {
                if (!target.isImmuneToEffect(effect.name)) {
                    target.addEffect({
                        ...effect,
                        duration: Math.floor(effect.duration * salveMultiplier)
                    });
                }
            });
        }

        return {
            success: true,
            message: `Applied ${item.name} as salve`,
            effect,
            aoe: true
        };
    }

    static _calculateMixEffect(item1, item2) {
        // Define mix combinations and their effects
        const mixTable = {
            'potion_potion': {
                type: 'healing',
                value: (i1, i2) => Math.floor((i1.power + i2.power) * 1.5),
                effects: [{
                    name: 'regen',
                    duration: 3
                }]
            },
            'potion_ether': {
                type: 'healing',
                value: (i1, i2) => Math.floor((i1.power + i2.power) * 1.2),
                effects: [{
                    name: 'refresh',
                    duration: 3
                }]
            },
            'phoenix_down_potion': {
                type: 'healing',
                value: (i1, i2) => Math.floor(i2.power * 2),
                effects: [{
                    name: 'reraise',
                    duration: 5
                }]
            }
            // Add more combinations as needed
        };

        const mixKey = `${item1.type}_${item2.type}`;
        const mix = mixTable[mixKey] || mixTable[`${item2.type}_${item1.type}`];

        if (!mix) {
            return {
                type: 'healing',
                value: Math.floor((item1.power + item2.power) * 0.8) // Default mix is less effective
            };
        }

        return {
            type: mix.type,
            value: mix.value(item1, item2),
            effects: mix.effects
        };
    }
}
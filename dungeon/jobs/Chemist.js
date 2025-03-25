import { JobInterface } from './JobInterface.js';
import { JOBS } from './constants.js';

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
}
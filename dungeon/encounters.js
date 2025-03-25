// Trap types and effects
const TRAP_TYPES = {
    SPIKE: {
        name: 'Spike Trap',
        damage: 'level * 15',
        saveType: 'dexterity',
        saveDC: 'level * 2 + 10',
        description: 'Sharp spikes spring from the floor'
    },
    POISON_DART: {
        name: 'Poison Dart Trap',
        damage: 'level * 10',
        effect: {
            name: 'poison',
            duration: 3,
            damagePerTurn: 'level * 5'
        },
        saveType: 'dexterity',
        saveDC: 'level * 2 + 8',
        description: 'Poisoned darts shoot from the walls'
    },
    MAGIC_RUNE: {
        name: 'Magic Rune Trap',
        damage: 'level * 20',
        saveType: 'wisdom',
        saveDC: 'level * 2 + 12',
        description: 'A magical rune explodes with arcane energy'
    },
    GAS: {
        name: 'Gas Trap',
        effect: {
            name: 'sleep',
            duration: 2,
            saveDC: 'level * 2 + 10'
        },
        saveType: 'constitution',
        saveDC: 'level * 2 + 10',
        description: 'Sleep-inducing gas fills the area'
    },
    PIT: {
        name: 'Pit Trap',
        damage: 'level * 25',
        saveType: 'dexterity',
        saveDC: 'level * 2 + 15',
        description: 'The floor gives way to a deep pit'
    }
};

// Treasure types and their possible contents
const TREASURE_TYPES = {
    COMMON: {
        gold: { min: 10, max: 50 },
        items: ['Potion of Healing', 'Throwing Knife', 'Torch'],
        itemChance: 0.5,
        maxItems: 2
    },
    UNCOMMON: {
        gold: { min: 50, max: 200 },
        items: ['Greater Healing Potion', 'Magic Scroll', 'Enchanted Ring'],
        itemChance: 0.7,
        maxItems: 3
    },
    RARE: {
        gold: { min: 200, max: 1000 },
        items: ['Superior Healing Potion', 'Magic Weapon', 'Protective Amulet'],
        itemChance: 0.9,
        maxItems: 4
    },
    BOSS: {
        gold: { min: 1000, max: 5000 },
        items: ['Legendary Weapon', 'Artifact', 'Rare Spell Scroll'],
        itemChance: 1,
        maxItems: 5,
        guaranteedRare: true
    }
};

// Class to handle trap mechanics
class TRAPMANAGER {
    constructor(level = 1) {
        this.level = level;
    }

    createTrap(type) {
        const trapTemplate = TRAP_TYPES[type];
        if (!trapTemplate) {
            throw new Error(`Unknown trap type: ${type}`);
        }

        return {
            ...trapTemplate,
            level: this.level,
            triggered: false,
            detected: false
        };
    }

    detectTrap(character, trap) {
        // Base detection chance based on character's wisdom and level
        const detectionDC = this._calculateDC(trap.saveDC);
        const detectionBonus = Math.floor(character.stats.wisdom / 2) + Math.floor(character.level / 2);
        const roll = Math.floor(Math.random() * 20) + 1 + detectionBonus;

        return roll >= detectionDC;
    }

    triggerTrap(character, trap) {
        if (trap.triggered) {
            return { success: false, message: 'Trap has already been triggered' };
        }

        // Attempt saving throw
        const saveDC = this._calculateDC(trap.saveDC);
        const saveBonus = Math.floor(character.stats[trap.saveType.toLowerCase()] / 2);
        const roll = Math.floor(Math.random() * 20) + 1 + saveBonus;
        const saved = roll >= saveDC;

        let damage = 0;
        let effect = null;

        if (trap.damage) {
            // Calculate damage
            damage = this._calculateValue(trap.damage);
            if (saved) {
                damage = Math.floor(damage / 2);
            }
        }

        if (trap.effect && (!saved || trap.effect.always)) {
            effect = { ...trap.effect };
            if (effect.damagePerTurn) {
                effect.damagePerTurn = this._calculateValue(effect.damagePerTurn);
            }
        }

        trap.triggered = true;

        return {
            success: true,
            saved: saved,
            damage: damage,
            effect: effect,
            message: `${trap.description}! ${saved ? 'Partially avoided!' : 'Failed to avoid!'}`
        };
    }

    _calculateDC(formula) {
        return this._calculateValue(formula);
    }

    _calculateValue(formula) {
        try {
            const level = this.level;
            return Math.floor(eval(formula));
        } catch (e) {
            console.error('Error calculating trap value:', e);
            return 0;
        }
    }
}

// Class to handle treasure generation
class TREASUREMANAGER {
    constructor(level = 1) {
        this.level = level;
    }

    generateTreasure(type = 'COMMON') {
        const template = TREASURE_TYPES[type];
        if (!template) {
            throw new Error(`Unknown treasure type: ${type}`);
        }

        const treasure = {
            gold: this._calculateGold(template.gold),
            items: this._generateItems(template)
        };

        return treasure;
    }

    _calculateGold(range) {
        const base = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        return Math.floor(base * (1 + (this.level - 1) * 0.1)); // 10% increase per level
    }

    _generateItems(template) {
        const items = [];
        const numItems = Math.floor(Math.random() * template.maxItems) + 1;

        for (let i = 0; i < numItems; i++) {
            if (Math.random() <= template.itemChance) {
                const item = this._selectItem(template.items);
                if (item) {
                    items.push(this._createItem(item));
                }
            }
        }

        // Add guaranteed rare item for boss chests
        if (template.guaranteedRare) {
            items.push(this._createItem(this._selectItem(template.items), true));
        }

        return items;
    }

    _selectItem(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    _createItem(baseItem, isRare = false) {
        // Basic item template - in a full implementation, this would pull from an item database
        const item = {
            name: baseItem,
            level: this.level,
            quality: isRare ? 'rare' : this._determineQuality()
        };

        // Add modifiers based on quality and level
        this._addItemModifiers(item);

        return item;
    }

    _determineQuality() {
        const roll = Math.random();
        if (roll > 0.95) return 'rare';
        if (roll > 0.80) return 'uncommon';
        return 'common';
    }

    _addItemModifiers(item) {
        // Add level-appropriate modifiers
        const qualityMultiplier = {
            common: 1,
            uncommon: 1.5,
            rare: 2
        };

        // Example modifier for a weapon
        if (item.name.includes('Weapon')) {
            item.damage = Math.floor(10 * qualityMultiplier[item.quality] * (1 + (item.level - 1) * 0.1));
        }
        // Example modifier for a potion
        else if (item.name.includes('Potion')) {
            item.healing = Math.floor(50 * qualityMultiplier[item.quality] * (1 + (item.level - 1) * 0.1));
        }
    }
}

// Encounter manager to handle both traps and treasures
class ENCOUNTERMANAGER {
    constructor(level = 1) {
        this.level = level;
        this.trapManager = new TRAPMANAGER(level);
        this.treasureManager = new TREASUREMANAGER(level);
    }

    generateRoomEncounters(room, difficulty = 'normal') {
        const encounters = [];
        
        // Determine number of encounters based on room size and difficulty
        const maxEncounters = Math.floor((room.width * room.height) / 25); // One encounter per 25 squares
        const numEncounters = Math.floor(Math.random() * maxEncounters) + 1;

        for (let i = 0; i < numEncounters; i++) {
            if (Math.random() < this._getEncounterChance(difficulty)) {
                encounters.push(this._generateEncounter(difficulty));
            }
        }

        return encounters;
    }

    _getEncounterChance(difficulty) {
        switch (difficulty) {
            case 'easy': return 0.3;
            case 'normal': return 0.5;
            case 'hard': return 0.7;
            case 'boss': return 1.0;
            default: return 0.5;
        }
    }

    _generateEncounter(difficulty) {
        // Determine if it's a trap or treasure
        const isTrap = Math.random() < this._getTrapChance(difficulty);

        if (isTrap) {
            const trapType = this._selectRandomTrapType(difficulty);
            return {
                type: 'trap',
                content: this.trapManager.createTrap(trapType)
            };
        } else {
            const treasureType = this._selectTreasureType(difficulty);
            return {
                type: 'treasure',
                content: this.treasureManager.generateTreasure(treasureType)
            };
        }
    }

    _getTrapChance(difficulty) {
        switch (difficulty) {
            case 'easy': return 0.4;
            case 'normal': return 0.5;
            case 'hard': return 0.7;
            case 'boss': return 0.3; // Boss rooms favor treasure
            default: return 0.5;
        }
    }

    _selectRandomTrapType(difficulty) {
        const trapTypes = Object.keys(TRAP_TYPES);
        let index = Math.floor(Math.random() * trapTypes.length);
        
        // Adjust trap selection based on difficulty
        if (difficulty === 'easy') {
            index = Math.min(index, 2); // Limit to simpler traps
        } else if (difficulty === 'boss') {
            index = Math.max(index, trapTypes.length - 2); // Favor more dangerous traps
        }

        return trapTypes[index];
    }

    _selectTreasureType(difficulty) {
        switch (difficulty) {
            case 'easy': return 'COMMON';
            case 'normal': return Math.random() < 0.7 ? 'COMMON' : 'UNCOMMON';
            case 'hard': return Math.random() < 0.6 ? 'UNCOMMON' : 'RARE';
            case 'boss': return 'BOSS';
            default: return 'COMMON';
        }
    }
}

export {
    TRAP_TYPES,
    TREASURE_TYPES,
    TRAPMANAGER,
    TREASUREMANAGER,
    ENCOUNTERMANAGER
};
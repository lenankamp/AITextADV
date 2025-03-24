import { Character } from './character.js';

// Combat-specific constants
const COMBAT_STATES = {
    ACTIVE: 'active',
    FINISHED: 'finished'
};

const COMBAT_RESULTS = {
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    FLEE: 'flee'
};

// Monster template for creating enemies
class Monster extends Character {
    constructor(template) {
        super(template.name);
        this.level = template.level || 1;
        this.baseStats = template.stats;
        this.currentJob = 'monster';
        this.position = template.position || 'front'; // 'front' or 'back' row
        this.jobs = {
            monster: {
                level: this.level,
                jp: 0,
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: template.abilities,
                    reaction: {},
                    support: {}
                }
            }
        };
        this.equipment = template.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.experience = template.experience || this.level * 50;
        this.loot = template.loot || [];
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };
    }

    // Override getStats to ensure monster stats are calculated correctly
    getStats() {
        return {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            pa: this.baseStats.pa,
            ma: this.baseStats.ma,
            sp: this.baseStats.sp,
            ev: this.baseStats.ev
        };
    }

    getMaxHP() {
        return this.baseStats.hp;
    }

    getMaxMP() {
        return this.baseStats.mp;
    }

    // Override useAbility to handle row positioning
    useAbility(ability, target) {
        const abilities = this.getAvailableAbilities();
        let abilityData = abilities.active[ability];
        
        if (!abilityData) {
            return { success: false, message: 'Ability not found' };
        }

        if (this.status.mp < abilityData.mp) {
            return { success: false, message: 'Not enough MP' };
        }

        // Check if physical attack is valid from back row
        if (this.position === 'back' && abilityData.type === 'physical' && !abilityData.ranged) {
            return { success: false, message: 'Cannot use melee attack from back row' };
        }

        // Calculate damage reduction for back row targets
        const originalDamage = super.useAbility(ability, target);
        if (target.position === 'back' && abilityData.type === 'physical') {
            // Reduce physical damage by 50% for back row
            if (originalDamage.damage) {
                originalDamage.damage = Math.floor(originalDamage.damage * 0.5);
            }
        }

        return originalDamage;
    }

    getAIAction(targets) {
        const abilities = this.getAvailableAbilities();
        const activeAbilities = Object.entries(abilities.active);
        
        if (activeAbilities.length === 0) {
            return null;
        }

        // Filter abilities based on MP cost and conditions
        const usableAbilities = activeAbilities.filter(([id, ability]) => {
            if (this.status.mp < (ability.mp || 0)) return false;
            if (ability.type === 'dungeon') return false; // Can't use dungeon abilities in combat
            
            // Don't use healing if at full health
            if (ability.type === 'healing' && this.status.hp === this.getMaxHP()) return false;
            
            return true;
        });

        if (usableAbilities.length === 0) {
            return null;
        }

        // Prioritize certain types of abilities based on conditions
        const prioritizedAbilities = this._prioritizeAbilities(usableAbilities, targets);
        const [chosenAbilityId, chosenAbility] = prioritizedAbilities[Math.floor(Math.random() * prioritizedAbilities.length)];

        // Handle targeting based on ability type
        const validTargets = this._getValidTargetsForAbility(chosenAbility, targets);
        const target = this._selectBestTarget(chosenAbility, validTargets);

        return {
            type: 'ability',
            ability: chosenAbilityId,
            target: target
        };
    }

    _prioritizeAbilities(abilities, targets) {
        // Sort abilities based on current situation
        const prioritized = [...abilities];
        
        // If low on health, prioritize healing
        if (this.status.hp < this.getMaxHP() * 0.3) {
            prioritized.sort(([, a], [, b]) => {
                if (a.type === 'healing' && b.type !== 'healing') return -1;
                if (a.type !== 'healing' && b.type === 'healing') return 1;
                return 0;
            });
        }
        
        // If enemies are clustered, prioritize AoE
        if (targets.length > 2) {
            prioritized.sort(([, a], [, b]) => {
                if (a.aoe && !b.aoe) return -1;
                if (!a.aoe && b.aoe) return 1;
                return 0;
            });
        }

        // If we have status effects to apply and none are applied, prioritize them
        const noEffectsOnTargets = targets.every(t => t.status.effects.length === 0);
        if (noEffectsOnTargets) {
            prioritized.sort(([, a], [, b]) => {
                if (a.type === 'status' && b.type !== 'status') return -1;
                if (a.type !== 'status' && b.type === 'status') return 1;
                return 0;
            });
        }

        return prioritized;
    }

    // Override to handle row positioning in AI
    _getValidTargetsForAbility(ability, targets) {
        // Filter out back row targets for melee attacks if not ranged
        if (ability.type === 'physical' && !ability.ranged) {
            return targets.filter(t => t.position === 'front');
        }
        return super._getValidTargetsForAbility(ability, targets);
    }

    _selectBestTarget(ability, targets) {
        if (targets.length === 0) return null;
        
        switch (ability.type) {
            case 'healing':
                // Target lowest HP
                return targets.reduce((lowest, current) => 
                    (current.status.hp / current.getMaxHP()) < (lowest.status.hp / lowest.getMaxHP())
                        ? current : lowest
                );
            
            case 'drain':
                //   highest HP for HP drain, highest MP for MP drain
                if (ability.effect === 'mp_drain') {
                    return targets.reduce((highest, current) => 
                        current.status.mp > highest.status.mp ? current : highest
                    );
                } else {
                    return targets.reduce((highest, current) => 
                        current.status.hp > highest.status.hp ? current : highest
                    );
                }
            
            case 'status':
                // Target without the effect already
                return targets.find(t => !t.status.effects.some(e => e.name === ability.effect)) || 
                       targets[Math.floor(Math.random() * targets.length)];
            
            default:
                // For other types, just pick randomly
                return targets[Math.floor(Math.random() * targets.length)];
        }
    }
}

// Combat manager class
class CombatManager {
    constructor(party, monsters) {
        this.party = party;
        this.monsters = monsters;
        this.state = COMBAT_STATES.ACTIVE;
        this.turn = 0;
        this.turnOrder = [];
        this.timeUnits = 0;
        this.actionsThisTurn = new Map(); // Track who has acted this turn
        this.log = [];
        
        // Initialize turn order
        this._initializeTurnOrder();
    }

    _initializeTurnOrder() {
        // Combine party members and monsters with their base wait time
        this.turnOrder = [
            ...this.party.members.map(member => ({
                type: 'party',
                entity: member,
                waitTime: 0,
                baseSpeed: member.getStats().sp
            })),
            ...this.monsters.map(monster => ({
                type: 'monster',
                entity: monster,
                waitTime: 0,
                baseSpeed: monster.getStats().sp
            }))
        ];
    }

    _updateTurnOrder() {
        // Update wait times based on speed
        this.turnOrder.forEach(actor => {
            // Apply speed modifiers from status effects
            let currentSpeed = actor.baseSpeed;
            actor.entity.status.effects.forEach(effect => {
                if (effect.name === 'haste') currentSpeed *= 1.5;
                if (effect.name === 'slow') currentSpeed *= 0.5;
            });
            
            actor.waitTime += currentSpeed;
        });

        // Sort by wait time, highest first
        this.turnOrder.sort((a, b) => b.waitTime - a.waitTime);
    }

    getCurrentActor() {
        // Get the actor with the highest wait time that hasn't acted yet
        return this.turnOrder.find(actor => actor.waitTime >= 100 && !this.actionsThisTurn.has(actor.entity.name));
    }

    processAction(action) {
        const currentActor = this.getCurrentActor();
        
        if (!currentActor || this.state !== COMBAT_STATES.ACTIVE) {
            return false;
        }

        let result;
        if (currentActor.type === 'party') {
            result = this._processPartyAction(action, currentActor.entity);
        } else {
            result = this._processMonsterAction(currentActor.entity);
        }

        // Mark actor as having acted and reduce their wait time
        this.actionsThisTurn.set(currentActor.entity.name, true);
        currentActor.waitTime -= 100;

        this._logAction(currentActor.entity, action, result);
        this._advanceTurn();

        return result;
    }

    _advanceTurn() {
        // Check if all actors have acted
        const allActed = this.turnOrder.every(actor => 
            actor.waitTime < 100 || this.actionsThisTurn.has(actor.entity.name)
        );

        if (allActed) {
            // Start new turn
            this.turn++;
            this.actionsThisTurn.clear();
            this._updateTurnOrder();
            
            // Update status effects
            this.turnOrder.forEach(actor => {
                actor.entity.updateEffects();
            });
        }

        this._checkCombatEnd();
    }

    getValidTargets(actor) {
        const possibleTargets = actor.type === 'party' ? this.monsters : this.party.members;
        
        // For physical attacks from back row, only return front row targets
        if (actor.entity.position === 'back') {
            const ability = actor.entity.getAvailableAbilities().active[actor.ability];
            if (ability && ability.type === 'physical' && !ability.ranged) {
                return possibleTargets.filter(t => t.position === 'front');
            }
        }
        
        return possibleTargets;
    }

    _processPartyAction(action, actor) {
        switch (action.type) {
            case 'ability':
                return this._processAbility(actor, action.ability, action.target);
            case 'item':
                return this._useItem(actor, action.item, action.target);
            case 'flee':
                return this._attemptFlee(actor);
            default:
                return { success: false, message: 'Invalid action' };
        }
    }

    _processMonsterAction(monster) {
        const action = monster.getAIAction(this.party.members);
        if (!action) {
            return { success: false, message: 'No action available' };
        }
        return this._processAbility(monster, action.ability, action.target);
    }

    _processAbility(actor, abilityId, target) {
        const abilities = actor.getAvailableAbilities();
        const ability = abilities.active[abilityId];
        if (!ability) {
            return { success: false, message: 'Ability not found' };
        }

        // Handle AoE abilities
        if (ability.aoe) {
            const targets = actor instanceof Monster ? this.party.members : this.monsters;
            const results = targets.map(t => actor.useAbility(abilityId, t));
            
            // Combine all results into one
            const combinedResult = {
                success: results.some(r => r.success),
                damage: results.reduce((sum, r) => sum + (r.damage || 0), 0),
                healing: results.reduce((sum, r) => sum + (r.healing || 0), 0),
                effects: results.flatMap(r => r.effects || []),
                targets: targets.map((t, i) => ({ target: t, result: results[i] })),
                isAoe: true
            };

            return combinedResult;
        }

        // Single target ability
        return actor.useAbility(abilityId, target);
    }

    _useItem(actor, item, target) {
        // Check if actor has item
        const itemIndex = actor.inventory.indexOf(item);
        if (itemIndex === -1) {
            return { success: false, message: 'Item not found' };
        }

        // Apply item effects
        const result = item.use(target);
        if (result.success) {
            actor.inventory.splice(itemIndex, 1);
        }

        return result;
    }

    _attemptFlee(actor) {
        // Base 30% chance to flee, modified by level difference and dexterity
        const averageMonsterLevel = this.monsters.reduce((sum, m) => sum + m.level, 0) / this.monsters.length;
        const levelDiff = actor.level - averageMonsterLevel;
        const dexterityBonus = actor.stats.dexterity / 100;
        
        const fleeChance = 0.3 + (levelDiff * 0.05) + dexterityBonus;
        const success = Math.random() < fleeChance;

        if (success) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.FLEE;
        }

        return {
            success,
            message: success ? 'Successfully fled from combat!' : 'Failed to flee!'
        };
    }

    _checkCombatEnd() {
        if (this.party.isWiped()) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.DEFEAT;
        } else if (this.monsters.every(monster => monster.status.hp <= 0)) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.VICTORY;
            this._distributeExperienceAndLoot();
        }
    }

    _distributeExperienceAndLoot() {
        // Calculate total experience
        const totalExp = this.monsters.reduce((sum, monster) => sum + monster.experience, 0);
        const expPerMember = Math.floor(totalExp / this.party.members.length);

        // Distribute experience
        this.party.members.forEach(member => {
            member.experience += expPerMember;
            // Check for level up
            while (member.experience >= member.level * 100) {
                member.experience -= member.level * 100;
                member.levelUp();
            }
        });

        // Collect all loot
        const loot = this.monsters.reduce((items, monster) => [...items, ...monster.loot], []);
        return {
            experience: expPerMember,
            loot: loot
        };
    }

    _logAction(actor, action, result) {
        // Enhanced logging for AoE abilities
        if (result.isAoe && result.targets) {
            this.log.push({
                turn: this.turn,
                actor: actor.name,
                action: action,
                result: {
                    ...result,
                    targets: result.targets.map(t => ({
                        name: t.target.name,
                        damage: t.result.damage,
                        healing: t.result.healing,
                        effects: t.result.effects
                    }))
                }
            });
        } else {
            this.log.push({
                turn: this.turn,
                actor: actor.name,
                action: action,
                result: result
            });
        }
    }

    getCombatState() {
        return {
            state: this.state,
            result: this.result,
            turn: this.turn,
            currentActor: this.getCurrentActor(),
            partyStatus: this.party.members.map(member => ({
                name: member.name,
                hp: member.status.hp,
                mp: member.status.mp,
                effects: member.status.effects
            })),
            monsterStatus: this.monsters.map(monster => ({
                name: monster.name,
                hp: monster.status.hp,
                mp: monster.status.mp,
                effects: monster.status.effects
            })),
            log: this.log
        };
    }
}

// Monster template factory
class MonsterFactory {
    static createMonster(type, level = 1) {
        const templates = {
            goblin: {
                name: 'Goblin',
                level: level,
                stats: {
                    hp: 50 + (level * 10),
                    mp: 20 + (level * 5),
                    pa: 8 + Math.floor(level * 1.5),
                    ma: 6 + Math.floor(level * 0.8),
                    sp: 12 + Math.floor(level * 1.2),
                    ev: 8 + Math.floor(level * 1)
                },
                abilities: {
                    STAB: {
                        name: 'Stab',
                        type: 'physical',
                        power: 1.2,
                        mp: 0,
                        description: 'Basic stabbing attack'
                    },
                    THROW_ROCK: {
                        name: 'Throw Rock',
                        type: 'physical',
                        power: 0.8,
                        ranged: true,
                        mp: 0,
                        description: 'Weak ranged attack'
                    },
                    SNEAK_ATTACK: {
                        name: 'Sneak Attack',
                        type: 'physical',
                        power: 1.5,
                        effect: 'blind',
                        mp: 15,
                        description: 'Attack that may blind the target'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 10 },
                    { type: 'item', chance: 0.3, item: 'Crude Dagger' }
                ]
            },
            archer_goblin: {
                name: 'Goblin Archer',
                level: level,
                position: 'back',
                stats: {
                    hp: 45 + (level * 8),
                    mp: 25 + (level * 4),
                    pa: 10 + Math.floor(level * 1.8),
                    ma: 5 + Math.floor(level * 0.6),
                    sp: 14 + Math.floor(level * 1.4),
                    ev: 10 + Math.floor(level * 1.2)
                },
                abilities: {
                    QUICK_SHOT: {
                        name: 'Quick Shot',
                        type: 'physical',
                        power: 1.2,
                        ranged: true,
                        mp: 0,
                        description: 'Fast ranged attack'
                    },
                    AIMED_SHOT: {
                        name: 'Aimed Shot',
                        type: 'physical',
                        power: 1.8,
                        ranged: true,
                        mp: 15,
                        description: 'Precise ranged attack with higher damage'
                    },
                    VOLLEY: {
                        name: 'Volley',
                        type: 'physical',
                        power: 1.4,
                        ranged: true,
                        aoe: true,
                        mp: 25,
                        description: 'Rain of arrows on all enemies'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 12 },
                    { type: 'item', chance: 0.3, item: 'Short Bow' },
                    { type: 'item', chance: 0.2, item: 'Arrow Bundle' }
                ]
            },
            orc: {
                name: 'Orc',
                level: level,
                stats: {
                    hp: 80 + (level * 15),
                    mp: 10 + (level * 3),
                    pa: 14 + Math.floor(level * 2),
                    ma: 6 + Math.floor(level * 0.5),
                    sp: 8 + Math.floor(level * 1),
                    ev: 12 + Math.floor(level * 1.5)
                },
                abilities: {
                    CLEAVE: {
                        name: 'Cleave',
                        type: 'physical',
                        power: 1.5,
                        aoe: true,
                        mp: 0,
                        description: 'Wide sweeping attack'
                    },
                    RAGE: {
                        name: 'Rage',
                        type: 'support',
                        effect: 'attack_up',
                        duration: 3,
                        mp: 20,
                        description: 'Increase physical attack power'
                    },
                    BATTLE_ROAR: {
                        name: 'Battle Roar',
                        type: 'status',
                        effect: 'defense_down',
                        aoe: true,
                        mp: 25,
                        description: 'Reduce defense of all enemies'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 15 },
                    { type: 'item', chance: 0.4, item: 'Crude Axe' }
                ]
            },
            dark_mage: {
                name: 'Dark Mage',
                level: level,
                stats: {
                    hp: 45 + (level * 8),
                    mp: 60 + (level * 8),
                    pa: 4 + Math.floor(level * 0.5),
                    ma: 14 + Math.floor(level * 2),
                    sp: 8 + Math.floor(level * 1),
                    ev: 6 + Math.floor(level * 0.8)
                },
                abilities: {
                    DARK_BOLT: {
                        name: 'Dark Bolt',
                        type: 'magical',
                        power: 1.8,
                        mp: 15,
                        description: 'Basic dark magic attack'
                    },
                    LIFE_DRAIN: {
                        name: 'Life Drain',
                        type: 'drain',
                        power: 1.2,
                        effect: 'hp_drain',
                        drainRatio: 0.5,
                        mp: 25,
                        description: 'Drain life from target'
                    },
                    CURSE: {
                        name: 'Curse',
                        type: 'status',
                        effect: ['attack_down', 'defense_down'],
                        duration: 3,
                        mp: 30,
                        description: 'Weaken target significantly'
                    },
                    SHADOW_VEIL: {
                        name: 'Shadow Veil',
                        type: 'support',
                        effect: 'increase_magic_defense',
                        duration: 4,
                        mp: 20,
                        description: 'Increase magical defense'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 20 },
                    { type: 'item', chance: 0.4, item: 'Dark Staff' },
                    { type: 'item', chance: 0.2, item: 'Mana Potion' }
                ]
            },
            harpy: {
                name: 'Harpy',
                level: level,
                position: 'back',
                stats: {
                    hp: 40 + (level * 7),
                    mp: 35 + (level * 6),
                    pa: 7 + Math.floor(level * 1.2),
                    ma: 9 + Math.floor(level * 1.5),
                    sp: 16 + Math.floor(level * 1.6),
                    ev: 12 + Math.floor(level * 1.4)
                },
                abilities: {
                    SONIC_SCREECH: {
                        name: 'Sonic Screech',
                        type: 'magical',
                        element: 'sonic',
                        power: 1.6,
                        ranged: true,
                        aoe: true,
                        mp: 20,
                        description: 'Damaging sonic attack'
                    },
                    WING_SLASH: {
                        name: 'Wing Slash',
                        type: 'physical',
                        power: 1.3,
                        ranged: true,
                        mp: 0,
                        description: 'Ranged attack with wings'
                    },
                    WIND_GUST: {
                        name: 'Wind Gust',
                        type: 'magical',
                        element: 'wind',
                        power: 1.4,
                        effect: 'knockback',
                        ranged: true,
                        mp: 15,
                        description: 'Wind attack that pushes target back'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 18 },
                    { type: 'item', chance: 0.3, item: 'Feather' },
                    { type: 'item', chance: 0.2, item: 'Wind Essence' }
                ]
            }
        };

        const template = templates[type];
        if (!template) {
            throw new Error(`Unknown monster type: ${type}`);
        }

        return new Monster(template);
    }
}

export {
    COMBAT_STATES,
    COMBAT_RESULTS,
    Monster,
    CombatManager,
    MonsterFactory
};
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
        super(template.name, 'monster');
        this.level = template.level || 1;
        this.stats = template.stats;
        this.abilities = template.abilities;
        this.experience = template.experience || this.level * 50;
        this.loot = template.loot || [];
        this.status = {
            hp: this.stats.hp,
            mp: this.stats.mp,
            effects: []
        };
    }

    getAIAction(targets) {
        // Basic AI: randomly choose an ability and target
        const availableAbilities = Object.keys(this.abilities).filter(ability => {
            const abilityData = this.abilities[ability];
            return this.status.mp >= abilityData.cost;
        });

        if (availableAbilities.length === 0) {
            return null;
        }

        const randomAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];

        return {
            ability: randomAbility,
            target: randomTarget
        };
    }
}

// Combat manager class
class CombatManager {
    constructor(party, monsters) {
        this.party = party;
        this.monsters = monsters;
        this.state = COMBAT_STATES.ACTIVE;
        this.turn = 0;
        this.initiative = this._determineInitiative();
        this.currentActorIndex = 0;
        this.log = [];
    }

    _determineInitiative() {
        // Combine party members and monsters
        const allCombatants = [
            ...this.party.members.map(member => ({ type: 'party', entity: member })),
            ...this.monsters.map(monster => ({ type: 'monster', entity: monster }))
        ];

        // Sort by dexterity (could add random factor here)
        return allCombatants.sort((a, b) => 
            (b.entity.stats.dexterity + Math.random() * 5) - 
            (a.entity.stats.dexterity + Math.random() * 5)
        );
    }

    getCurrentActor() {
        return this.initiative[this.currentActorIndex];
    }

    getValidTargets(actor) {
        return actor.type === 'party' ? this.monsters : this.party.members;
    }

    processAction(action) {
        const actor = this.getCurrentActor();
        
        if (!actor || this.state !== COMBAT_STATES.ACTIVE) {
            return false;
        }

        let result;
        if (actor.type === 'party') {
            result = this._processPartyAction(action);
        } else {
            result = this._processMonsterAction(actor.entity);
        }

        this._logAction(actor.entity, action, result);
        this._checkCombatEnd();
        this._advanceTurn();

        return result;
    }

    _processPartyAction(action) {
        const actor = this.getCurrentActor().entity;
        
        switch (action.type) {
            case 'ability':
                return actor.useAbility(action.ability, action.target);
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
        return monster.useAbility(action.ability, action.target);
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

    _advanceTurn() {
        if (this.state === COMBAT_STATES.ACTIVE) {
            // Update effects on current actor
            const actor = this.getCurrentActor().entity;
            actor.updateEffects();

            // Move to next actor
            this.currentActorIndex = (this.currentActorIndex + 1) % this.initiative.length;
            if (this.currentActorIndex === 0) {
                this.turn++;
            }
        }
    }

    _logAction(actor, action, result) {
        this.log.push({
            turn: this.turn,
            actor: actor.name,
            action: action,
            result: result
        });
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
                    strength: 8 + Math.floor(level * 1.5),
                    dexterity: 12 + Math.floor(level * 1.2),
                    intelligence: 6 + Math.floor(level * 0.8),
                    wisdom: 6 + Math.floor(level * 0.8),
                    constitution: 8 + Math.floor(level * 1)
                },
                abilities: {
                    STAB: {
                        name: 'Stab',
                        damage: 'dexterity * 1.2',
                        cost: 0,
                        type: 'physical'
                    },
                    THROW_ROCK: {
                        name: 'Throw Rock',
                        damage: 'strength * 0.8',
                        cost: 0,
                        type: 'physical'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 10 },
                    { type: 'item', chance: 0.3, item: 'Crude Dagger' }
                ]
            },
            orc: {
                name: 'Orc',
                level: level,
                stats: {
                    hp: 80 + (level * 15),
                    mp: 10 + (level * 3),
                    strength: 14 + Math.floor(level * 2),
                    dexterity: 8 + Math.floor(level * 1),
                    intelligence: 6 + Math.floor(level * 0.5),
                    wisdom: 6 + Math.floor(level * 0.5),
                    constitution: 12 + Math.floor(level * 1.5)
                },
                abilities: {
                    CLEAVE: {
                        name: 'Cleave',
                        damage: 'strength * 1.5',
                        cost: 0,
                        type: 'physical'
                    },
                    RAGE: {
                        name: 'Rage',
                        effect: 'strength_up',
                        duration: 3,
                        cost: 20,
                        type: 'buff'
                    }
                },
                loot: [
                    { type: 'gold', amount: level * 15 },
                    { type: 'item', chance: 0.4, item: 'Crude Axe' }
                ]
            }
            // Add more monster templates as needed
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
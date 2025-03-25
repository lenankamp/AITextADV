import { Character } from './character.js';
import { Monster } from './monsters/Monster.js';

const COMBAT_STATES = {
    ACTIVE: 'active',
    FINISHED: 'finished'
};

const COMBAT_RESULTS = {
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    FLEE: 'flee'
};

class Party {
    constructor() {
        this.members = [];
        this.frontRow = [];
        this.backRow = [];
        this.maxSize = 4;
    }

    addMember(member, position = 'front') {
        if (this.members.length >= this.maxSize) {
            return false;
        }

        member.setPosition(position);
        this.members.push(member);
        if (position === 'front') {
            this.frontRow.push(member);
        } else {
            this.backRow.push(member);
        }
        return true;
    }

    removeMember(member) {
        const index = this.members.indexOf(member);
        if (index === -1) return false;

        this.members.splice(index, 1);
        this.frontRow = this.frontRow.filter(m => m !== member);
        this.backRow = this.backRow.filter(m => m !== member);
        return true;
    }

    changePosition(member, newPosition) {
        if (!this.members.includes(member)) return false;
        
        // Remove from current position
        if (member.position === 'front') {
            this.frontRow = this.frontRow.filter(m => m !== member);
        } else {
            this.backRow = this.backRow.filter(m => m !== member);
        }

        // Add to new position
        member.setPosition(newPosition);
        if (newPosition === 'front') {
            this.frontRow.push(member);
        } else {
            this.backRow.push(member);
        }
        return true;
    }

    isWiped() {
        return this.members.every(member => member.status.hp <= 0);
    }

    getRow(position) {
        return position === 'front' ? this.frontRow : this.backRow;
    }

    recruitMonster(monster) {
        if (this.members.length >= this.maxSize) return false;
        if (!(monster instanceof Monster)) return false;

        // Convert monster to character
        const character = new Character(monster.name);
        character.baseStats = { ...monster.baseStats };
        character.status = { ...monster.status };
        
        // Add to party in same position
        return this.addMember(character, monster.position);
    }
}

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
        // Reset turn order
        this.turnOrder = [];
        
        // Combine party members and monsters with their initial wait time
        [...this.party.members, ...this.monsters].forEach(entity => {
            const stats = entity.getStats();
            this.turnOrder.push({
                type: entity instanceof Character ? 'party' : 'monster',
                entity: entity,
                waitTime: 100 + Math.floor(Math.random() * 20), // Start with enough wait time to act
                baseSpeed: stats.sp
            });
        });
    }

    _updateTurnOrder() {
        // Update wait times based on speed
        for (const actor of this.turnOrder) {
            if (actor.entity.status.hp > 0) { // Only update living actors
                const stats = actor.entity.getStats();
                let currentSpeed = stats.sp;
                
                // Apply speed modifiers from status effects
                actor.entity.status.effects.forEach(effect => {
                    if (effect.type === 'haste') currentSpeed *= 1.5;
                    if (effect.type === 'slow') currentSpeed *= 0.5;
                });
                
                actor.waitTime += Math.max(1, currentSpeed); // Ensure minimum speed of 1
                actor.baseSpeed = currentSpeed;
            }
        }

        // Sort by wait time, highest first
        this.turnOrder.sort((a, b) => b.waitTime - a.waitTime);
    }

    getCurrentActor() {
        // Get the actor with the highest wait time that hasn't acted yet
        return this.turnOrder.find(actor => 
            !this.actionsThisTurn.has(actor.entity.name) &&
            actor.entity.status.hp > 0 // Only return living actors
        );
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

        // Mark actor as having acted, regardless of action success
        this.actionsThisTurn.set(currentActor.entity.name, true);
        currentActor.waitTime -= 100;

        if (result) {
            this._logAction(currentActor.entity, action, result);
        } else {
            // Log skipped turn if no action could be taken
            this._logAction(currentActor.entity, { type: 'skip' }, { 
                success: false, 
                message: 'No valid action available' 
            });
        }

        this._advanceTurn();
        return result;
    }

    _advanceTurn() {
        // Check if all actors have acted or can't act
        const allActed = this.turnOrder.every(actor => {
            const hasActed = this.actionsThisTurn.has(actor.entity.name);
            const isAlive = actor.entity.status.hp > 0;
            return !isAlive || hasActed;
        });

        if (allActed) {
            // Start new turn
            this.turn++;
            this.actionsThisTurn.clear();
            
            // Reset and update wait times for all actors
            this.turnOrder.forEach(actor => {
                if (actor.entity.status.hp > 0) {
                    const stats = actor.entity.getStats();
                    let currentSpeed = stats.sp;
                    
                    // Apply speed modifiers from status effects
                    actor.entity.status.effects.forEach(effect => {
                        if (effect.type === 'haste') currentSpeed *= 1.5;
                        if (effect.type === 'slow') currentSpeed *= 0.5;
                    });
                    
                    actor.waitTime += Math.max(1, currentSpeed);
                    actor.baseSpeed = currentSpeed;
                }
            });

            // Sort by wait time, highest first
            this.turnOrder.sort((a, b) => b.waitTime - a.waitTime);
            
            // Update status effects
            this.turnOrder.forEach(actor => {
                if (actor.entity.status.hp > 0) {
                    actor.entity.updateEffects();
                }
            });

            // Check combat end conditions after updating
            this._checkCombatEnd();
        }
    }

    getValidTargets(actor) {
        const possibleTargets = actor.type === 'party' ? this.monsters : this.party.members;
        
        // For physical attacks from back row, only return front row targets unless ranged
        if (actor.entity.position === 'back') {
            const abilities = actor.entity.getAvailableAbilities();
            const currentAbility = abilities?.active?.[actor.ability];
            
            if (currentAbility?.type === 'physical' && !currentAbility.ranged) {
                return possibleTargets.filter(t => t.position === 'front' && t.status.hp > 0);
            }
        }
        
        return possibleTargets.filter(t => t.status.hp > 0);
    }

    _processPartyAction(action, actor) {
        if (!action) {
            return { success: false, message: 'No action provided' };
        }

        switch (action.type) {
            case 'ability':
                if (!action.ability || !action.target) {
                    return { success: false, message: 'Invalid ability action' };
                }
                return this._processAbility(actor, action.ability, action.target);
            case 'item':
                if (!action.item || !action.target) {
                    return { success: false, message: 'Invalid item action' };
                }
                return this._useItem(actor, action.item, action.target);
            case 'flee':
                return this._attemptFlee(actor);
            case 'skip':
                return { success: true, message: 'Turn skipped' };
            default:
                return { success: false, message: 'Invalid action type' };
        }
    }

    _processMonsterAction(monster) {
        const action = monster.getAIAction(this.party.members);
        if (!action) {
            return { success: false, message: 'No action available' };
        }

        if (action.type === 'skip') {
            return { success: true, message: 'Turn skipped' };
        }

        return this._processAbility(monster, action.ability, action.target);
    }

    _processAbility(actor, abilityId, target) {
        if (!actor || !actor.getAvailableAbilities) {
            return { success: false, message: 'Invalid actor' };
        }

        const abilities = actor.getAvailableAbilities();
        const ability = abilities?.active?.[abilityId] || abilities?.ATTACK;
        
        if (!ability) {
            // Try getting ability from monster's active abilities if it's a monster
            if (actor instanceof Monster) {
                const monsterAbility = actor.abilities?.active?.[abilityId];
                if (monsterAbility) {
                    return this._processMonsterAbility(actor, monsterAbility, target);
                }
            }
            return { success: false, message: 'Ability not found' };
        }

        // Handle AoE abilities
        if (ability.aoe) {
            const targets = actor instanceof Character ? this.monsters : this.party.members;
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

        // Check position restrictions for physical attacks
        if (actor.position === 'back' && ability.type === 'physical' && !ability.ranged) {
            return { success: false, message: 'Cannot use melee attack from back row' };
        }

        // Single target ability
        return actor.useAbility(abilityId, target);
    }

    _processMonsterAbility(monster, ability, target) {
        // Handle monster-specific ability processing
        if (ability.aoe) {
            const targets = this.party.members;
            const results = targets.map(t => ({
                success: true,
                damage: this._calculateAbilityDamage(monster, ability, t),
                effects: ability.effect ? [ability.effect] : []
            }));
            
            // Apply results to targets
            results.forEach((result, i) => {
                const target = targets[i];
                if (result.damage) {
                    target.status.hp = Math.max(0, target.status.hp - result.damage);
                }
                if (result.effects) {
                    result.effects.forEach(effect => target.addEffect(effect));
                }
            });

            return {
                success: true,
                damage: results.reduce((sum, r) => sum + (r.damage || 0), 0),
                effects: results.flatMap(r => r.effects),
                targets: targets.map((t, i) => ({ target: t, result: results[i] })),
                isAoe: true
            };
        }

        // Single target ability
        const damage = this._calculateAbilityDamage(monster, ability, target);
        target.status.hp = Math.max(0, target.status.hp - damage);
        
        const result = {
            success: true,
            damage,
            effects: []
        };

        if (ability.effect) {
            const effects = Array.isArray(ability.effect) ? ability.effect : [ability.effect];
            effects.forEach(effect => target.addEffect(effect));
            result.effects = effects;
        }

        return result;
    }

    _calculateAbilityDamage(actor, ability, target) {
        const stats = actor.getStats();
        let damage = 0;

        if (ability.type === 'physical') {
            damage = Math.floor(stats.pa * (ability.power || 1));
            // Apply back row damage reduction
            if (target.position === 'back' && !ability.ranged) {
                damage = Math.floor(damage * 0.5);
            }
        } else if (ability.type === 'magical') {
            damage = Math.floor(stats.ma * (ability.power || 1));
        }

        return damage;
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
        // Base 30% chance to flee, modified by level difference and speed
        const stats = actor.getStats();
        const averageMonsterLevel = this.monsters.reduce((sum, m) => sum + m.level, 0) / this.monsters.length;
        const levelDiff = actor.level - averageMonsterLevel;
        const speedBonus = stats.sp / 100;
        
        const fleeChance = 0.3 + (levelDiff * 0.05) + speedBonus;
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
            return true;
        } 
        
        if (this.monsters.every(monster => monster.status.hp <= 0)) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.VICTORY;
            this._distributeExperienceAndLoot();
            return true;
        }

        return false;
    }

    _distributeExperienceAndLoot() {
        // Calculate total experience
        const totalExp = this.monsters.reduce((sum, monster) => sum + monster.experience, 0);
        const expPerMember = Math.floor(totalExp / this.party.members.length);

        // Distribute experience
        this.party.members.forEach(member => {
            member.gainExperience(expPerMember);
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
                position: member.position,
                effects: member.status.effects
            })),
            monsterStatus: this.monsters.map(monster => ({
                name: monster.name,
                hp: monster.status.hp,
                mp: monster.status.mp,
                position: monster.position,
                effects: monster.status.effects
            })),
            log: this.log
        };
    }
}

export {
    COMBAT_STATES,
    COMBAT_RESULTS,
    CombatManager,
    Party
};
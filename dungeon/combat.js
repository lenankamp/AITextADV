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
        const abilities = actor.entity.getAvailableAbilities();
        const currentAbility = abilities?.active?.[actor.ability];
        
        // Determine targets based on ability type first
        if (currentAbility) {
            switch (currentAbility.type) {
                case 'healing':
                case 'support':
                    // Healing and support abilities target own party
                    return actor.type === 'party' ? 
                        this.party.members.filter(m => m.status.hp > 0) : 
                        this.monsters.filter(m => m.status.hp > 0);
                    
                case 'physical':
                    // Handle physical attacks based on position and ranged property
                    const opposingTargets = actor.type === 'party' ? this.monsters : this.party.members;
                    if (actor.entity.position === 'back' && !currentAbility.ranged) {
                        return opposingTargets.filter(t => t.position === 'front' && t.status.hp > 0);
                    }
                    return opposingTargets.filter(t => t.status.hp > 0);
                    
                default:
                    // Magical and other ability types can target anyone in range
                    return (actor.type === 'party' ? this.monsters : this.party.members)
                        .filter(t => t.status.hp > 0);
            }
        }
        
        // Default targeting behavior for basic attacks
        const opposingTargets = actor.type === 'party' ? this.monsters : this.party.members;
        if (actor.entity.position === 'back') {
            return opposingTargets.filter(t => t.position === 'front' && t.status.hp > 0);
        }
        return opposingTargets.filter(t => t.status.hp > 0);
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
        const ability = abilities?.active?.[abilityId];
        
        if (!ability) {
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

    _checkCombatEnd() {
        if (this.party.members.every(m => m.status.hp <= 0)) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.DEFEAT;
            return true;
        }
        
        if (this.monsters.every(m => m.status.hp <= 0)) {
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
            partyStatus: this.party.members.map(member => ({name: member.name,hp: member.status.hp,mp: member.status.mp,position: member.position,effects: member.status.effects})),
            monsterStatus: this.monsters.map(monster => ({name: monster.name,hp: monster.status.hp,mp: monster.status.mp,position: monster.position,effects: monster.status.effects}))
        };
    }
}

export {
    COMBAT_STATES,
    COMBAT_RESULTS,
    CombatManager,
    Party
};
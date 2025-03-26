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
        member.party = this.members; // Set party reference
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
        member.party = null; // Clear party reference
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
}

class CombatManager {
    constructor(partyA, partyB) {
        this.partyA = partyA; // The player's party
        this.partyB = partyB; // The opposing party
        this.state = COMBAT_STATES.ACTIVE;
        this.turn = 0;
        this.turnOrder = [];
        this.timeUnits = 0;
        this.actionsThisTurn = new Map();
        this.log = [];
        
        this._initializeTurnOrder();
    }

    _initializeTurnOrder() {
        this.turnOrder = [];
        
        // Combine all combatants with their initial wait time
        [...this.partyA.members, ...this.partyB.members].forEach(entity => {
            const stats = entity.getStats();
            this.turnOrder.push({
                party: this.partyA.members.includes(entity) ? 'A' : 'B',
                entity: entity,
                waitTime: 100 + Math.floor(Math.random() * 20),
                baseSpeed: stats.sp
            });
        });
    }

    getCurrentActor() {
        return this.turnOrder.find(actor => 
            !this.actionsThisTurn.has(actor.entity.name) &&
            actor.entity.status.hp > 0
        );
    }

    processAction(action) {
        const currentActor = this.getCurrentActor();
        
        if (!currentActor || this.state !== COMBAT_STATES.ACTIVE) {
            return false;
        }

        let result;
        if (action.type === 'skip') {
            result = { success: true, message: 'Turn skipped' };
        } else {
            result = this._processAbility(currentActor.entity, action.ability, action.target);
        }

        this.actionsThisTurn.set(currentActor.entity.name, true);
        currentActor.waitTime -= 100;

        if (result) {
            this._logAction(currentActor.entity, action, result);
        }

        this._advanceTurn();
        return result;
    }

    _processAbility(actor, abilityId, target) {
        if (!abilityId || !target) {
            return { success: false, message: 'Invalid ability or target' };
        }

        // Get the actual ability object from the actor
        const abilities = actor.getAvailableAbilities();
        const ability = abilities.active[abilityId];
        
        if (!ability) {
            return { success: false, message: `Ability ${abilityId} not found` };
        }

        // Check if target is valid based on ability type and positions
        const validTargets = this._getValidTargetsForAbility(actor, ability);
        if (!validTargets.includes(target)) {
            return { success: false, message: 'Invalid target for this ability' };
        }

        // Process the ability use
        const result = actor.useAbility(abilityId, target);
        if (Array.isArray(result)) {
            // For AOE abilities that return an array of results
            return {
                success: true,
                isAoe: true,
                targets: result,
                effects: result[0].effects // Use first target's effects for display
            };
        } else {
            // Single target result
            result.target = target;
            return result;
        }

        // Check for combat end after each action
        this._checkCombatEnd();
    }

    _advanceTurn() {
        // Update time units for all combatants
        this.turnOrder.forEach(actor => {
            if (actor.entity.status.hp > 0) {
                const stats = actor.entity.getStats();
                actor.waitTime -= stats.sp;
            }
        });

        // Sort by wait time ascending (lower = acts sooner)
        this.turnOrder.sort((a, b) => a.waitTime - b.waitTime);

        // Check if a new turn begins
        const allActed = this.turnOrder.every(actor => 
            actor.entity.status.hp <= 0 || 
            this.actionsThisTurn.has(actor.entity.name)
        );

        if (allActed) {
            this.turn++;
            this.actionsThisTurn.clear();
            
            // Update all combatants
            [...this.partyA.members, ...this.partyB.members].forEach(entity => {
                if (entity.status.hp > 0) {
                    entity.updateEffects();
                }
            });
        }
    }

    _getValidTargetsForAbility(actor, ability) {
        const actorParty = this.partyA.members.includes(actor) ? this.partyA : this.partyB;
        const opposingParty = actorParty === this.partyA ? this.partyB : this.partyA;

        // If we got an ability ID instead of an ability object, look it up
        if (typeof ability === 'string') {
            const abilities = actor.getAvailableAbilities();
            ability = abilities.active[ability];
            if (!ability) {
                return [];
            }
        }

        // Handle targeting based on ability type
        switch (ability.type) {
            case 'healing':
            case 'buff':
                return actorParty.members.filter(m => m.status.hp > 0);

            case 'physical':
                if (actor.position === 'back' && !ability.ranged && !actor.isRanged()) {
                    // Back row can only target front row with melee attacks
                    return opposingParty.members.filter(t => t.position === 'front' && t.status.hp > 0);
                }
                // Otherwise can target any living enemy
                return opposingParty.members.filter(t => t.status.hp > 0);

            case 'magical':
            case 'status':
            case 'drain':
                // Can target any living enemy regardless of position
                return opposingParty.members.filter(t => t.status.hp > 0);

            default:
                return opposingParty.members.filter(t => t.status.hp > 0);
        }
    }

    getValidTargets(actor) {
        const actorParty = this.partyA.members.includes(actor.entity) ? this.partyA : this.partyB;
        const opposingParty = actorParty === this.partyA ? this.partyB : this.partyA;
        
        const abilities = actor.entity.getAvailableAbilities();
        if (!abilities) return [];

        // If a specific ability was requested, use that ability's targeting rules
        if (actor.ability) {
            switch (actor.ability.type) {
                case 'healing':
                case 'buff':
                    return actorParty.members.filter(m => m.status.hp > 0);
                    
                case 'physical':
                    if (actor.entity.position === 'back' && !actor.ability.ranged && !actor.entity.isRanged()) {
                        // Back row can only target front row with melee attacks
                        return opposingParty.members.filter(t => t.position === 'front' && t.status.hp > 0);
                    }
                    // Otherwise can target any living enemy
                    return opposingParty.members.filter(t => t.status.hp > 0);
                
                case 'magical':
                case 'status':
                case 'drain':
                    // Can target any living enemy regardless of position
                    return opposingParty.members.filter(t => t.status.hp > 0);

                default:
                    return opposingParty.members.filter(t => t.status.hp > 0);
            }
        }

        // For AI decision making, return all possible targets
        if (actor.entity.type === 'monster') {
            return [
                ...opposingParty.members.filter(t => t.status.hp > 0),
                ...actorParty.members.filter(t => t.status.hp > 0)
            ];
        }

        // Otherwise use basic attack targeting
        if (actor.entity.position === 'back' && !actor.entity.isRanged()) {
            return opposingParty.members.filter(t => t.position === 'front' && t.status.hp > 0);
        }
        return opposingParty.members.filter(t => t.status.hp > 0);
    }

    _checkCombatEnd() {
        if (this.partyA.isWiped()) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.DEFEAT;
            return true;
        }
        
        if (this.partyB.isWiped()) {
            this.state = COMBAT_STATES.FINISHED;
            this.result = COMBAT_RESULTS.VICTORY;
            this._distributeExperienceAndLoot();
            return true;
        }
        
        return false;
    }

    _distributeExperienceAndLoot() {
        // Calculate total experience from defeated party
        const totalExp = this.partyB.members.reduce((sum, member) => sum + (member.experience || 0), 0);
        const expPerMember = Math.floor(totalExp / this.partyA.members.length);

        // Distribute experience to winning party
        this.partyA.members.forEach(member => {
            member.gainExperience(expPerMember);
        });

        // Collect all loot
        const loot = this.partyB.members.reduce((items, member) => [...items, ...(member.loot || [])], []);
        return {
            experience: expPerMember,
            loot: loot
        };
    }

    _logAction(actor, action, result) {
        // Enhanced logging for AoE abilities
        if (result.isAoe && result.targets) {
            const logEntry = {
                turn: this.turn,
                actor: actor.name,
                position: actor.position,
                stats: actor.getStats(),
                equipment: Object.fromEntries(
                    Object.entries(actor.equipment)
                        .filter(([_, item]) => item)
                        .map(([slot, item]) => [slot, {
                            name: item.name,
                            stats: item.getStatModifiers()
                        }])
                ),
                action: action,
                result: {
                    ...result,
                    targets: result.targets.map(t => ({
                        name: t.target.name,
                        position: t.target.position,
                        damage: t.damage,
                        healing: t.healing,
                        effects: t.effects,
                        remainingHp: t.target.status.hp,
                        maxHp: t.target.getMaxHP()
                    }))
                }
            };
            this.log.push(logEntry);
        } else {
            // Single target or non-attack action
            const logEntry = {
                turn: this.turn,
                actor: actor.name,
                position: actor.position,
                stats: actor.getStats(),
                equipment: Object.fromEntries(
                    Object.entries(actor.equipment)
                        .filter(([_, item]) => item)
                        .map(([slot, item]) => [slot, {
                            name: item.name,
                            stats: item.getStatModifiers()
                        }])
                ),
                action: action,
                result: {
                    ...result,
                    target: result.target ? {
                        name: result.target.name,
                        position: result.target.position,
                        remainingHp: result.target.status.hp,
                        maxHp: result.target.getMaxHP()
                    } : undefined
                }
            };
            this.log.push(logEntry);
        }
    }

    getCombatState() {
        return {
            state: this.state,
            result: this.result,
            turn: this.turn,
            currentActor: this.getCurrentActor(),
            parties: {
                A: this.partyA.members.map(member => ({
                    name: member.name,
                    hp: member.status.hp,
                    mp: member.status.mp,
                    position: member.position,
                    effects: member.status.effects
                })),
                B: this.partyB.members.map(member => ({
                    name: member.name,
                    hp: member.status.hp,
                    mp: member.status.mp,
                    position: member.position,
                    effects: member.status.effects
                }))
            }
        };
    }
}

export {
    COMBAT_STATES,
    COMBAT_RESULTS,
    CombatManager,
    Party
};
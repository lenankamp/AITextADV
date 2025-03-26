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
        this.partyA = partyA;
        this.partyB = partyB;
        this.state = COMBAT_STATES.ACTIVE;
        this.turn = 0;
        this.initiativeOrder = [];
        this.actionsThisTurn = new Map();
        this.log = [];
        
        this._initializeInitiative();
    }

    _initializeInitiative() {
        this.initiativeOrder = [];
        
        // Initialize all combatants with base initiative values
        [...this.partyA.members, ...this.partyB.members].forEach(entity => {
            this.initiativeOrder.push({
                party: this.partyA.members.includes(entity) ? 'A' : 'B',
                entity: entity,
                initiative: 0,
                // Store base speed for initiative gain calculations
                baseSpeed: entity.getInitiative()
            });
        });
    }

    _updateInitiative() {
        this.initiativeOrder.forEach(actor => {
            if (actor.entity.status.hp > 0) {
                // Calculate initiative gain with diminishing returns
                const baseGain = actor.baseSpeed / 10; // Base rate of initiative gain
                const currentInit = actor.initiative;
                
                // Apply diminishing returns formula
                // As initiative gets higher, gains are reduced
                const diminishingFactor = Math.max(0.1, 1 - (currentInit / 200));
                actor.initiative += baseGain * diminishingFactor;
            }
        });

        // Sort by initiative in descending order
        this.initiativeOrder.sort((a, b) => b.initiative - a.initiative);
    }

    getCurrentActor() {
        // Find first actor with initiative >= 100 who hasn't acted this turn
        return this.initiativeOrder.find(actor => 
            actor.initiative >= 100 && 
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
            // Use the target's ability processing
            result = currentActor.entity.useAbility(action.ability, action.target);
        }

        // Mark action taken and reduce initiative
        this.actionsThisTurn.set(currentActor.entity.name, true);
        currentActor.initiative -= 100;

        if (result) {
            this._logAction(currentActor.entity, action, result);
        }

        this._advanceTurn();
        this._checkCombatEnd();
        
        return result;
    }

    _advanceTurn() {
        // Update initiative for all combatants
        this._updateInitiative();

        // Check if anyone can still act this turn
        const canAct = this.initiativeOrder.some(actor => 
            actor.initiative >= 100 && 
            !this.actionsThisTurn.has(actor.entity.name) &&
            actor.entity.status.hp > 0
        );

        if (!canAct) {
            // Start new turn if no one can act
            this.turn++;
            this.actionsThisTurn.clear();
            
            // Update effects at turn start
            [...this.partyA.members, ...this.partyB.members].forEach(entity => {
                if (entity.status.hp > 0) {
                    entity.updateEffects();
                }
            });
        }
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
            result: result.isAoe ? {
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
            } : {
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

    getCombatState() {
        return {
            state: this.state,
            result: this.result,
            turn: this.turn,
            currentActor: this.getCurrentActor(),
            initiatives: this.initiativeOrder.map(actor => ({
                name: actor.entity.name,
                initiative: actor.initiative,
                hasActed: this.actionsThisTurn.has(actor.entity.name)
            })),
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
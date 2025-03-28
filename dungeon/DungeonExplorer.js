import { Party, CombatManager, COMBAT_RESULTS } from './combat.js';
import { Dungeon, TILE_TYPES, ENVIRONMENTAL_EFFECTS } from './dungeon.js';
import { MonsterFactory } from './monsters/MonsterFactory.js';

const EXPLORER_STATES = {
    EXPLORING: 'exploring',
    IN_COMBAT: 'in_combat',
    IN_TOWN: 'in_town',
    GAME_OVER: 'game_over'
};

class DungeonExplorer {
    constructor(party) {
        this.party = party;
        this.currentDungeon = null;
        this.currentFloor = 0;
        this.state = EXPLORER_STATES.IN_TOWN;
        this.combatManager = null;
        this.monsterFactory = new MonsterFactory();
        this.dungeonHistory = new Set(); // Track visited dungeons
        this.discoveredSecrets = new Set(); // Track found secrets
        this.gameStats = {
            dungeonsCleared: 0,
            totalCombats: 0,
            totalSteps: 0,
            treasuresFound: 0,
            secretsFound: 0
        };
        this.specialStates = {
            stealth: false,
            wallWalk: false,
            timeAnchors: []
        };
    }

    enterDungeon(dungeon) {
        this.currentDungeon = dungeon;
        this.currentFloor = 0;
        const startRoom = dungeon.floors[0].rooms[0];
        this.party.position = {
            x: startRoom.x + Math.floor(startRoom.width / 2),
            y: startRoom.y + Math.floor(startRoom.height / 2)
        };
        this.state = EXPLORER_STATES.EXPLORING;
        return true;
    }

    move(direction) {
        if (this.state !== EXPLORER_STATES.EXPLORING) {
            return { success: false, message: 'Cannot move while not exploring' };
        }

        if (!this.canMove(direction)) {
            return { success: false, message: 'Cannot move there' };
        }

        const newPos = this._getNewPosition(direction);
        const floor = this.getCurrentFloor();
        const tile = floor.getTile(newPos.x, newPos.y);

        // Handle special tile interactions
        switch (tile) {
            case TILE_TYPES.TRAP:
                if (!this.specialStates.stealth) {
                    this._handleTrap(newPos);
                }
                break;
            case TILE_TYPES.CHEST:
                // Handle chest discovery
                break;
            case TILE_TYPES.EXIT:
                this.handleExit();
                break;
        }

        // Update position and check for events
        this.party.position = newPos;
        for (const member of this.party.members) {
            if(member.status.hp > 0)
                member.resolveMove();
        }
        this.gameStats.totalSteps++;

        // Check for encounters if not in stealth mode
        if (!this.specialStates.stealth) {
            this._checkForEncounters();
        }

        // Check for events at new position
        const events = this.checkPositionEvents();
        
        return {
            success: true,
            message: 'Moved successfully',
            events,
            floorInfo: this.getFloorInfo()
        };
    }

    rotate(direction) {
        if (this.state !== EXPLORER_STATES.EXPLORING) {
            return { success: false, message: 'Cannot rotate while not exploring' };
        }

        this.party.rotate(direction);
        return {
            success: true,
            message: 'Rotated ' + direction,
            facing: this.party.facing,
            floorInfo: this.getFloorInfo()
        };
    }

    isValidMove(position) {
        const floor = this.getCurrentFloor();
        if (!floor) return false;

        const tile = floor.getTile(position.x, position.y);
        return tile !== TILE_TYPES.WALL && tile !== undefined;
    }

    getCurrentFloor() {
        return this.currentDungeon?.floors[this.currentFloor];
    }

    checkPositionEvents() {
        const floor = this.getCurrentFloor();
        const events = [];
        const tile = floor.getTile(this.party.position.x, this.party.position.y);

        // Check for special tiles
        switch(tile) {
            case TILE_TYPES.EXIT:
                events.push(this.handleExit());
                break;
            case TILE_TYPES.CHEST:
                events.push(this.handleTreasure());
                break;
            case TILE_TYPES.TRAP:
                events.push(this.handleTrap());
                break;
        }

        // Check for random encounters
        if (this.shouldTriggerEncounter()) {
            events.push(this.startEncounter());
        }

        return events;
    }

    handleExit() {
        if (this.currentFloor === this.currentDungeon.floors.length - 1) {
            // Dungeon complete
            this.state = EXPLORER_STATES.IN_TOWN;
            this.gameStats.dungeonsCleared++;
            return {
                type: 'dungeon_complete',
                message: 'Dungeon cleared!',
                rewards: this.calculateDungeonRewards()
            };
        } else {
            // Next floor
            this.currentFloor++;
            const floor = this.getCurrentFloor();
            this.party.position = { ...floor.entrance };
            return {
                type: 'floor_change',
                message: 'Descended to floor ' + (this.currentFloor + 1),
                floorInfo: this.getFloorInfo()
            };
        }
    }

    handleTreasure() {
        const floor = this.getCurrentFloor();
        // Replace chest with floor tile
        floor.setTile(this.party.position.x, this.party.position.y, TILE_TYPES.FLOOR);
        
        const loot = this.generateTreasure();
        this.gameStats.treasuresFound++;
        
        // Add items to party inventory
        loot.items.forEach(item => this.party.addToInventory(item));
        this.party.addGold(loot.gold);

        return {
            type: 'treasure',
            message: 'Found treasure!',
            loot
        };
    }

    handleTrap(position) {
        const floor = this.getCurrentFloor();
        const trap = floor.getFeature(position.x, position.y);
        
        if (!trap || trap.type !== 'trap') return false;

        // Check for trap detection abilities first
        const wasDetected = this.party.members.some(member => {
            const trapDetection = member._handleTrapDetection?.();
            if (!trapDetection) return false;

            // If member has auto-disarm, automatically handle the trap
            if (trapDetection.autoDisarm) {
                floor.disarmTrap(position.x, position.y);
                return true;
            }

            // Otherwise just detect it
            return true;
        });

        if (wasDetected) {
            return {
                type: 'trap_detected',
                message: 'Trap detected!',
                trap
            };
        }

        // If not detected/disarmed, trigger the trap
        const damage = trap.damage * (this.currentFloor + 1);
        this.party.members.forEach(member => {
            member.status.hp = Math.max(0, member.status.hp - damage);
        });

        // Remove the triggered trap
        floor.setTile(position.x, position.y, TILE_TYPES.FLOOR);
        floor.removeFeature(position.x, position.y);

        return {
            type: 'trap_triggered',
            message: 'Triggered a trap!',
            damage,
            trap
        };
    }

    startEncounter() {
        const monsters = this.generateEncounter();
        const enemyParty = new Party();
        monsters.forEach(monster => enemyParty.addMember(monster));
        
        this.combatManager = new CombatManager(this.party, enemyParty);
        this.state = EXPLORER_STATES.IN_COMBAT;
        this.gameStats.totalCombats++;
        
        return {
            type: 'combat_start',
            message: 'Encountered monsters!',
            enemies: monsters.map(m => ({
                name: m.name,
                level: m.level,
                type: m.type
            }))
        };
    }

    shouldTriggerEncounter() {
        if (this.state !== EXPLORER_STATES.EXPLORING) return false;
        
        const floor = this.getCurrentFloor();
        const tile = floor.getTile(this.party.position.x, this.party.position.y);
        
        // Higher chance in certain room types
        const room = floor.rooms.find(r => r.contains(this.party.position.x, this.party.position.y));
        const roomModifier = room?.type === 'monster' ? 2 : 1;
        
        // Base 10% chance, modified by floor level and room type
        const chance = 0.1 * roomModifier * (1 + this.currentFloor * 0.1);
        return Math.random() < chance;
    }

    processCombatAction(action) {
        if (this.state !== EXPLORER_STATES.IN_COMBAT || !this.combatManager) {
            return { success: false, message: 'Not in combat' };
        }

        const result = this.combatManager.processAction(action);
        
        // Check if combat has ended
        if (this.combatManager.state === 'finished') {
            this.state = EXPLORER_STATES.EXPLORING;
            this.combatManager = null;
            
            if (result.result === COMBAT_RESULTS.VICTORY) {
                return {
                    ...result,
                    message: 'Combat victory!',
                    type: 'combat_end'
                };
            } else {
                this.state = EXPLORER_STATES.GAME_OVER;
                return {
                    ...result,
                    message: 'Party was defeated...',
                    type: 'game_over'
                };
            }
        }

        return result;
    }

    getFloorInfo() {
        const floor = this.getCurrentFloor();
        if (!floor) return null;

        return {
            level: this.currentFloor + 1,
            position: this.party.position,
            facing: this.party.facing,
            currentTile: floor.getTile(this.party.position.x, this.party.position.y),
            surroundings: this.getSurroundingTiles(),
            terrain: floor.getTerrain(this.party.position.x, this.party.position.y),
            elevation: floor.getElevation(this.party.position.x, this.party.position.y),
            effects: floor.getEnvironmentalEffects(this.party.position.x, this.party.position.y)
        };
    }

    getSurroundingTiles() {
        const floor = this.getCurrentFloor();
        const { x, y } = this.party.position;
        const surroundings = {};

        // Get tiles based on facing direction
        switch(this.party.facing) {
            case 'north':
                surroundings.front = floor.getTile(x, y - 1);
                surroundings.back = floor.getTile(x, y + 1);
                surroundings.left = floor.getTile(x - 1, y);
                surroundings.right = floor.getTile(x + 1, y);
                break;
            case 'south':
                surroundings.front = floor.getTile(x, y + 1);
                surroundings.back = floor.getTile(x, y - 1);
                surroundings.left = floor.getTile(x + 1, y);
                surroundings.right = floor.getTile(x - 1, y);
                break;
            case 'east':
                surroundings.front = floor.getTile(x + 1, y);
                surroundings.back = floor.getTile(x - 1, y);
                surroundings.left = floor.getTile(x, y - 1);
                surroundings.right = floor.getTile(x, y + 1);
                break;
            case 'west':
                surroundings.front = floor.getTile(x - 1, y);
                surroundings.back = floor.getTile(x + 1, y);
                surroundings.left = floor.getTile(x, y + 1);
                surroundings.right = floor.getTile(x, y - 1);
                break;
        }

        return surroundings;
    }

    generateEncounter() {
        const floor = this.getCurrentFloor();
        const room = floor.rooms.find(r => 
            r.contains(this.party.position.x, this.party.position.y)
        );

        return this.monsterFactory.generateGroup(
            this.currentFloor + 1,
            room?.difficulty || 'normal',
            Math.floor(Math.random() * 2) + 2 // 2-3 monsters
        );
    }

    generateTreasure() {
        // Implementation will depend on your item system
        return {
            items: [], // Generate random items based on floor level
            gold: Math.floor((Math.random() * 50 + 50) * (this.currentFloor + 1))
        };
    }

    generateTrap() {
        const trapTypes = [
            { name: 'Spike Trap', power: 10, type: 'physical' },
            { name: 'Poison Gas', power: 8, type: 'poison' },
            { name: 'Fire Rune', power: 12, type: 'fire' },
            { name: 'Lightning Seal', power: 15, type: 'lightning' }
        ];

        return trapTypes[Math.floor(Math.random() * trapTypes.length)];
    }

    calculateDungeonRewards() {
        return {
            experience: 1000 * (this.currentFloor + 1),
            gold: Math.floor(1000 * (this.currentFloor + 1) * (1 + Math.random())),
            items: [] // Generate special completion rewards
        };
    }

    // Methods for abilities that need dungeon context
    getTerrainEffect(x, y) {
        const floor = this.getCurrentFloor();
        if (!floor) return null;

        return {
            terrain: floor.getTerrain(x, y),
            elevation: floor.getElevation(x, y),
            effects: floor.getEnvironmentalEffects(x, y)
        };
    }

    getRoom(x, y) {
        const floor = this.getCurrentFloor();
        if (!floor) return null;

        return floor.rooms.find(room => room.contains(x, y));
    }

    getCurrentRoom() {
        if (!this.party?.position) return null;
        return this.getRoom(this.party.position.x, this.party.position.y);
    }

    setStealthMode(enabled, duration) {
        this.specialStates.stealth = enabled;
        if (enabled && duration) {
            setTimeout(() => {
                this.specialStates.stealth = false;
            }, duration * 1000);
        }
        return true;
    }

    enableWallTraversal(enabled, duration) {
        this.specialStates.wallWalk = enabled;
        if (enabled && duration) {
            setTimeout(() => {
                this.specialStates.wallWalk = false;
            }, duration * 1000);
        }
        return true;
    }

    createCheckpoint() {
        const currentState = {
            position: { ...this.party.position },
            floor: this.currentFloor,
            room: this.getCurrentRoom()
        };
        this.specialStates.timeAnchors.push(currentState);
        return true;
    }

    returnToCheckpoint() {
        const lastCheckpoint = this.specialStates.timeAnchors.pop();
        if (!lastCheckpoint) return false;

        this.party.position = lastCheckpoint.position;
        this.currentFloor = lastCheckpoint.floor;
        return true;
    }

    canMove(direction) {
        const newPos = this._getNewPosition(direction);
        const floor = this.currentDungeon.floors[this.currentFloor];
        
        // Check if position is within bounds
        if (!floor.isWithinBounds(newPos.x, newPos.y)) {
            return false;
        }

        const tile = floor.getTile(newPos.x, newPos.y);
        
        // Allow movement through walls if wall walk is enabled
        if (this.specialStates.wallWalk) {
            return true;
        }

        // Normal movement checks
        switch (tile) {
            case TILE_TYPES.WALL:
                return false;
            case TILE_TYPES.DOOR:
                return !floor.isDoorLocked(newPos.x, newPos.y);
            case TILE_TYPES.SECRET_DOOR:
                return floor.isSecretDoorRevealed(newPos.x, newPos.y);
            default:
                return true;
        }
    }

    _getNewPosition(direction) {
        const { x, y } = this.party.position;
        switch (direction) {
            case 'north': return { x, y: y - 1 };
            case 'south': return { x, y: y + 1 };
            case 'east': return { x: x + 1, y };
            case 'west': return { x: x - 1, y };
            default: return { x, y };
        }
    }

    _handleTrap(position) {
        const floor = this.currentDungeon.floors[this.currentFloor];
        const trap = floor.getFeature(position.x, position.y);
        if (trap && trap.type === 'trap') {
            // Apply trap effects to party
            this.party.members.forEach(member => {
                member.status.hp = Math.max(0, member.status.hp - trap.damage);
            });
            // Remove or disable the trap after triggering
            floor.removeFeature(position.x, position.y);
        }
    }

    _checkForEncounters() {
        const floor = this.currentDungeon.floors[this.currentFloor];
        const encounter = floor.checkForEncounter(this.party.position);
        if (encounter) {
            this.party.startCombat(encounter);
        }
    }
}

export {
    EXPLORER_STATES,
    DungeonExplorer
};
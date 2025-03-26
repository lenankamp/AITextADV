import { Monster, MonsterFactory } from './monsters/index.js';
import { EncounterManager } from './encounters.js';

// Constants for dungeon generation
const TILE_TYPES = {
    WALL: 0,
    FLOOR: 1,
    ENTRANCE: 2,
    EXIT: 3,
    DOOR: 4,
    SECRET_DOOR: 5,
    CHEST: 6,
    TRAP: 7
};

const DUNGEON_FEATURES = {
    Monster: 'monster',
    TRAP: 'trap',
    TREASURE: 'treasure',
    LORE: 'lore',
    SECRET: 'secret'
};

// Add room types
const ROOM_TYPES = {
    ENTRANCE: 'entrance',
    EXIT: 'exit',
    NORMAL: 'normal',
    TREASURE: 'treasure',
    Monster: 'monster',
    BOSS: 'boss',
    SECRET: 'secret'
};

// Base class for all entities in the dungeon
class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

// Class representing a dungeon floor
class DungeonFloor {
    constructor(width, height, floorNumber) {
        this.width = width;
        this.height = height;
        this.floorNumber = floorNumber;
        this.grid = Array(height).fill().map(() => Array(width).fill(TILE_TYPES.WALL));
        this.entities = [];
        this.rooms = [];
        this.corridors = [];
        this.entrance = null;
        this.exit = null;
    }

    isWithinBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getTile(x, y) {
        if (!this.isWithinBounds(x, y)) return null;
        return this.grid[y][x];
    }

    setTile(x, y, type) {
        if (!this.isWithinBounds(x, y)) return false;
        this.grid[y][x] = type;
        return true;
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
}

// Class representing a room in the dungeon
class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.features = [];
        this.doors = [];
    }

    addFeature(feature) {
        this.features.push(feature);
    }

    addDoor(x, y, isSecret = false) {
        this.doors.push({ x, y, isSecret });
    }

    // Check if a point is inside the room
    contains(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }

    // Check if this room overlaps with another room
    overlaps(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    isCriticalPath() {
        // Entrance, exit, and boss rooms are always on the critical path
        return this.type === ROOM_TYPES.ENTRANCE ||
               this.type === ROOM_TYPES.EXIT ||
               this.type === ROOM_TYPES.BOSS ||
               this.type === ROOM_TYPES.NORMAL; // Normal rooms are considered critical path for better connectivity
    }
}

// Main Dungeon class
class Dungeon {
    constructor(config = {}) {
        this.config = {
            width: config.width || 50,
            height: config.height || 50,
            floors: config.floors || 5,
            minRoomSize: config.minRoomSize || 3, // Reduced from 5
            maxRoomSize: config.maxRoomSize || 8, // Reduced from 15
            roomAttempts: config.roomAttempts || 80, // Increased from 50
            difficulty: config.difficulty || 'normal',
            ...config
        };
        console.log('Initializing dungeon with config:', this.config);
        this.floors = [];
        this.currentFloor = 0;
        
        try {
            this.encounterManager = new EncounterManager();
            console.log('Successfully initialized EncounterManager');
        } catch (error) {
            console.error('Error initializing dungeon systems:', error);
            throw error;
        }
    }

    generate() {
        console.log('Starting dungeon generation with config:', this.config);
        for (let i = 0; i < this.config.floors; i++) {
            console.log('Generating floor', i);
            const floor = this._generateFloor(i);
            this.floors.push(floor);
        }
        console.log('Dungeon generation complete. Total floors:', this.floors.length);
    }

    _generateFloor(floorNumber) {
        const floor = new DungeonFloor(this.config.width, this.config.height, floorNumber);
        
        // Generate rooms
        this._generateRooms(floor);
        
        // Connect rooms with corridors
        this._connectRooms(floor);
        
        // Place entrance and exit
        this._placeEntranceAndExit(floor);
        
        // Add features (monsters, traps, treasure, etc.)
        this._addFeatures(floor);
        
        return floor;
    }

    _generateRooms(floor) {
        console.log('Generating rooms for floor', floor.floorNumber);
        for (let i = 0; i < this.config.roomAttempts; i++) {
            const width = Math.floor(Math.random() * (this.config.maxRoomSize - this.config.minRoomSize + 1)) + this.config.minRoomSize;
            const height = Math.floor(Math.random() * (this.config.maxRoomSize - this.config.minRoomSize + 1)) + this.config.minRoomSize;
            const x = Math.floor(Math.random() * (floor.width - width - 2)) + 1;
            const y = Math.floor(Math.random() * (floor.height - height - 2)) + 1;

            const newRoom = new Room(x, y, width, height);

            // Find overlapping rooms
            let overlappingRooms = [];
            
            for (const existingRoom of floor.rooms) {
                if (newRoom.overlaps(existingRoom)) {
                    overlappingRooms.push(existingRoom);
                }
            }

            if (overlappingRooms.length === 0) {
                // Determine room type and difficulty
                if (floor.rooms.length === 0) {
                    newRoom.type = ROOM_TYPES.ENTRANCE;
                    newRoom.difficulty = 'easy';
                } else if (i === this.config.roomAttempts - 1) {
                    newRoom.type = floor.floorNumber === this.config.floors - 1 ? ROOM_TYPES.BOSS : ROOM_TYPES.EXIT;
                    newRoom.difficulty = floor.floorNumber === this.config.floors - 1 ? 'boss' : 'hard';
                } else {
                    newRoom.type = this._determineRoomType();
                    newRoom.difficulty = this._determineRoomDifficulty(floor.floorNumber, newRoom.type);
                }

                // Carve out the room
                for (let y = newRoom.y; y < newRoom.y + newRoom.height; y++) {
                    for (let x = newRoom.x; x < newRoom.x + newRoom.width; x++) {
                        floor.setTile(x, y, TILE_TYPES.FLOOR);
                    }
                }

                // Generate encounters for the room
                this._generateRoomEncounters(newRoom, floor.floorNumber);
                floor.rooms.push(newRoom);
            }
        }
        console.log('Finished generating rooms. Total rooms:', floor.rooms.length);
        // Add doors after all rooms and corridors are generated
        this._addDoorsToAllRooms(floor);
        this._cleanupDoors(floor);
    }

    _determineRoomType() {
        const roll = Math.random();
        if (roll > 0.95) return ROOM_TYPES.SECRET;
        if (roll > 0.85) return ROOM_TYPES.TREASURE;
        if (roll > 0.65) return ROOM_TYPES.Monster;
        return ROOM_TYPES.NORMAL;
    }

    _determineRoomDifficulty(floorNumber, roomType) {
        switch (roomType) {
            case ROOM_TYPES.ENTRANCE:
                return 'easy';
            case ROOM_TYPES.EXIT:
                return 'hard';
            case ROOM_TYPES.BOSS:
                return 'boss';
            case ROOM_TYPES.TREASURE:
                return Math.random() > 0.5 ? 'hard' : 'normal';
            case ROOM_TYPES.Monster:
                return Math.random() > 0.7 ? 'hard' : 'normal';
            case ROOM_TYPES.SECRET:
                return 'hard';
            default:
                // Normal rooms get progressively harder as you go deeper
                const roll = Math.random();
                if (floorNumber > this.config.floors * 0.7) {
                    return roll > 0.6 ? 'hard' : 'normal';
                } else if (floorNumber > this.config.floors * 0.3) {
                    return roll > 0.8 ? 'hard' : 'normal';
                }
                return roll > 0.9 ? 'normal' : 'easy';
        }
    }

    _generateRoomEncounters(room, floorLevel) {
        // Set the encounter manager to the current floor level
        this.encounterManager = new EncounterManager(floorLevel);

        // Generate encounters based on room type and difficulty
        const encounters = this.encounterManager.generateRoomEncounters(room, room.difficulty);
        room.encounters = encounters;

        // Add monsters based on room type
        if (room.type === ROOM_TYPES.Monster || room.type === ROOM_TYPES.BOSS) {
            const monsterCount = room.type === ROOM_TYPES.BOSS ? 1 : Math.floor(Math.random() * 3) + 1;
            room.monsters = this._generateMonsters(monsterCount, floorLevel, room.difficulty);
        }
    }

    _generateMonsters(count, floorLevel, difficulty) {
        const monsters = [];
        const monsterTemplates = {
            goblin: {
                name: 'Goblin',
                stats: {
                    hp: 50,
                    mp: 20,
                    pa: 8,
                    ma: 4,
                    sp: 6,
                    ev: 5
                },
                abilities: {
                    ATTACK: {
                        name: 'Attack',
                        type: 'physical',
                        power: 1,
                        description: 'Basic attack'
                    }
                },
                position: 'front'
            },
            orc: {
                name: 'Orc',
                stats: {
                    hp: 75,
                    mp: 15,
                    pa: 10,
                    ma: 3,
                    sp: 4,
                    ev: 3
                },
                abilities: {
                    ATTACK: {
                        name: 'Attack',
                        type: 'physical',
                        power: 1.2,
                        description: 'Strong melee attack'
                    }
                },
                position: 'front'
            }
        };

        for (let i = 0; i < count; i++) {
            const type = Object.keys(monsterTemplates)[Math.floor(Math.random() * Object.keys(monsterTemplates).length)];
            const template = monsterTemplates[type];
            const levelBonus = difficulty === 'boss' ? 2 : difficulty === 'hard' ? 1 : 0;
            
            // Scale stats based on level
            const leveledTemplate = {
                ...template,
                level: floorLevel + levelBonus,
                stats: { ...template.stats }
            };

            // Scale stats based on level and difficulty
            const levelScaling = (leveledTemplate.level - 1) * 0.1; // 10% per level
            const difficultyScaling = difficulty === 'boss' ? 2 : 
                                    difficulty === 'hard' ? 1.5 : 1;

            Object.keys(leveledTemplate.stats).forEach(stat => {
                leveledTemplate.stats[stat] = Math.floor(
                    leveledTemplate.stats[stat] * 
                    (1 + levelScaling) * 
                    difficultyScaling
                );
            });

            const monster = new Monster(leveledTemplate);
            monsters.push(monster);
        }

        return monsters;
    }

    _connectRooms(floor) {
        // Implement pathfinding to connect rooms
        for (let i = 0; i < floor.rooms.length - 1; i++) {
            const roomA = floor.rooms[i];
            const roomB = floor.rooms[i + 1];
            
            // Get center points of rooms
            const startX = Math.floor(roomA.x + roomA.width / 2);
            const startY = Math.floor(roomA.y + roomA.height / 2);
            const endX = Math.floor(roomB.x + roomB.width / 2);
            const endY = Math.floor(roomB.y + roomB.height / 2);

            // Create L-shaped corridor
            this._createCorridor(floor, startX, startY, endX, endY);
        }
    }

    _createCorridor(floor, startX, startY, endX, endY) {
        // Randomly decide whether to go horizontal first or vertical first
        if (Math.random() < 0.5) {
            // Horizontal then vertical
            this._horizontalCorridor(floor, startX, endX, startY);
            this._verticalCorridor(floor, startY, endY, endX);
        } else {
            // Vertical then horizontal
            this._verticalCorridor(floor, startY, endY, startX);
            this._horizontalCorridor(floor, startX, endX, endY);
        }
    }

    _horizontalCorridor(floor, startX, endX, y) {
        const start = Math.min(startX, endX);
        const end = Math.max(startX, endX);
        for (let x = start; x <= end; x++) {
            floor.setTile(x, y, TILE_TYPES.FLOOR);
        }
    }

    _verticalCorridor(floor, startY, endY, x) {
        const start = Math.min(startY, endY);
        const end = Math.max(startY, endY);
        for (let y = start; y <= end; y++) {
            floor.setTile(x, y, TILE_TYPES.FLOOR);
        }
    }

    _placeEntranceAndExit(floor) {
        // Place entrance in first room
        const entranceRoom = floor.rooms[0];
        const entranceX = Math.floor(entranceRoom.x + entranceRoom.width / 2);
        const entranceY = Math.floor(entranceRoom.y + entranceRoom.height / 2);
        floor.setTile(entranceX, entranceY, TILE_TYPES.ENTRANCE);
        floor.entrance = { x: entranceX, y: entranceY };

        // Place exit in last room
        const exitRoom = floor.rooms[floor.rooms.length - 1];
        const exitX = Math.floor(exitRoom.x + exitRoom.width / 2);
        const exitY = Math.floor(exitRoom.y + exitRoom.height / 2);
        floor.setTile(exitX, exitY, TILE_TYPES.EXIT);
        floor.exit = { x: exitX, y: exitY };
    }

    _addFeatures(floor) {
        for (const room of floor.rooms) {
            // Skip entrance and exit rooms
            if (room === floor.rooms[0] || room === floor.rooms[floor.rooms.length - 1]) {
                continue;
            }

            // Add random features to the room
            const featureCount = Math.floor(Math.random() * 3) + 1; // 1-3 features per room
            for (let i = 0; i < featureCount; i++) {
                const featureType = this._getRandomFeature();
                const x = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
                const y = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
                room.addFeature({ type: featureType, x, y });

                // Add special tiles for certain features
                switch (featureType) {
                    case DUNGEON_FEATURES.TREASURE:
                        floor.setTile(x, y, TILE_TYPES.CHEST);
                        break;
                    case DUNGEON_FEATURES.TRAP:
                        floor.setTile(x, y, TILE_TYPES.TRAP);
                        break;
                }
            }

            // Add doors
            this._addDoorsToRoom(floor, room);
        }
    }

    _getRandomFeature() {
        const features = Object.values(DUNGEON_FEATURES);
        return features[Math.floor(Math.random() * features.length)];
    }

    _addDoorsToRoom(floor, room) {
        const doorPositions = new Set();

        // Helper to check if a position is a hallway (FLOOR tile not part of any room)
        const isHallway = (x, y) => {
            const tile = floor.getTile(x, y);
            if (tile !== TILE_TYPES.FLOOR) return false;
            
            // Check if this position is part of any room
            return !floor.rooms.some(r => 
                r.contains(x, y)
            );
        };

        // Helper to check if a hallway position is suitable for a door
        // (has walls on both sides, making it a proper corridor)
        const isProperCorridor = (x, y) => {
            // Check if it has walls on both sides (either horizontally or vertically)
            const hasHorizWalls = floor.getTile(x - 1, y) === TILE_TYPES.WALL && 
                                floor.getTile(x + 1, y) === TILE_TYPES.WALL;
            const hasVertWalls = floor.getTile(x, y - 1) === TILE_TYPES.WALL && 
                                floor.getTile(x, y + 1) === TILE_TYPES.WALL;
            return hasHorizWalls || hasVertWalls;
        };

        // Helper to check if a position has a nearby door
        const hasNearbyDoor = (x, y, minDistance = 2) => {
            for (let dx = -minDistance; dx <= minDistance; dx++) {
                for (let dy = -minDistance; dy <= minDistance; dy++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    const key = `${checkX},${checkY}`;
                    if (doorPositions.has(key)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Check for suitable door positions around room perimeter
        // Check horizontal walls (top and bottom)
        for (let x = room.x; x < room.x + room.width; x++) {
            // Check hallway above top wall
            if (isHallway(x, room.y - 1) && isProperCorridor(x, room.y - 1)) {
                if (!hasNearbyDoor(x, room.y - 1)) {
                    const isSecret = !room.isCriticalPath() && Math.random() < 0.2;
                    floor.setTile(x, room.y - 1, isSecret ? TILE_TYPES.SECRET_DOOR : TILE_TYPES.DOOR);
                    room.addDoor(x, room.y - 1, isSecret);
                    doorPositions.add(`${x},${room.y - 1}`);
                }
            }
            // Check hallway below bottom wall
            if (isHallway(x, room.y + room.height) && isProperCorridor(x, room.y + room.height)) {
                if (!hasNearbyDoor(x, room.y + room.height)) {
                    const isSecret = !room.isCriticalPath() && Math.random() < 0.2;
                    floor.setTile(x, room.y + room.height, isSecret ? TILE_TYPES.SECRET_DOOR : TILE_TYPES.DOOR);
                    room.addDoor(x, room.y + room.height, isSecret);
                    doorPositions.add(`${x},${room.y + room.height}`);
                }
            }
        }

        // Check vertical walls (left and right)
        for (let y = room.y; y < room.y + room.height; y++) {
            // Check hallway left of left wall
            if (isHallway(room.x - 1, y) && isProperCorridor(room.x - 1, y)) {
                if (!hasNearbyDoor(room.x - 1, y)) {
                    const isSecret = !room.isCriticalPath() && Math.random() < 0.2;
                    floor.setTile(room.x - 1, y, isSecret ? TILE_TYPES.SECRET_DOOR : TILE_TYPES.DOOR);
                    room.addDoor(room.x - 1, y, isSecret);
                    doorPositions.add(`${room.x - 1},${y}`);
                }
            }
            // Check hallway right of right wall
            if (isHallway(room.x + room.width, y) && isProperCorridor(room.x + room.width, y)) {
                if (!hasNearbyDoor(room.x + room.width, y)) {
                    const isSecret = !room.isCriticalPath() && Math.random() < 0.2;
                    floor.setTile(room.x + room.width, y, isSecret ? TILE_TYPES.SECRET_DOOR : TILE_TYPES.DOOR);
                    room.addDoor(room.x + room.width, y, isSecret);
                    doorPositions.add(`${room.x + room.width},${y}`);
                }
            }
        }
    }

    _cleanupDoors(floor) {
        // Helper to check if a position is in a proper corridor
        const isProperCorridor = (x, y) => {
            const hasHorizWalls = floor.getTile(x - 1, y) === TILE_TYPES.WALL && 
                                floor.getTile(x + 1, y) === TILE_TYPES.WALL;
            const hasVertWalls = floor.getTile(x, y - 1) === TILE_TYPES.WALL && 
                                floor.getTile(x, y + 1) === TILE_TYPES.WALL;
            return hasHorizWalls || hasVertWalls;
        };

        // Helper to check if there's a secret door nearby
        const hasNearbySecretDoor = (x, y, distance = 2) => {
            for (let dx = -distance; dx <= distance; dx++) {
                for (let dy = -distance; dy <= distance; dy++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    if (floor.isWithinBounds(checkX, checkY) &&
                        floor.getTile(checkX, checkY) === TILE_TYPES.SECRET_DOOR) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Check each tile in the floor
        for (let y = 0; y < floor.height; y++) {
            for (let x = 0; x < floor.width; x++) {
                const tile = floor.getTile(x, y);
                if (tile === TILE_TYPES.DOOR || tile === TILE_TYPES.SECRET_DOOR) {
                    // Remove doors that aren't in proper corridors
                    if (!isProperCorridor(x, y)) {
                        floor.setTile(x, y, TILE_TYPES.FLOOR);
                        // Remove door from room's door list
                        floor.rooms.forEach(room => {
                            room.doors = room.doors.filter(door => door.x !== x || door.y !== y);
                        });
                        continue;
                    }

                    // Remove regular doors that are too close to secret doors
                    if (tile === TILE_TYPES.DOOR && hasNearbySecretDoor(x, y)) {
                        floor.setTile(x, y, TILE_TYPES.FLOOR);
                        // Remove door from room's door list
                        floor.rooms.forEach(room => {
                            room.doors = room.doors.filter(door => door.x !== x || door.y !== y);
                        });
                    }
                }
            }
        }
    }

    _areRoomsAdjacent(roomA, roomB) {
        // Check if rooms share any borders
        const horizontallyAdjacent = 
            (roomA.x + roomA.width === roomB.x || roomB.x + roomB.width === roomA.x) &&
            !(roomA.y >= roomB.y + roomB.height || roomB.y >= roomA.y + roomA.height);
            
        const verticallyAdjacent = 
            (roomA.y + roomA.height === roomB.y || roomB.y + roomB.height === roomA.y) &&
            !(roomA.x >= roomB.x + roomB.width || roomB.x >= roomA.x + roomA.width);
            
        return horizontallyAdjacent || verticallyAdjacent;
    }

    _findSharedWallCenter(roomA, roomB) {
        if (roomA.x + roomA.width === roomB.x) {
            // RoomA is to the left of RoomB
            const sharedY = Math.max(roomA.y, roomB.y);
            const sharedHeight = Math.min(roomA.y + roomA.height, roomB.y + roomB.height) - sharedY;
            return {
                x: roomA.x + roomA.width,
                y: Math.floor(sharedY + sharedHeight / 2)
            };
        } else if (roomB.x + roomB.width === roomA.x) {
            // RoomB is to the left of RoomA
            const sharedY = Math.max(roomA.y, roomB.y);
            const sharedHeight = Math.min(roomA.y + roomA.height, roomB.y + roomB.height) - sharedY;
            return {
                x: roomB.x + roomB.width,
                y: Math.floor(sharedY + sharedHeight / 2)
            };
        } else if (roomA.y + roomA.height === roomB.y) {
            // RoomA is above RoomB
            const sharedX = Math.max(roomA.x, roomB.x);
            const sharedWidth = Math.min(roomA.x + roomA.width, roomB.x + roomB.width) - sharedX;
            return {
                x: Math.floor(sharedX + sharedWidth / 2),
                y: roomA.y + roomA.height
            };
        } else {
            // RoomB is above RoomA
            const sharedX = Math.max(roomA.x, roomB.x);
            const sharedWidth = Math.min(roomA.x + roomA.width, roomB.x + roomB.width) - sharedX;
            return {
                x: Math.floor(sharedX + sharedWidth / 2),
                y: roomB.y + roomB.height
            };
        }
    }

    _addDoorsToAllRooms(floor) {
        // First add doors for all rooms
        for (const room of floor.rooms) {
            this._addDoorsToRoom(floor, room);
        }
    }
}

// Export the classes and constants
export {
    TILE_TYPES,
    DUNGEON_FEATURES,
    ROOM_TYPES,
    Entity,
    DungeonFloor,
    Room,
    Dungeon
};
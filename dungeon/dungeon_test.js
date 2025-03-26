import { Dungeon, TERRAIN_TYPES, TILE_TYPES, ELEVATION_LEVELS } from './dungeon.js';

// Test configuration for a small dungeon to make debugging easier
const testConfig = {
    width: 30,
    height: 30,
    floors: 1,
    minRoomSize: 4,
    maxRoomSize: 6,
    roomAttempts: 20
};

console.log('Creating test dungeon...');
const dungeon = new Dungeon(testConfig);

// Override terrain selection to ensure we get mountains
const originalSelectTerrain = dungeon._selectTerrainType;
dungeon._selectTerrainType = function(floorNumber) {
    // Force first chunk to be mountain, rest random
    if (!this._hasSetMountain) {
        this._hasSetMountain = true;
        return TERRAIN_TYPES.MOUNTAIN;
    }
    return originalSelectTerrain.call(this, floorNumber);
};

dungeon.generate();

// Get the first floor
const floor = dungeon.floors[0];

// Helper to print a tile
function getTileChar(x, y) {
    const tile = floor.getTile(x, y);
    const elevation = floor.getElevation(x, y);
    const terrain = floor.getTerrain(x, y);
    
    if (tile === TILE_TYPES.WALL) return '#';
    if (tile === TILE_TYPES.ENTRANCE) return 'E';
    if (tile === TILE_TYPES.EXIT) return 'X';
    if (tile === TILE_TYPES.DOOR) return '+';
    if (tile === TILE_TYPES.SECRET_DOOR) return 'S';
    
    // For floor tiles, show elevation number if it's mountain terrain
    if (terrain === TERRAIN_TYPES.MOUNTAIN) {
        return elevation.toString();
    }
    
    return '.';
}

// Print the dungeon with elevations
console.log('\nDungeon Map (numbers show elevation for mountain terrain):');
console.log('=' + '='.repeat(floor.width) + '=');

for (let y = 0; y < floor.height; y++) {
    let line = '|';
    for (let x = 0; x < floor.width; x++) {
        line += getTileChar(x, y);
    }
    line += '|';
    console.log(line);
}

console.log('=' + '='.repeat(floor.width) + '=');

// Print room details
console.log('\nRoom Details:');
for (const room of floor.rooms) {
    console.log(`Room at (${room.x},${room.y}) size ${room.width}x${room.height}:`);
    console.log(`  Terrain: ${room.terrain}`);
    console.log(`  Elevation: ${room.elevation}`);
    console.log(`  Features: ${JSON.stringify([...room.terrainFeatures])}`);
}

// Count mountain tiles with elevation 0
let mountainTilesWithZeroElevation = 0;
let totalMountainTiles = 0;

for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
        if (floor.getTerrain(x, y) === TERRAIN_TYPES.MOUNTAIN) {
            totalMountainTiles++;
            if (floor.getElevation(x, y) === ELEVATION_LEVELS.GROUND) {
                mountainTilesWithZeroElevation++;
                console.log(`Found mountain tile with elevation 0 at (${x},${y})`);
            }
        }
    }
}

console.log('\nMountain Tile Statistics:');
console.log(`Total mountain tiles: ${totalMountainTiles}`);
console.log(`Mountain tiles with elevation 0: ${mountainTilesWithZeroElevation}`);
if (mountainTilesWithZeroElevation > 0) {
    console.log('WARNING: Found mountain tiles with ground elevation!');
}
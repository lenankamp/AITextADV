import { Character } from './character.js';
import { JOBS } from './jobs/index.js';
import { EQUIPMENT_TYPES, WEAPON_TYPES, ARMOR_TYPES, EQUIPMENT_SLOTS } from './equipment/index.js';
import { Weapon } from './equipment/Weapon.js';
import fs from 'fs';

// Capture console output
let testOutput = '';
const originalLog = console.log;
console.log = (...args) => {
    const output = args.join(' ');
    testOutput += output + '\n';
    originalLog(...args);
};

// Test helper functions
const testResults = {
    total: 0,
    passed: 0
};

function assert(condition, message) {
    testResults.total++;
    if (condition) {
        testResults.passed++;
        console.log(`✓ ${message}`);
    } else {
        console.log(`✗ ${message}`);
    }
}

// Test exports and imports
export function runEquipmentTests() {
    // Reset test results and output
    testResults.total = 0;
    testResults.passed = 0;
    testOutput = '';

    console.log('\n=== Test Character Creation and Basic Job Setup ===');
    const char = new Character('Test');
    
    console.log('Initial character state:');
    console.log('Current job ID:', char.currentJob);
    console.log('Initial jobs data:', JSON.stringify(char.jobs, null, 2));
    console.log('Available JOBS:', JSON.stringify(JOBS, null, 2));
    assert(char.currentJob === JOBS.Squire, 'Character starts as Squire');

    // Give JP for ability learning
    console.log('\nLearning Squire abilities:');
    char.gainJP(1000);

    // Learn some Squire abilities
    const squireLearnResults = [
        char.learnAbility(JOBS.Squire, 'active', 'THROW_STONE'),
        char.learnAbility(JOBS.Squire, 'active', 'ACCUMULATE'),
        char.learnAbility(JOBS.Squire, 'reaction', 'COUNTER_TACKLE'),
        char.learnAbility(JOBS.Squire, 'support', 'JP_BOOST')
    ];
    
    console.log(`Squire abilities learned: ${squireLearnResults.join(', ')}`);
    assert(squireLearnResults.every(Boolean), 'Successfully learned Squire abilities');

    // Verify the abilities were learned
    const squireAbilities = char.getAvailableAbilities();
    console.log('Available Squire abilities:', JSON.stringify(squireAbilities, null, 2));
    assert(squireAbilities.active.THROW_STONE && 
           squireAbilities.active.ACCUMULATE &&
           squireAbilities.reaction.COUNTER_TACKLE &&
           squireAbilities.support.some(a => a.abilityId === 'JP_BOOST'), 
           'Squire abilities are available');

    // Change to Knight and learn some Knight abilities
    console.log('\nChanging to Knight and learning abilities:');
    const knightChangeResult = char.setJob(JOBS.Knight);
    assert(knightChangeResult, 'Successfully changed to Knight job');
    
    char.gainJP(2000); // Give JP for Knight abilities
    
    // Learn Knight abilities
    const knightLearnResults = [
        char.learnAbility(JOBS.Knight, 'active', 'SLASH_BLADE'),
        char.learnAbility(JOBS.Knight, 'active', 'BREAK_ARMOR'),
        char.learnAbility(JOBS.Knight, 'reaction', 'PARRY'),
        char.learnAbility(JOBS.Knight, 'support', 'EQUIP_SHIELD')
    ];
    
    console.log(`Knight abilities learned: ${knightLearnResults.join(', ')}`);
    assert(knightLearnResults.every(Boolean), 'Successfully learned Knight abilities');

    // Set Squire as secondary ability set
    console.log('\nSetting Squire as secondary ability set:');
    const setSecondaryResult = char.setSecondaryActive(JOBS.Squire);
    assert(setSecondaryResult, 'Successfully set Squire as secondary job');

    // Get available abilities and verify both Knight and Squire abilities are present
    const finalAbilities = char.getAvailableAbilities();
    console.log('Final available abilities:', JSON.stringify(finalAbilities, null, 2));
    assert(finalAbilities.active.SLASH_BLADE && 
           finalAbilities.active.BREAK_ARMOR &&
           finalAbilities.active.THROW_STONE &&
           finalAbilities.active.ACCUMULATE,
           'Both Knight and Squire abilities are available');

    // Equipment tests
    console.log('\n=== Basic Equipment Test ===');
    const sword = new Weapon({
        name: 'Broadsword',
        type: EQUIPMENT_TYPES.WEAPON,
        weaponType: WEAPON_TYPES.SWORD,
        stats: {
            pa: 8
        }
    });

    const result = char.equipItem(sword, EQUIPMENT_SLOTS.MAIN_HAND);
    assert(result.success, 'Successfully equipped sword');
    assert(char.equipment.mainHand === sword, 'Sword is properly equipped in main hand');

    // Print final test results
    console.log('\n=== Test Results ===');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.total - testResults.passed}`);

    // Save test output to file
    fs.writeFileSync('equipment_test_results.txt', testOutput);
}

// Call the test function
runEquipmentTests();
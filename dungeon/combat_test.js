import { Character } from './character.js';
import { MonsterFactory } from './monsters/MonsterFactory.js';
import { CombatManager, Party } from './combat.js';
import { JOBS } from './jobs/index.js';
import { Weapon, Armor } from './equipment/index.js';
import { EQUIPMENT_SLOTS, WEAPON_TYPES, ARMOR_TYPES } from './equipment/index.js';
import fs from 'fs';

// Create basic equipment
function createBasicEquipment() {
    return {
        // Weapons
        bronzeSword: new Weapon({
            name: 'Bronze Sword',
            weaponType: WEAPON_TYPES.SWORD,
            stats: { pa: 4 },
            requirements: { jobs: ['Squire', 'Knight'] }
        }),
        woodenStaff: new Weapon({
            name: 'Wooden Staff',
            weaponType: WEAPON_TYPES.STAFF,
            stats: { pa: 1, ma: 3 },
            requirements: { jobs: ['Black Mage', 'White Mage'] }
        }),
        shortBow: new Weapon({
            name: 'Short Bow',
            weaponType: WEAPON_TYPES.BOW,
            stats: { pa: 3, sp: 1 },
            requirements: { jobs: ['Archer'] }
        }),
        
        // Armor
        bronzeArmor: new Armor({
            name: 'Bronze Armor',
            armorType: ARMOR_TYPES.HEAVY_ARMOR,
            stats: { hp: 20 },
            requirements: { jobs: ['Knight'] }
        }),
        leatherVest: new Armor({
            name: 'Leather Vest',
            armorType: ARMOR_TYPES.LIGHT_ARMOR,
            stats: { hp: 10 }
        }),
        clothRobe: new Armor({
            name: 'Cloth Robe',
            armorType: ARMOR_TYPES.ROBE,
            stats: { hp: 5, mp: 10 },
            requirements: { jobs: ['Black Mage', 'White Mage'] }
        }),
        bronzeShield: new Armor({
            name: 'Bronze Shield',
            armorType: ARMOR_TYPES.SHIELD,
            stats: { hp: 20 },
            requirements: { jobs: ['Knight'] }
        }),
        leatherCap: new Armor({
            name: 'Leather Cap',
            armorType: ARMOR_TYPES.HAT,
            stats: { hp: 10 }
        }),
        bronzeHelm: new Armor({
            name: 'Bronze Helm',
            armorType: ARMOR_TYPES.HELM,
            stats: { hp: 20 },
            requirements: { jobs: ['Knight'] }
        })
    };
}

// Helper to create a basic character with a job
function createTestCharacter(name, job, position = 'front') {
    const char = new Character(name);
    char.setPosition(position);
    char.gainJP(4000); // Give enough JP to change jobs
    char.setJob(JOBS.Chemist);
    char.gainJP(4000); // Give enough JP to change jobs
    char.setJob(job);
    
    // Initialize job-specific abilities and give JP
    const jobData = char.jobs[job];
    if (!jobData) return char;

    jobData.jp = 2000; // Give enough JP to learn abilities
    
    // Learn job-specific abilities
    switch (job) {
        case JOBS.Knight:
            char.learnAbility(job, 'active', 'SLASH_BLADE');
            char.learnAbility(job, 'active', 'BREAK_ARMOR');
            char.learnAbility(job, 'active', 'SHIELD_BASH');
            char.learnAbility(job, 'active', 'COVER');
            char.learnAbility(job, 'reaction', 'PARRY');
            char.learnAbility(job, 'support', 'EQUIP_SHIELD');
            break;
        case JOBS.BlackMage:
            char.learnAbility(job, 'active', 'FIRE');
            char.learnAbility(job, 'active', 'THUNDER');
            char.learnAbility(job, 'active', 'BLIZZARD');
            char.learnAbility(job, 'support', 'MAGIC_BOOST');
            break;
        case JOBS.WhiteMage:
            char.learnAbility(job, 'active', 'CURE');
            char.learnAbility(job, 'active', 'PROTECT');
            char.learnAbility(job, 'active', 'SHELL');
            char.learnAbility(job, 'support', 'HEALING_BOOST');
            break;
        case JOBS.Archer:
            char.learnAbility(job, 'active', 'CHARGE');
            char.learnAbility(job, 'active', 'RAPID_FIRE');
            char.learnAbility(job, 'active', 'ARROW_RAIN');
            char.learnAbility(job, 'support', 'CONCENTRATE');
            break;
    }
    
    // Equip appropriate gear
    const equipment = createBasicEquipment();
    switch (job) {
        case JOBS.Knight:
            char.equipItem(equipment.bronzeSword, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.bronzeShield, EQUIPMENT_SLOTS.OFF_HAND);
            char.equipItem(equipment.bronzeHelm, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.bronzeArmor, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.BlackMage:
            char.equipItem(equipment.woodenStaff, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.leatherCap, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.clothRobe, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.WhiteMage:
            char.equipItem(equipment.woodenStaff, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.leatherCap, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.clothRobe, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.Archer:
            char.equipItem(equipment.shortBow, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.leatherCap, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.leatherVest, EQUIPMENT_SLOTS.BODY);
            break;
    }
    
    // Show character stats and equipment after initialization
    console.log(`\n=== ${name}'s Setup ===`);
    console.log('Equipment:');
    Object.entries(char.equipment).forEach(([slot, item]) => {
        if (item) console.log(`${slot}: ${item.name}`);
    });
    
    console.log('\nAbilities:');
    const abilities = char.getAvailableAbilities();
    console.log('Active:', Object.keys(abilities.active));
    console.log('Reaction:', Object.keys(abilities.reaction));
    console.log('Support:', abilities.support.map(a => a.name));
    
    console.log('\nStats:', char.getStats());
    console.log('==================\n');
    
    return char;
}

// Helper to format HP display
function formatHP(current, max) {
    const percentage = (current / max) * 100;
    return `${current}/${max} (${percentage.toFixed(1)}%)`;
}

// Helper to print combat status
function printCombatStatus(state, combat) {
    console.log('\n=== Combat Status ===');
    
    // Print initiative order
    console.log('Initiative Order:');
    state.initiatives.forEach(actor => {
        const status = actor.hasActed ? '[ACTED]' : actor.initiative > 100 ? '[READY]' : '';
        console.log(`  ${actor.name.padEnd(15)} Initiative: ${actor.initiative.toFixed(1).padEnd(6)} ${status}`);
    });

    console.log('\nParty:');
    state.parties.A.forEach(member => {
        const character = combat.partyA.members.find(m => m.name === member.name);
        const maxHp = character.getMaxHP();
        const statusEffects = character.status.effects?.length ? 
            ` [${character.status.effects.map(e => e.name).join(', ')}]` : '';
        console.log(`  ${member.name.padEnd(10)} [${member.position.padEnd(5)}] `+
            `HP: ${formatHP(member.hp, maxHp).padEnd(20)} MP: ${member.mp}${statusEffects}`);
    });

    console.log('\nOpposing Forces:');
    state.parties.B.forEach(member => {
        const character = combat.partyB.members.find(m => m.name === member.name);
        const maxHp = character.getMaxHP();
        const statusEffects = character.status.effects?.length ? 
            ` [${character.status.effects.map(e => e.name).join(', ')}]` : '';
        console.log(`  ${member.name.padEnd(15)} [${member.position.padEnd(5)}] `+
            `HP: ${formatHP(member.hp, maxHp).padEnd(20)} MP: ${member.mp}${statusEffects}`);
    });
    console.log('==================\n');
}

// Helper to print action result
function printActionResult(actor, action, result) {
    let message = `${actor.name} `;
    
    if (action.type === 'ability') {
        message += `uses ${action.ability}`;
        
        // Handle AOE results
        if (result.isAoe && result.targets) {
            message += ' → AOE Effects:';
            result.targets.forEach(targetResult => {
                const targetName = targetResult.target?.name || 'unknown';
                if (targetResult.damage) {
                    message += `\n    ${targetName} takes ${targetResult.damage} damage`;
                }
                if (targetResult.healing) {
                    message += `\n    ${targetName} recovers ${targetResult.healing} HP`;
                }
                if (targetResult.effects?.length > 0) {
                    message += `\n    ${targetName} gains effects: ${targetResult.effects.map(e => e.type).join(', ')}`;
                }
            });
        } else {
            // Single target results
            if (result.damage) {
                const targetName = result.target?.name || action.target?.name || 'target';
                message += ` → ${targetName} takes ${result.damage} damage`;
            }
            if (result.healing) {
                const targetName = result.target?.name || action.target?.name || 'target';
                message += ` → ${targetName} recovers ${result.healing} HP`;
            }
            if (result.effects?.length > 0) {
                message += ` (${result.effects.map(e => e.type).join(', ')})`;
            }
        }
    } else if (action.type === 'skip') {
        message += 'skips their turn';
    }
    
    if (result.message && !message.includes(result.message)) {
        message += ` (${result.message})`;
    }
    
    console.log(message);

    // Debug output for BATTLE_CRY
    if (actor.name === 'Orc' && action.ability === 'BATTLE_CRY') {
        console.log('\n=== BATTLE_CRY Debug Info ===');
        console.log('Effects:', result.effects);
        if (result.targets) {
            result.targets.forEach(t => {
                console.log(`Target ${t.target.name} effects:`, 
                    t.target.status.effects.map(e => ({ 
                        name: e.name, 
                        duration: e.duration,
                        power: e.power 
                    }))
                );
            });
        }
        console.log('=== End BATTLE_CRY Debug ===\n');
    }
}

// Main test function
function runCombatTest() {
    console.log('=== Starting Combat Test ===\n');

    // Create party and monsters
    const playerParty = new Party();
    const monsterParty = new Party();
    
    // Create monsters
    const monsters = [
        MonsterFactory.createMonster('goblin'),
        MonsterFactory.createMonster('archer_goblin', 2),
        MonsterFactory.createMonster('dark_mage', 2),
        MonsterFactory.createMonster('orc', 3)
    ];

    // Add monsters to their party with appropriate positions
    monsters.forEach((monster, i) => {
        const position = i === 0 || i === 3 ? 'front' : 'back';  // Goblin and Orc in front, others in back
        monsterParty.addMember(monster, position);
    });
    
    // Initialize party members
    ['Roland', 'Vivi', 'Rosa', 'Maria'].forEach((name, i) => {
        const job = [JOBS.Knight, JOBS.BlackMage, JOBS.WhiteMage, JOBS.Archer][i];
        const position = i === 0 ? 'front' : 'back';
        const char = createTestCharacter(name, job, position);
        playerParty.addMember(char, position);
    });

    // Initialize combat
    const combat = new CombatManager(playerParty, monsterParty);
    const combatLog = [];
    let turnCount = 0;
    const MAX_TURNS = 100; // Increased to account for initiative-based turns

    function getValidTargets(currentActor, ability) {
        const isMonster = currentActor.entity.type === 'monster';
        if (ability?.type === 'healing' || ability?.type === 'buff') {
            return isMonster ? combat.partyB.members : combat.partyA.members;
        } else {
            return isMonster ? combat.partyA.members : combat.partyB.members;
        }
    }
    
       // Print initial state
       console.log('Initial Setup:');
       printCombatStatus(combat.getCombatState(), combat);
   
       while (combat.state === 'active' && turnCount < MAX_TURNS) {
           const state = combat.getCombatState();
           const currentActor = state.currentActor;
           
           if (!currentActor) {
               combat._updateInitiative();
               continue;
           }
   
           console.log(`\n=== Turn ${turnCount + 1} - ${currentActor.entity.name}'s Action ===`);
   
           let action;
           const entity = currentActor.entity;
           const abilities = entity.getAvailableAbilities();
           
           // Get valid targets based on entity type
           const validTargets = entity.type === 'monster' ? 
               combat.partyA.members.filter(m => m.status.hp > 0) :
               combat.partyB.members.filter(m => m.status.hp > 0);
   
           if (validTargets.length === 0) {
               action = { type: 'skip' };
           } else {
            // Choose appropriate ability based on job
            const monsterPartyMembers = combat.partyB.members;
            const playerPartyMembers = combat.partyA.members;
            switch (entity.currentJob) {
                case JOBS.Knight:
                case JOBS.BlackMage:
                case JOBS.WhiteMage:
                case JOBS.Archer:
                    action = currentActor.entity.getAIAction(monsterPartyMembers, playerPartyMembers);
                    if (action) {
                        console.log(`Player choosing ${action.ability} targeting:`, action.target.name);
                    } else {
                        console.log('Player has no valid action');
                    }
                    break;
                case 'monster':
                    // Monster's turn - use AI decision making
                    action = currentActor.entity.getAIAction(playerPartyMembers, monsterPartyMembers);
                    if (action) {
                        console.log(`Monster choosing ${action.ability} targeting:`, action.target.name);
                    } else {
                        console.log('Monster has no valid action');
                    }
                    break;
                default:
                    console.log('Default action: ATTACK targeting:', validTargets[0].name);
                    action = {
                        type: 'ability',
                        ability: 'ATTACK',
                        target: validTargets[0]
                    };
            }
        }


        const result = combat.processAction(action);
        printActionResult(currentActor.entity, action, result);
        
        // Print updated status after each action
        printCombatStatus(combat.getCombatState(), combat);

        turnCount++;
    }

    console.log('\n=== Combat Finished ===');
    console.log(`Result: ${combat.result || 'TIMEOUT'}`);
    console.log(`Total turns: ${turnCount}`);
    
    // Write final combat log
    fs.writeFileSync('combat_test_log.json', JSON.stringify(combatLog, null, 2));
    console.log('Combat simulation complete. Results written to combat_test_log.json');
    return combat.getCombatState();
}

// Run the test
runCombatTest();
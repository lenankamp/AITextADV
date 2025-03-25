import { CHARACTER } from './character.js';
import { MONSTERFACTORY } from './monsters/MonsterFactory.js';
import { COMBATMANAGER, PARTY } from './combat.js';
import { JOBS } from './jobs/index.js';
import { WEAPON, ARMOR } from './equipment/index.js';
import { EQUIPMENT_SLOTS, WEAPON_TYPES, ARMOR_TYPES } from './equipment/index.js';
import fs from 'fs';

// Create basic equipment
function createBasicEquipment() {
    return {
        // Weapons
        bronzeSword: new WEAPON({
            name: 'Bronze Sword',
            weaponType: WEAPON_TYPES.SWORD,
            stats: { pa: 4 },
            requirements: { jobs: ['Squire', 'Knight'] }
        }),
        woodenStaff: new WEAPON({
            name: 'Wooden Staff',
            weaponType: WEAPON_TYPES.STAFF,
            stats: { pa: 2, ma: 3 },
            requirements: { jobs: ['Black Mage', 'White Mage'] }
        }),
        shortBow: new WEAPON({
            name: 'Short Bow',
            weaponType: WEAPON_TYPES.BOW,
            stats: { pa: 3, sp: 1 },
            requirements: { jobs: ['Archer'] }
        }),
        
        // Armor
        bronzeArmor: new ARMOR({
            name: 'Bronze Armor',
            armorType: ARMOR_TYPES.HEAVY_ARMOR,
            stats: { defense: 3 },
            requirements: { jobs: ['Knight'] }
        }),
        leatherVest: new ARMOR({
            name: 'Leather Vest',
            armorType: ARMOR_TYPES.LIGHT_ARMOR,
            stats: { defense: 2, ev: 1 }
        }),
        clothRobe: new ARMOR({
            name: 'Cloth Robe',
            armorType: ARMOR_TYPES.ROBE,
            stats: { defense: 1, magicDefense: 2 },
            requirements: { jobs: ['Black Mage', 'White Mage'] }
        }),
        bronzeShield: new ARMOR({
            name: 'Bronze Shield',
            armorType: ARMOR_TYPES.SHIELD,
            stats: { defense: 2 },
            requirements: { jobs: ['Knight'] }
        }),
        leatherCap: new ARMOR({
            name: 'Leather Cap',
            armorType: ARMOR_TYPES.HAT,
            stats: { defense: 1 }
        }),
        bronzeHelm: new ARMOR({
            name: 'Bronze Helm',
            armorType: ARMOR_TYPES.HELM,
            stats: { defense: 2 },
            requirements: { jobs: ['Knight'] }
        })
    };
}

// Helper to create a basic character with a job
function createTestCharacter(name, job, position = 'front') {
    const char = new CHARACTER(name);
    char.setPosition(position);
    char.gainJP(4000); // Give enough JP to change jobs
    char.setJob(JOBS.CHEMIST);
    char.gainJP(4000); // Give enough JP to change jobs
    char.setJob(job);
    
    // Initialize job-specific abilities and give JP
    const jobData = char.jobs[job];
    if (!jobData) return char;

    jobData.jp = 2000; // Give enough JP to learn abilities
    
    // Learn job-specific abilities
    switch (job) {
        case JOBS.KNIGHT:
            char.learnAbility(job, 'active', 'SLASH_BLADE');
            char.learnAbility(job, 'active', 'BREAK_ARMOR');
            char.learnAbility(job, 'active', 'SHIELD_BASH');
            char.learnAbility(job, 'active', 'COVER');
            char.learnAbility(job, 'reaction', 'PARRY');
            char.learnAbility(job, 'support', 'EQUIP_SHIELD');
            break;
        case JOBS.BLACK_MAGE:
            char.learnAbility(job, 'active', 'FIRE');
            char.learnAbility(job, 'active', 'THUNDER');
            char.learnAbility(job, 'active', 'BLIZZARD');
            char.learnAbility(job, 'support', 'MAGIC_BOOST');
            break;
        case JOBS.WHITE_MAGE:
            char.learnAbility(job, 'active', 'CURE');
            char.learnAbility(job, 'active', 'PROTECT');
            char.learnAbility(job, 'active', 'SHELL');
            char.learnAbility(job, 'support', 'HEALING_BOOST');
            break;
        case JOBS.ARCHER:
            char.learnAbility(job, 'active', 'CHARGE');
            char.learnAbility(job, 'active', 'RAPID_FIRE');
            char.learnAbility(job, 'active', 'ARROW_RAIN');
            char.learnAbility(job, 'support', 'CONCENTRATE');
            break;
    }
    
    // Equip appropriate gear
    const equipment = createBasicEquipment();
    switch (job) {
        case JOBS.KNIGHT:
            char.equipItem(equipment.bronzeSword, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.bronzeShield, EQUIPMENT_SLOTS.OFF_HAND);
            char.equipItem(equipment.bronzeHelm, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.bronzeArmor, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.BLACK_MAGE:
            char.equipItem(equipment.woodenStaff, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.leatherCap, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.clothRobe, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.WHITE_MAGE:
            char.equipItem(equipment.woodenStaff, EQUIPMENT_SLOTS.MAIN_HAND);
            char.equipItem(equipment.leatherCap, EQUIPMENT_SLOTS.HEAD);
            char.equipItem(equipment.clothRobe, EQUIPMENT_SLOTS.BODY);
            break;
        case JOBS.ARCHER:
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
    console.log('Party:');
    state.partyStatus.forEach(member => {
        const maxHp = combat.party.members.find(m => m.name === member.name).getMaxHP();
        console.log(`  ${member.name.padEnd(10)} [${member.position.padEnd(5)}] HP: ${formatHP(member.hp, maxHp).padEnd(20)} MP: ${member.mp}`);
    });

    console.log('\nMonsters:');
    state.monsterStatus.forEach(monster => {
        const maxHp = combat.monsters.find(m => m.name === monster.name).getMaxHP();
        console.log(`  ${monster.name.padEnd(15)} [${monster.position.padEnd(5)}] HP: ${formatHP(monster.hp, maxHp).padEnd(20)} MP: ${monster.mp}`);
    });
    console.log('==================\n');
}

// Helper to print action result
function printActionResult(actor, action, result) {
    let message = `${actor.name} `;
    
    if (action.type === 'ability') {
        message += `uses ${action.ability}`;
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
    } else if (action.type === 'skip') {
        message += 'skips their turn';
    }
    
    if (result.message && !message.includes(result.message)) {
        message += ` (${result.message})`;
    }
    
    console.log(message);
}

// Main test function
function runCombatTest() {
    console.log('=== Starting Combat Test ===\n');

    // Create party and monsters
    const party = new PARTY();
    const monsters = [
        MONSTERFACTORY.createMonster('goblin'),
        MONSTERFACTORY.createMonster('archer_goblin', 2),
        MONSTERFACTORY.createMonster('dark_mage', 2),
        MONSTERFACTORY.createMonster('orc', 3)
    ];
    
    // Move these to the outer scope so they can be accessed by printCombatStatus
    
    // Initialize party members
    ['Roland', 'Vivi', 'Rosa', 'Maria'].forEach((name, i) => {
        const job = [JOBS.KNIGHT, JOBS.BLACK_MAGE, JOBS.WHITE_MAGE, JOBS.ARCHER][i];
        const position = i === 0 ? 'front' : 'back';
        const char = createTestCharacter(name, job, position);
        party.addMember(char, position);
    });

    // Initialize combat
    const combat = new COMBATMANAGER(party, monsters);
    const combatLog = [];
    let turnCount = 0;
    const MAX_TURNS = 10;

    // Print initial state
    console.log('Initial Setup:');
    printCombatStatus(combat.getCombatState(), combat);

    while (combat.state === 'active' && turnCount < MAX_TURNS) {
        console.log(`\n=== Turn ${turnCount + 1} ===`);
        
        const currentActor = combat.getCurrentActor();
        if (!currentActor) {
            console.log('No valid actor found');
            break;
        }

        let action;
        if (currentActor.type === 'party') {
            // Party member's turn
            const abilities = currentActor.entity.getAvailableAbilities();
            const validTargets = combat.getValidTargets(currentActor);

            if (validTargets.length === 0) {
                action = { type: 'skip' };
            } else {
                // Choose appropriate ability based on job
                switch (currentActor.entity.currentJob) {
                    case JOBS.KNIGHT:
                        // Knights use BREAK for damage, or PROTECT for defense
                        if (abilities.active.BREAK) {
                            action = {
                                type: 'ability',
                                ability: 'BREAK',
                                target: validTargets[0]
                            };
                        } else {
                            action = {
                                type: 'ability',
                                ability: 'ATTACK',
                                target: validTargets[0]
                            };
                        }
                        break;
                    case JOBS.BLACK_MAGE:
                        // Black Mages prefer FIRE for damage
                        if (abilities.active.FIRE) {
                            action = {
                                type: 'ability',
                                ability: 'FIRE',
                                target: validTargets[0]
                            };
                        } else if (abilities.active.THUNDER) {
                            action = {
                                type: 'ability',
                                ability: 'THUNDER',
                                target: validTargets[0]
                            };
                        } else {
                            action = {
                                type: 'ability',
                                ability: 'ATTACK',
                                target: validTargets[0]
                            };
                        }
                        break;
                    case JOBS.WHITE_MAGE:
                        // Find wounded ally
                        const woundedAlly = party.members.find(m => m.status.hp < m.getMaxHP());
                        if (woundedAlly && abilities.active.CURE) {
                            action = {
                                type: 'ability',
                                ability: 'CURE',
                                target: woundedAlly
                            };
                        } else if (abilities.active.PROTECT) {
                            // Cast PROTECT on front line if no healing needed
                            const frontLine = party.members.find(m => m.position === 'front');
                            if (frontLine) {
                                action = {
                                    type: 'ability',
                                    ability: 'PROTECT',
                                    target: frontLine
                                };
                            }
                        } else {
                            action = {
                                type: 'ability',
                                ability: 'ATTACK',
                                target: validTargets[0]
                            };
                        }
                        break;
                    case JOBS.ARCHER:
                        // Archers prefer RAPID_FIRE for consistent damage
                        if (abilities.active.RAPID_FIRE) {
                            action = {
                                type: 'ability',
                                ability: 'RAPID_FIRE',
                                target: validTargets[0]
                            };
                        } else if (abilities.active.AIM) {
                            action = {
                                type: 'ability',
                                ability: 'AIM',
                                target: validTargets[0]
                            };
                        } else {
                            action = {
                                type: 'ability',
                                ability: 'ATTACK',
                                target: validTargets[0]
                            };
                        }
                        break;
                    default:
                        action = {
                            type: 'ability',
                            ability: 'ATTACK',
                            target: validTargets[0]
                        };
                }
            }
        } else {
            // Monster's turn
            action = currentActor.entity.getAIAction(party.members);
            if (!action) {
                action = { type: 'skip' };
            }
        }

        const result = combat.processAction(action);
        printActionResult(currentActor.entity, action, result);
        
        // Print updated status if significant changes occurred
        if (result.damage || result.healing) {
            printCombatStatus(combat.getCombatState(), combat);
        }

        turnCount++;
    }

    console.log('\n=== Combat Finished ===');
    console.log(`Result: ${combat.state.toUpperCase()}`);
    console.log(`Total turns: ${turnCount}`);
    
    // Write final combat log
    fs.writeFileSync('combat_test_log.json', JSON.stringify(combatLog, null, 2));
    console.log('Combat simulation complete. Results written to combat_test_log.json');
    return combat.getCombatState();
}

// Run the test
runCombatTest();
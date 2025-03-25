import { Character } from './character.js';
import { MonsterFactory } from './monsters/MonsterFactory.js';
import { CombatManager, Party } from './combat.js';
import { JOBS } from './jobs/index.js';
import fs from 'fs';

// Helper to create a basic character with a job
function createTestCharacter(name, job, position = 'front') {
    console.log(`Creating character ${name} with job ${job}...`);
    const char = new Character(name);
    char.setPosition(position);
    
    // Initialize job data and set current job
    char.setJob(job);
    
    // Initialize job-specific abilities and give JP
    const jobData = char.jobs[job];
    if (!jobData) return char;

    jobData.jp = 1000; // Give enough JP to learn abilities
    
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
    
    // Show character stats after initialization
    const abilities = char.getAvailableAbilities();
    console.log(`${name}'s abilities:`, abilities);
    
    const stats = char.getStats();
    console.log(`${name} created with stats:`, stats);
    return char;
}

// Main test function
function runCombatTest() {
    console.log('Initializing combat test...');

    // Create party
    const party = new Party();
    
    // Initialize Knight (front row physical attacker)
    const knight = createTestCharacter('Roland', JOBS.KNIGHT, 'front');
    party.addMember(knight, 'front');

    // Initialize Black Mage (back row magical attacker)
    const blackMage = createTestCharacter('Vivi', JOBS.BLACK_MAGE, 'back');
    party.addMember(blackMage, 'back');

    // Initialize White Mage (back row healer)
    const whiteMage = createTestCharacter('Rosa', JOBS.WHITE_MAGE, 'back');
    party.addMember(whiteMage, 'back');

    // Initialize Archer (back row ranged attacker)
    const archer = createTestCharacter('Maria', JOBS.ARCHER, 'back');
    party.addMember(archer, 'back');

    // Create monster party
    const monsters = [
        MonsterFactory.createMonster('goblin'),
        MonsterFactory.createMonster('archer_goblin', 2),
        MonsterFactory.createMonster('dark_mage', 2),
        MonsterFactory.createMonster('orc', 3)
    ];

    // Initialize combat
    const combat = new CombatManager(party, monsters);
    console.log('Combat initialized');

    // Run combat simulation
    const combatLog = [];
    let turnCount = 0;
    const MAX_TURNS = 10; // Prevent infinite loops during testing

    while (combat.state === 'active' && turnCount < MAX_TURNS) {
        const state = combat.getCombatState();
        console.log(`\nTurn ${state.turn}:`);
        console.log('Party Status:', state.partyStatus);
        console.log('Monster Status:', state.monsterStatus);

        const currentActor = combat.getCurrentActor();
        if (!currentActor) {
            console.log('No valid actor found');
            break;
        }

        let action;
        if (currentActor.type === 'party') {
            // Party member's turn
            const abilities = currentActor.entity.getAvailableAbilities();
            console.log(`${currentActor.entity.name}'s available abilities:`, abilities);
            
            const validTargets = combat.getValidTargets(currentActor);
            console.log(`Valid targets for ${currentActor.entity.name}:`, validTargets.map(t => t.name));

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
        console.log('Action result:', result);

        // Log combat state
        combatLog.push({
            turn: state.turn,
            currentActor: currentActor.entity.name,
            action,
            result,
            partyStatus: state.partyStatus,
            monsterStatus: state.monsterStatus
        });

        turnCount++;
    }

    console.log('\nCombat finished!');
    console.log('Final state:', combat.getCombatState());
    console.log(`Total turns: ${turnCount}`);

    // Write final combat log
    fs.writeFileSync('combat_test_log.json', JSON.stringify(combatLog, null, 2));
    console.log('Combat simulation complete. Results written to combat_test_log.json');
    return combat.getCombatState();
}

// Run the test
runCombatTest();
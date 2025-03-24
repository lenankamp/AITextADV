import { Character } from './character.js';
import { CombatManager, MonsterFactory } from './combat.js';
import { JOBS } from './jobs/index.js';
import fs from 'fs';

// Create a test party
class Party {
    constructor() {
        this.members = [];
    }

    addMember(member) {
        this.members.push(member);
    }

    isWiped() {
        return this.members.every(member => member.status.hp <= 0);
    }
}

// Helper to create a basic character with a job
function createTestCharacter(name, job, position = 'front') {
    const char = new Character(name);
    char.setJob(job);
    char.setPosition(position);
    // Give some basic abilities for testing
    const jobData = char.jobs[job];
    const abilities = char.getAvailableAbilities();
    // Learn first 3 active abilities
    Object.keys(abilities.active).slice(0, 3).forEach(abilityId => {
        char.learnAbility(job, 'active', abilityId);
    });
    return char;
}

// Create test party
const party = new Party();
party.addMember(createTestCharacter('Warrior', JOBS.KNIGHT));
party.addMember(createTestCharacter('Mage', JOBS.BLACK_MAGE, 'back'));
party.addMember(createTestCharacter('Healer', JOBS.WHITE_MAGE, 'back'));
party.addMember(createTestCharacter('Archer', JOBS.ARCHER, 'back'));

// Create test monsters
const monsters = [
    MonsterFactory.createMonster('orc', 5),
    MonsterFactory.createMonster('archer_goblin', 4),
    MonsterFactory.createMonster('dark_mage', 4)
];

// Initialize combat
const combat = new CombatManager(party, monsters);
const combatLog = [];

// Helper to log combat state
function logCombatState(state) {
    const turnLog = {
        turn: state.turn,
        currentActor: state.currentActor ? {
            name: state.currentActor.entity.name,
            type: state.currentActor.type,
            waitTime: state.currentActor.waitTime
        } : null,
        partyStatus: state.partyStatus,
        monsterStatus: state.monsterStatus
    };
    combatLog.push(turnLog);
}

// Run combat simulation
console.log('Starting combat simulation...');
while (combat.state === 'active') {
    const state = combat.getCombatState();
    logCombatState(state);
    
    const currentActor = combat.getCurrentActor();
    if (!currentActor) {
        combat._advanceTurn();
        continue;
    }

    let action;
    if (currentActor.type === 'monster') {
        // Let monster AI handle it
        action = { type: 'auto' };
    } else {
        // For party members, use first available ability on first valid target
        const abilities = currentActor.entity.getAvailableAbilities();
        const firstAbility = Object.keys(abilities.active)[0];
        const validTargets = combat.getValidTargets(currentActor);
        if (firstAbility && validTargets.length > 0) {
            action = {
                type: 'ability',
                ability: firstAbility,
                target: validTargets[0]
            };
        }
    }

    if (action) {
        const result = combat.processAction(action);
        console.log(`${currentActor.entity.name} acted with result:`, result);
    }
}

// Write final combat log
const finalState = combat.getCombatState();
combatLog.push({
    finalState: {
        result: finalState.result,
        partyStatus: finalState.partyStatus,
        monsterStatus: finalState.monsterStatus
    }
});

fs.writeFileSync('combat_test_log.json', JSON.stringify(combatLog, null, 2));
console.log('Combat simulation complete. Results written to combat_test_log.json');
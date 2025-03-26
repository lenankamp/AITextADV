import { Character } from './character.js';
import { JOBS } from './jobs/index.js';
import * as JobClasses from './jobs/index.js';
import fs from 'fs';

// Group jobs by tier for proper progression testing
const JOB_TIERS = {
    BASE: [JOBS.Squire, JOBS.Chemist],
    TIER2: [JOBS.Knight, JOBS.Archer, JOBS.WhiteMage, JOBS.BlackMage],
    TIER3: [JOBS.Monk, JOBS.Thief, JOBS.Oracle, JOBS.TimeMage],
    TIER4: [JOBS.Geomancer, JOBS.Dragoon, JOBS.Summoner, JOBS.Orator],
    ADVANCED: [JOBS.Samurai, JOBS.Ninja, JOBS.Calculator, JOBS.Dancer, JOBS.Bard],
    SPECIAL: [JOBS.Mime]
};

class AbilityTester {
    constructor() {
        this.report = [];
        this.logLine('Ability Test Report\n==================\n');
        this.cumulativeTotals = {
            totalAbilities: 0,
            successCount: 0,
            failureCount: 0,
            errorCount: 0
        };
    }

    logLine(text) {
        this.report.push(text);
        console.log(text);
    }

    saveReport(filename) {
        fs.writeFileSync(filename, this.report.join('\n'));
    }

    // Create a character with all prerequisites for testing
    prepareCharacter(jobId) {
        const character = new Character('Tester');
        character.level = 50; // High level for testing
        
        // Get requirements for this job
        const JobClass = this.getJobClass(jobId);
        if (!JobClass) return null;
        
        const requirements = JobClass.getRequirements();
        if (requirements) {
            // Set up prerequisite jobs first
            Object.entries(requirements).forEach(([requiredJob, requiredLevel]) => {
                // Initialize the job first
                character.setJob(requiredJob);
                // Then give it JP and learn abilities
                character.gainJP(10000);
                this.learnJobAbilities(character, requiredJob);
                // Now that the job is initialized, we can safely set its level
                if (character.jobs[requiredJob]) {
                    character.jobs[requiredJob].level = requiredLevel;
                }
            });
        }
        
        // Now set the actual job we want to test
        character.setJob(jobId);
        character.gainJP(10000);
        this.learnJobAbilities(character, jobId);
        
        // Set final status
        character.status.hp = character.getMaxHP();
        character.status.mp = character.getMaxMP();
        
        return character;
    }

    // Helper to get job class safely
    getJobClass(jobId) {
        return Object.values(JobClasses).find(j => 
            j?.prototype?.constructor?.name === jobId ||
            j === jobId
        );
    }

    learnJobAbilities(character, jobId) {
        // Get the job class
        const JobClass = Object.values(JobClasses).find(j => 
            j?.prototype?.constructor?.name === jobId ||
            j === jobId
        );

        if (!JobClass?.getAbilities) return;

        const abilities = JobClass.getAbilities();
        if (!abilities) return;

        // Handle nested ability structures
        if (abilities.active) {
            const activeAbilities = abilities.active.abilities || abilities.active;
            Object.keys(activeAbilities).forEach(abilityId => {
                if (abilityId !== 'name') {  // Skip the name property
                    character.learnAbility(jobId, 'active', abilityId);
                }
            });
        }

        // Learn reaction abilities if present
        if (abilities.reaction) {
            Object.keys(abilities.reaction).forEach(abilityId => {
                character.learnAbility(jobId, 'reaction', abilityId);
            });
        }

        // Learn support abilities if present
        if (abilities.support) {
            Object.keys(abilities.support).forEach(abilityId => {
                character.learnAbility(jobId, 'support', abilityId);
            });
        }
    }

    // Create a target dummy for testing abilities
    prepareTarget() {
        const target = new Character('Target');
        target.level = 50;
        target.status.hp = target.getMaxHP();
        target.status.mp = target.getMaxMP();
        return target;
    }

    // Test all active abilities for a job
    testJobAbilities(character, jobId) {
        this.logLine(`\nTesting ${jobId} Abilities\n${'-'.repeat(20)}`);
        
        // Create a fresh target for this test
        const target = this.prepareTarget();

        // Get only active abilities from the job class
        const JobClass = JobClasses[jobId];
        const abilities = JobClass?.getAbilities()?.active?.abilities || {};
        
        if (Object.keys(abilities).length === 0) {
            this.logLine('No active abilities found for this job.');
            return;
        }

        let successCount = 0;
        let failureCount = 0;
        let errorCount = 0;
        const totalAbilities = Object.keys(abilities).length;

        // Test each active ability
        Object.entries(abilities).forEach(([abilityId, ability]) => {
            this.logLine(`\nTesting: ${ability.name || abilityId}`);
            
            // Reset character and target HP/MP before each test
            character.status.hp = character.getMaxHP();
            character.status.mp = character.getMaxMP();
            target.status.hp = target.getMaxHP();
            target.status.mp = target.getMaxMP();

            try {
                const result = character.useAbility(abilityId, target);
                
                // Count as success if ability executed or just missed
                if (result.success || result.message === "Attack missed") {
                    this.logLine('✓ Ability executed successfully');
                    if (result.damage) {
                        this.logLine(`  Damage dealt: ${result.damage}`);
                    }
                    if (result.healing) {
                        this.logLine(`  Healing done: ${result.healing}`);
                    }
                    if (result.effects && result.effects.length > 0) {
                        this.logLine(`  Effects applied: ${result.effects.map(e => e.type).join(', ')}`);
                    }
                    successCount++;
                } else {
                    this.logLine(`✗ Ability failed: ${result.message || 'No error message'}`);
                    failureCount++;
                }
            } catch (error) {
                this.logLine(`✗ Error executing ability: ${error.message}`);
                console.error(error);
                errorCount++;
            }
        });

        // Add to cumulative totals
        this.cumulativeTotals.totalAbilities += totalAbilities;
        this.cumulativeTotals.successCount += successCount;
        this.cumulativeTotals.failureCount += failureCount;
        this.cumulativeTotals.errorCount += errorCount;

        // Add summary for this job
        this.logLine(`\nJob Summary:`);
        this.logLine(`Total abilities: ${totalAbilities}`);
        this.logLine(`Successful: ${successCount}`);
        this.logLine(`Failed: ${failureCount}`);
        this.logLine(`Errors: ${errorCount}`);
    }

    // Run tests for all jobs in proper tier order
    runAllTests() {
        this.logLine('Starting comprehensive ability tests...\n');

        const character = new Character('Tester');
        character.level = 50;

        // Test each tier in order, keeping job levels between tiers
        Object.entries(JOB_TIERS).forEach(([tier, jobs]) => {
            this.logLine(`\n${tier} JOBS\n=========`);
            jobs.forEach(jobId => {
                const JobClass = this.getJobClass(jobId);
                if (!JobClass) return;
                
                // Check if we meet requirements
                const requirements = JobClass.getRequirements();
                if (requirements) {
                    // Ensure prerequisites are met
                    Object.entries(requirements).forEach(([requiredJob, requiredLevel]) => {
                        if (!character.jobs[requiredJob] || character.jobs[requiredJob].level < requiredLevel) {
                            // Switch to prerequisite job temporarily
                            character.setJob(requiredJob);
                            character.gainJP(10000);
                            this.learnJobAbilities(character, requiredJob);
                            character.jobs[requiredJob].level = requiredLevel;
                        }
                    });
                }

                // Now set the job we want to test
                character.setJob(jobId);
                character.gainJP(10000);
                this.learnJobAbilities(character, jobId);
                
                // Test the abilities for this job
                this.testJobAbilities(character, jobId);
            });
        });

        // Add cumulative totals at the end
        this.logLine('\n==================');
        this.logLine('CUMULATIVE TOTALS');
        this.logLine('==================');
        this.logLine(`Total abilities tested: ${this.cumulativeTotals.totalAbilities}`);
        this.logLine(`Total successful: ${this.cumulativeTotals.successCount} (${Math.round(this.cumulativeTotals.successCount / this.cumulativeTotals.totalAbilities * 100)}%)`);
        this.logLine(`Total failed: ${this.cumulativeTotals.failureCount} (${Math.round(this.cumulativeTotals.failureCount / this.cumulativeTotals.totalAbilities * 100)}%)`);
        this.logLine(`Total errors: ${this.cumulativeTotals.errorCount} (${Math.round(this.cumulativeTotals.errorCount / this.cumulativeTotals.totalAbilities * 100)}%)`);
        this.logLine('==================\n');

        this.logLine('Ability testing complete!');
    }
}

// Run the tests
const tester = new AbilityTester();
tester.runAllTests();
tester.saveReport('ability_test_results.txt');
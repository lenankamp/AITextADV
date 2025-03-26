import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as JobClasses from './dungeon/jobs/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatReactionAbility(name, ability) {
    let output = `${name}:\n`;
    Object.entries(ability).forEach(([key, value]) => {
        if (key !== 'name' && typeof value !== 'object') {
            output += `  ${key}: ${value}\n`;
        }
    });
    return output + '\n';
}

function analyzeCounterAbilities() {
    const outputFile = path.join(__dirname, 'counter_abilities.txt');
    let output = 'Counter/Reaction Ability Analysis\n';
    output += '============================\n\n';

    // Get all job classes from the index while filtering out non-job entries
    const jobClasses = Object.entries(JobClasses)
        .filter(([name, value]) => {
            return name !== 'JobInterface' && 
                   name !== 'default' && 
                   name !== 'JOBS' &&
                   typeof value === 'function' &&
                   value.prototype;
        });

    // Analyze each job class
    for (const [jobName, JobClass] of jobClasses) {
        try {
            const abilities = JobClass.getAbilities?.() || {};
            
            // Only process if the job has reaction abilities
            if (abilities.reaction) {
                output += `${jobName}\n${'='.repeat(jobName.length)}\n\n`;
                Object.values(abilities.reaction).forEach(ability => {
                    output += formatReactionAbility(ability.name, ability);
                });
                output += '-'.repeat(40) + '\n\n';
            }
        } catch (error) {
            console.error(`Error processing ${jobName}:`, error);
            output += `Error: Unable to process ${jobName}'s reaction abilities\n\n`;
        }
    }

    fs.writeFileSync(outputFile, output);
    console.log(`Analysis complete. Results written to ${outputFile}`);
}

analyzeCounterAbilities();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as JobClasses from './dungeon/jobs/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to format ability description
function formatAbility(name, ability) {
    let result = `${name}:\n`;
    Object.entries(ability).forEach(([key, value]) => {
        if (key !== 'name') { // Skip name since we already used it
            result += `  ${key}: ${value}\n`;
        }
    });
    return result;
}

// Main analysis function
function analyzeJobs() {
    const jobsDir = path.join(__dirname, 'dungeon', 'jobs');
    const outputFile = path.join(__dirname, 'job_analysis.txt');
    let output = '';
    let missingDescriptions = [];

    // Get all job classes from the index
    const jobClasses = Object.entries(JobClasses)
        .filter(([name]) => name !== 'JobInterface' && name !== 'default');

    for (const [jobName, JobClass] of jobClasses) {
        output += `\n${jobName}\n${'='.repeat(jobName.length)}\n\n`;
        
        // Check for description
        const description = JobClass.getDescription?.();
        if (description) {
            output += `Description:\n-----------\n${description}\n\n`;
        } else {
            missingDescriptions.push(jobName);
        }
        
        const abilities = JobClass.getAbilities();
        
        // Base stats
        const baseStats = JobClass.getBaseStats();
        output += 'Base Stats:\n-----------\n';
        Object.entries(baseStats).forEach(([stat, value]) => {
            output += `${stat.toUpperCase()}: ${value}\n`;
        });
        output += '\n';

        // Growth rates
        const growthRates = JobClass.getGrowthRates();
        output += 'Growth Rates:\n-------------\n';
        Object.entries(growthRates).forEach(([stat, value]) => {
            output += `${stat.toUpperCase()}: ${value}\n`;
        });
        output += '\n';
        
        // Active abilities
        if (abilities.active?.abilities) {
            output += 'Active Abilities:\n----------------\n';
            Object.entries(abilities.active.abilities).forEach(([name, ability]) => {
                output += formatAbility(name, ability) + '\n';
            });
            output += '\n';
        }

        // Reaction abilities
        if (abilities.reaction) {
            output += 'Reaction Abilities:\n------------------\n';
            Object.entries(abilities.reaction).forEach(([name, ability]) => {
                output += formatAbility(name, ability) + '\n';
            });
            output += '\n';
        }

        // Support abilities
        if (abilities.support) {
            output += 'Support Abilities:\n-----------------\n';
            Object.entries(abilities.support).forEach(([name, ability]) => {
                output += formatAbility(name, ability) + '\n';
            });
            output += '\n';
        }

        // Job requirements
        const requirements = JobClass.getRequirements();
        if (requirements) {
            output += 'Requirements:\n------------\n';
            Object.entries(requirements).forEach(([job, level]) => {
                output += `${job} level ${level}\n`;
            });
            output += '\n';
        }

        output += '='.repeat(50) + '\n\n';
    }

    // Add missing descriptions summary at the top
    if (missingDescriptions.length > 0) {
        output = `Jobs Missing Descriptions:\n======================\n${missingDescriptions.join('\n')}\n\n${output}`;
    }

    fs.writeFileSync(outputFile, output);
    console.log(`Analysis complete. Results written to ${outputFile}`);
    if (missingDescriptions.length > 0) {
        console.log(`\nWarning: The following jobs are missing descriptions:\n${missingDescriptions.join('\n')}`);
    }
}

analyzeJobs();
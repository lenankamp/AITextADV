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
        if (key !== 'name' && typeof value !== 'object') {
            result += `  ${key}: ${value}\n`;
        }
    });
    return result;
}

// Helper function to handle ability sections
function formatAbilitySection(abilities, sectionName) {
    let output = `${sectionName}:\n${'-'.repeat(sectionName.length)}\n`;
    
    if (!abilities) return '';

    // Handle nested ability structure (like Calculator's Arithmeticks)
    if (abilities.name && abilities.abilities) {
        output += `${abilities.name}:\n`;
        Object.values(abilities.abilities).forEach(ability => {
            output += formatAbility(ability.name, ability);
        });
    }
    // Handle array format
    else if (Array.isArray(abilities)) {
        abilities.forEach(ability => {
            output += formatAbility(ability.name, ability);
        });
    }
    // Handle object format
    else {
        Object.values(abilities).forEach(ability => {
            output += formatAbility(ability.name, ability);
        });
    }
    
    return output + '\n';
}

// Main analysis function
function analyzeJobs() {
    const jobsDir = path.join(__dirname, 'dungeon', 'jobs');
    const outputFile = path.join(__dirname, 'job_analysis.txt');
    let output = '';
    let missingDescriptions = [];

    // Get all job classes from the index while filtering out non-job entries
    const jobClasses = Object.entries(JobClasses)
        .filter(([name, value]) => {
            return name !== 'JobInterface' && 
                   name !== 'default' && 
                   name !== 'JOBS' &&
                   typeof value === 'function' &&
                   value.prototype;
        });

    for (const [jobName, JobClass] of jobClasses) {
        output += `\n${jobName}\n${'='.repeat(jobName.length)}\n\n`;
        
        try {
            // Check for description
            const description = JobClass.getDescription?.();
            if (description) {
                output += `Description:\n-----------\n${description}\n\n`;
            } else {
                missingDescriptions.push(jobName);
            }
            
            // Get abilities using static method
            const abilities = JobClass.getAbilities?.() || {};
            
            // Base stats
            const baseStats = JobClass.getBaseStats?.() || {};
            if (Object.keys(baseStats).length > 0) {
                output += 'Base Stats:\n-----------\n';
                Object.entries(baseStats).forEach(([stat, value]) => {
                    output += `${stat.toUpperCase()}: ${value}\n`;
                });
                output += '\n';
            }

            // Growth rates
            const growthRates = JobClass.getGrowthRates?.() || {};
            if (Object.keys(growthRates).length > 0) {
                output += 'Growth Rates:\n-------------\n';
                Object.entries(growthRates).forEach(([stat, value]) => {
                    output += `${stat.toUpperCase()}: ${value}\n`;
                });
                output += '\n';
            }
            
            // Process each ability type
            if (abilities.active) {
                output += formatAbilitySection(abilities.active, 'Active Abilities');
            }
            
            if (abilities.reaction) {
                output += formatAbilitySection(abilities.reaction, 'Reaction Abilities');
            }
            
            if (abilities.support) {
                output += formatAbilitySection(abilities.support, 'Support Abilities');
            }

            // Job requirements
            const requirements = JobClass.getRequirements?.();
            if (requirements) {
                output += 'Requirements:\n------------\n';
                Object.entries(requirements).forEach(([job, level]) => {
                    output += `${job} level ${level}\n`;
                });
                output += '\n';
            }
        } catch (error) {
            console.error(`Error processing ${jobName}:`, error);
            output += `Error: Unable to process job class\n`;
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
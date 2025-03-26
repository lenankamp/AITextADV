import fs from 'fs';
import path from 'path';
import * as Jobs from './dungeon/jobs/index.js';

// Parse support abilities from all job classes
function getSupportAbilities() {
    const abilities = [];
    
    Object.entries(Jobs).forEach(([jobName, JobClass]) => {
        // Skip non-job entries
        if (jobName === 'JOBS' || jobName === 'JobInterface' || typeof JobClass !== 'function') {
            return;
        }

        try {
            const jobAbilities = JobClass.getAbilities?.();
            if (jobAbilities?.support) {
                Object.entries(jobAbilities.support).forEach(([abilityId, ability]) => {
                    abilities.push({
                        job: jobName,
                        id: abilityId,
                        ...ability
                    });
                });
            }
        } catch (error) {
            console.error(`Error processing ${jobName}'s support abilities:`, error);
        }
    });

    return abilities;
}

// Analyze implementation in character.js
function analyzeImplementation(abilities) {
    const characterJs = fs.readFileSync('./dungeon/character.js', 'utf8');
    const results = [];

    for (const ability of abilities) {
        const nameMatches = (characterJs.match(new RegExp(ability.name, 'g')) || []).length;
        const effectMatches = ability.effect ? 
            (characterJs.match(new RegExp(ability.effect, 'g')) || []).length : 0;
        
        // Look for specific support ability handling patterns
        const supportHandlingMatches = (characterJs.match(new RegExp(`support.*${ability.effect}`, 'g')) || []).length;
        const effectHandlingMatches = (characterJs.match(new RegExp(`_effect.*${ability.effect}`, 'g')) || []).length;
        
        results.push({
            job: ability.job,
            name: ability.name,
            effect: ability.effect || 'N/A',
            nameOccurrences: nameMatches,
            effectOccurrences: effectMatches,
            supportHandling: supportHandlingMatches,
            effectHandling: effectHandlingMatches,
            totalReferences: nameMatches + effectMatches + supportHandlingMatches + effectHandlingMatches
        });
    }

    return results;
}

// Generate report
function generateReport(results) {
    let report = 'Support Ability Implementation Analysis\n';
    report += '====================================\n\n';

    let currentJob = '';
    for (const result of results) {
        if (currentJob !== result.job) {
            currentJob = result.job;
            report += `\n${currentJob}\n${'-'.repeat(currentJob.length)}\n\n`;
        }
        
        report += `${result.name}:\n`;
        report += `  Effect: ${result.effect}\n`;
        report += `  Name occurrences: ${result.nameOccurrences}\n`;
        report += `  Effect occurrences: ${result.effectOccurrences}\n`;
        report += `  Support handling: ${result.supportHandling}\n`;
        report += `  Effect handling: ${result.effectHandling}\n`;
        report += `  Total references: ${result.totalReferences}\n\n`;
    }

    // Add summary section
    const totalAbilities = results.length;
    const implementedAbilities = results.filter(r => r.totalReferences > 0).length;
    const missingAbilities = results.filter(r => r.totalReferences === 0);
    const multipleHandledAbilities = results.filter(r => r.effectOccurrences > 1);

    report += '\nSummary\n=======\n\n';
    report += `Total support abilities: ${totalAbilities}\n`;
    report += `Implemented abilities: ${implementedAbilities}\n`;
    report += `Missing abilities: ${totalAbilities - implementedAbilities}\n\n`;

    if (missingAbilities.length > 0) {
        report += 'Missing Implementations:\n';
        report += '----------------------\n';
        for (const ability of missingAbilities) {
            report += `- ${ability.job}: ${ability.name} (${ability.effect})\n`;
        }
        report += '\n';
    }

    if (multipleHandledAbilities.length > 0) {
        report += 'Multiple Handler Warnings:\n';
        report += '------------------------\n';
        for (const ability of multipleHandledAbilities) {
            report += `- ${ability.job}: ${ability.name} (${ability.effect}) - ${ability.effectOccurrences} effect handlers\n`;
        }
    }

    return report;
}

// Main execution
const supportAbilities = getSupportAbilities();
const analysisResults = analyzeImplementation(supportAbilities);
const report = generateReport(analysisResults);

// Write report to file
fs.writeFileSync('support_analysis.txt', report);
console.log('Analysis complete! Check support_analysis.txt for results.');
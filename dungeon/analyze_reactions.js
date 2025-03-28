import fs from 'fs';
import path from 'path';

// Read the counter abilities file
const counterAbilitiesText = fs.readFileSync('./counter_abilities.txt', 'utf8');
const characterJsText = fs.readFileSync('./character.js', 'utf8');

// Parse counter abilities
function parseCounterAbilities(text) {
    const abilities = [];
    let currentJob = '';
    let currentAbility = null;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.match(/^[A-Za-z]+$/)) {
            currentJob = line.trim();
        } else if (line.match(/^[A-Za-z ]+:$/)) {
            if (currentAbility) {
                abilities.push(currentAbility);
            }
            currentAbility = {
                name: line.replace(':', '').trim(),
                job: currentJob,
                properties: {}
            };
        } else if (line.match(/^\s+\w+:/)) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (currentAbility) {
                currentAbility.properties[key] = value;
            }
        }
    }
    if (currentAbility) {
        abilities.push(currentAbility);
    }
    return abilities;
}

const reactionAbilities = parseCounterAbilities(counterAbilitiesText);

// Analyze usage in character.js
function analyzeUsage(abilities, characterCode) {
    const results = [];
    
    for (const ability of abilities) {
        const nameMatches = (characterCode.match(new RegExp(ability.name, 'g')) || []).length;
        const effectMatches = ability.properties.effect ? 
            (characterCode.match(new RegExp(ability.properties.effect, 'g')) || []).length : 0;
        
        results.push({
            job: ability.job,
            ability: ability.name,
            effect: ability.properties.effect || 'N/A',
            nameOccurrences: nameMatches,
            effectOccurrences: effectMatches
        });
    }
    
    return results;
}

const analysisResults = analyzeUsage(reactionAbilities, characterJsText);

// Generate report
let report = 'Reaction Ability Usage Analysis\n';
report += '============================\n\n';

let currentJob = '';
for (const result of analysisResults) {
    if (currentJob !== result.job) {
        currentJob = result.job;
        report += `\n${currentJob}\n${'='.repeat(currentJob.length)}\n\n`;
    }
    
    report += `${result.ability}:\n`;
    report += `  Effect: ${result.effect}\n`;
    report += `  Name occurrences: ${result.nameOccurrences}\n`;
    report += `  Effect occurrences: ${result.effectOccurrences}\n`;
    report += `  Total references: ${result.nameOccurrences + result.effectOccurrences}\n\n`;
}

// Add summary
const totalAbilities = analysisResults.length;
const implementedAbilities = analysisResults.filter(r => r.nameOccurrences + r.effectOccurrences > 0).length;
const missingAbilities = analysisResults.filter(r => r.nameOccurrences + r.effectOccurrences === 0);
const multipleHandledAbilities = analysisResults.filter(r => r.effectOccurrences > 1);

report += '\nSummary\n=======\n\n';
report += `Total reaction abilities: ${totalAbilities}\n`;
report += `Implemented abilities: ${implementedAbilities}\n`;
report += `Missing abilities: ${totalAbilities - implementedAbilities}\n\n`;

if (missingAbilities.length > 0) {
    report += 'Missing Implementations:\n';
    report += '----------------------\n';
    for (const ability of missingAbilities) {
        report += `- ${ability.job}: ${ability.ability} (${ability.effect})\n`;
    }
    report += '\n';
}

if (multipleHandledAbilities.length > 0) {
    report += 'Multiple Handler Warnings:\n';
    report += '------------------------\n';
    for (const ability of multipleHandledAbilities) {
        report += `- ${ability.job}: ${ability.ability} (${ability.effect}) - ${ability.effectOccurrences} handlers\n`;
    }
}

// Write the report
fs.writeFileSync('reaction_analysis.txt', report);
console.log('Analysis complete! Check reaction_analysis.txt for results.');
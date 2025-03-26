import * as Jobs from './dungeon/jobs/index.js';
import fs from 'fs';

class AbilityAnalyzer {
    constructor() {
        this.effects = new Map(); // Changed to Map to track counts
        this.types = new Map();   // Changed to Map to track counts
        this.elements = new Map(); // Changed to Map to track counts
        this.mechanics = {
            aoe: [],
            charge: [],
            hits: [],
            range: []
        };
        this.targetingTypes = new Set();
        this.propertyUsage = new Map();
        this.jobEffects = new Map();
    }

    analyze() {
        // Analyze each job class
        Object.entries(Jobs).forEach(([jobName, JobClass]) => {
            // Skip the JOBS constant and non-job exports
            if (jobName === 'JOBS' || jobName.toLowerCase() === jobName) return;
            
            // Get abilities using the static method
            const abilities = JobClass.getAbilities();
            if (abilities) {
                this.analyzeJobAbilities(jobName, abilities);
            }
        });
        return this.generateReport();
    }

    analyzeJobAbilities(jobName, abilities) {
        const jobEffects = new Set();

        // Process each ability category (active, reaction, support)
        Object.entries(abilities).forEach(([category, categoryData]) => {
            // For the active category, abilities are nested under abilities property
            const abilityList = category === 'active' ? categoryData.abilities : categoryData;
            
            if (!abilityList) return; // Skip if category is empty

            Object.entries(abilityList).forEach(([abilityId, ability]) => {
                // Track all property names used
                Object.keys(ability).forEach(prop => {
                    if (!this.propertyUsage.has(prop)) {
                        this.propertyUsage.set(prop, new Set());
                    }
                    this.propertyUsage.get(prop).add(`${jobName}.${category}.${abilityId}`);
                });

                // Track types with count
                if (ability.type) {
                    this.types.set(ability.type, (this.types.get(ability.type) || 0) + 1);
                }

                // Track elements with count
                if (ability.element) {
                    this.elements.set(ability.element, (this.elements.get(ability.element) || 0) + 1);
                }

                // Track effects with count
                if (ability.effect) {
                    if (Array.isArray(ability.effect)) {
                        ability.effect.forEach(e => {
                            this.effects.set(e, (this.effects.get(e) || 0) + 1);
                            jobEffects.add(e);
                        });
                    } else {
                        this.effects.set(ability.effect, (this.effects.get(ability.effect) || 0) + 1);
                        jobEffects.add(ability.effect);
                    }
                }

                // Track special mechanics
                if (ability.aoe) this.mechanics.aoe.push(`${jobName}.${category}.${abilityId}`);
                if (ability.charge) this.mechanics.charge.push(`${jobName}.${category}.${abilityId}`);
                if (ability.hits) this.mechanics.hits.push(`${jobName}.${category}.${abilityId}`);
                if (ability.range) this.mechanics.range.push(`${jobName}.${category}.${abilityId}`);

                // Track targeting
                if (ability.target) {
                    this.targetingTypes.add(ability.target);
                }
            });
        });

        this.jobEffects.set(jobName, Array.from(jobEffects));
    }

    generateReport() {
        // Sort maps by count for reporting
        const sortedTypes = Array.from(this.types.entries())
            .sort((a, b) => b[1] - a[1]);
        const sortedElements = Array.from(this.elements.entries())
            .sort((a, b) => b[1] - a[1]);
        const sortedEffects = Array.from(this.effects.entries())
            .sort((a, b) => b[1] - a[1]);

        const report = {
            summary: {
                totalEffects: this.effects.size,
                totalTypes: this.types.size,
                totalElements: this.elements.size,
                totalTargetingTypes: this.targetingTypes.size
            },
            details: {
                types: sortedTypes,
                elements: sortedElements,
                effects: sortedEffects,
                targetingTypes: Array.from(this.targetingTypes),
                mechanics: this.mechanics,
            },
            properties: {},
            jobAnalysis: {}
        };

        // Generate property usage report
        this.propertyUsage.forEach((usages, prop) => {
            report.properties[prop] = {
                totalUsages: usages.size,
                examples: Array.from(usages).slice(0, 3) // First 3 examples
            };
        });

        // Generate per-job effect analysis
        this.jobEffects.forEach((effects, jobName) => {
            report.jobAnalysis[jobName] = {
                totalEffects: effects.length,
                effects: effects
            };
        });

        return report;
    }

    generateFormattedOutput() {
        const report = this.analyze();
        let output = '=== Ability Analysis Report ===\n\n';

        // Summary Section
        output += 'Summary:\n';
        output += JSON.stringify(report.summary, null, 2) + '\n\n';

        // Types Section with counts
        output += 'Ability Types (by frequency):\n';
        report.details.types.forEach(([type, count]) => {
            output += `${type}: ${count} uses\n`;
        });
        output += '\n';

        // Elements Section with counts
        output += 'Elements (by frequency):\n';
        report.details.elements.forEach(([element, count]) => {
            output += `${element}: ${count} uses\n`;
        });
        output += '\n';

        // Effects Section with counts
        output += 'All Effects (by frequency):\n';
        report.details.effects.forEach(([effect, count]) => {
            output += `${effect}: ${count} uses\n`;
        });
        output += '\n';

        // Targeting Types Section
        output += 'Targeting Types:\n';
        output += JSON.stringify(report.details.targetingTypes, null, 2) + '\n\n';

        // Mechanics Usage Section
        output += 'Mechanics Usage:\n';
        Object.entries(report.details.mechanics).forEach(([mechanic, usages]) => {
            if (usages.length > 0) {
                output += `\n${mechanic.toUpperCase()} (${usages.length} abilities):\n`;
                output += JSON.stringify(usages, null, 2) + '\n';
            }
        });

        // Property Usage Section
        output += '\nProperty Usage Analysis:\n';
        Object.entries(report.properties).forEach(([prop, data]) => {
            output += `\n${prop}:\n`;
            output += `Used ${data.totalUsages} times\n`;
            output += `Examples: ${JSON.stringify(data.examples, null, 2)}\n`;
        });

        // Per-Job Effect Analysis Section
        output += '\nPer-Job Effect Analysis:\n';
        Object.entries(report.jobAnalysis).forEach(([jobName, analysis]) => {
            output += `\n${jobName}:\n`;
            output += `Total effects: ${analysis.totalEffects}\n`;
            output += `Effects: ${JSON.stringify(analysis.effects, null, 2)}\n`;
        });

        return output;
    }
}

// Run analysis and save to file
const analyzer = new AbilityAnalyzer();
const output = analyzer.generateFormattedOutput();
fs.writeFileSync('ability_analysis.txt', output, 'utf8');
console.log('Analysis complete. Results written to ability_analysis.txt');
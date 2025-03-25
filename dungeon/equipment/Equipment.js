import { EQUIPMENT_TYPES } from './index.js';

export class Equipment {
    constructor(config) {
        this.name = config.name;
        this.type = config.type;
        this.rarity = config.rarity || 'common';
        this.stats = config.stats || {};
        this.effects = config.effects || [];
        this.triggers = config.triggers || [];
        this.requirements = config.requirements || {};
        this.description = config.description || '';
        this.value = config.value || 0;
        this.resistances = config.resistances || [];
        this.weaknesses = config.weaknesses || [];
        this.immunities = config.immunities || [];
    }

    canBeEquippedBy(character) {
        // Check job requirements
        if (this.requirements.jobs && 
            !this.requirements.jobs.includes(character.currentJob)) {
            return false;
        }

        // Check level requirements
        if (this.requirements.level && 
            character.level < this.requirements.level) {
            return false;
        }

        // Check stat requirements
        if (this.requirements.stats) {
            const stats = character.getStats();
            for (const [stat, value] of Object.entries(this.requirements.stats)) {
                if (stats[stat] < value) {
                    return false;
                }
            }
        }

        return true;
    }

    getStatModifiers() {
        return this.stats;
    }

    getTriggerEffects() {
        return this.triggers;
    }

    getPassiveEffects() {
        return this.effects;
    }
}
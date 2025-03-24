// Remove old import
// import { JOBS, JOB_REQUIREMENTS, JOB_STAT_GROWTH, JOB_BASE_STATS, ABILITY_TYPES, JOB_ABILITIES } from './jobs.js';
// Add new imports
import { JOBS } from './jobs/index.js';
import { JobInterface } from './jobs/JobInterface.js';

// Base character class
class Character {
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.experience = 0;
        this.jp = 0; // Job Points
        
        // Job system
        this.jobs = {
            [JOBS.SQUIRE]: { level: 1, jp: 0, mastered: false },
            [JOBS.CHEMIST]: { level: 1, jp: 0, mastered: false }
        };
        
        this.currentJob = JOBS.SQUIRE;
        this.abilities = {
            secondaryActive: null,
            reaction: null,
            support: []
        };
        
        this.baseStats = {
            hp: 100,
            mp: 50,
            pa: 5,
            ma: 5,
            sp: 5,
            ev: 5
        };
        
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        this.inventory = [];
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };
    }

    // Job Management
    setJob(jobId) {
        if (!this.canChangeToJob(jobId)) {
            return false;
        }
        this.currentJob = jobId;
        if (!this.jobs[jobId]) {
            this.jobs[jobId] = { level: 1, jp: 0, mastered: false };
        }
        return true;
    }

    canChangeToJob(jobId) {
        const JobClass = JobInterface.getJobClass(jobId);
        if (!JobClass) return false;
        const requirements = JobClass.getRequirements();
        if (!requirements) return true; // Base jobs have no requirements
        
        return Object.entries(requirements).every(([requiredJob, requiredLevel]) =>
            this.jobs[requiredJob] && this.jobs[requiredJob].level >= requiredLevel
        );
    }

    gainJP(amount) {
        this.jp += amount;
        const currentJobData = this.jobs[this.currentJob];
        currentJobData.jp += amount;
        
        // Check for job level up
        const jpNeeded = this.getJPNeededForNextLevel(currentJobData.level);
        if (currentJobData.jp >= jpNeeded) {
            currentJobData.jp -= jpNeeded;
            currentJobData.level++;
            return true;
        }
        return false;
    }

    getJPNeededForNextLevel(currentLevel) {
        return Math.floor(100 * Math.pow(1.1, currentLevel - 1));
    }

    // Ability Management
    setSecondaryActive(jobId) {
        if (!this.jobs[jobId]) return false;
        this.abilities.secondaryActive = jobId;
        return true;
    }

    setReactionAbility(jobId, abilityId) {
        if (!this.jobs[jobId] || !JOB_ABILITIES[jobId].reaction[abilityId]) return false;
        this.abilities.reaction = { jobId, abilityId };
        return true;
    }

    setSupportAbility(jobId, abilityId) {
        if (!this.jobs[jobId] || !JOB_ABILITIES[jobId].support[abilityId]) return false;
        if (this.abilities.support.length >= 2) return false;
        
        this.abilities.support.push({ jobId, abilityId });
        return true;
    }

    removeSupport(index) {
        if (index >= 0 && index < this.abilities.support.length) {
            this.abilities.support.splice(index, 1);
            return true;
        }
        return false;
    }

    // Stat Calculations
    getMaxHP() {
        const baseGrowth = (this.level - 1) * 10;
        const jobBonus = this._calculateJobStats().hp;
        return this.baseStats.hp + baseGrowth + jobBonus;
    }

    getMaxMP() {
        const baseGrowth = (this.level - 1) * 5;
        const jobBonus = this._calculateJobStats().mp;
        return this.baseStats.mp + baseGrowth + jobBonus;
    }

    getStats() {
        const baseStats = { ...this.baseStats };
        const jobStats = this._calculateJobStats();
        const equipStats = this._calculateEquipmentStats();
        
        return {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            pa: baseStats.pa + jobStats.pa + equipStats.pa,
            ma: baseStats.ma + jobStats.ma + equipStats.ma,
            sp: baseStats.sp + jobStats.sp + equipStats.sp,
            ev: baseStats.ev + jobStats.ev + equipStats.ev
        };
    }

    _calculateJobStats() {
        const currentJobData = this.jobs[this.currentJob];
        const JobClass = JobInterface.getJobClass(this.currentJob);
        const jobGrowth = JobClass.getGrowthRates();
        const jobBase = JobClass.getBaseStats();
        
        return {
            hp: jobBase.hp + (jobGrowth.hp * (currentJobData.level - 1)),
            mp: jobBase.mp + (jobGrowth.mp * (currentJobData.level - 1)),
            pa: jobBase.pa + (jobGrowth.pa * (currentJobData.level - 1)),
            ma: jobBase.ma + (jobGrowth.ma * (currentJobData.level - 1)),
            sp: jobBase.sp + (jobGrowth.sp * (currentJobData.level - 1)),
            ev: jobBase.ev + (jobGrowth.ev * (currentJobData.level - 1))
        };
    }

    _calculateEquipmentStats() {
        const stats = { pa: 0, ma: 0, sp: 0, ev: 0 };
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = this.equipment[slot];
            if (item) {
                Object.keys(stats).forEach(stat => {
                    stats[stat] += item[stat] || 0;
                });
            }
        });
        return stats;
    }

    // Experience and Leveling
    gainExperience(amount) {
        this.experience += amount;
        while (this.experience >= this.getExperienceForNextLevel()) {
            this.levelUp();
        }
    }

    getExperienceForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    levelUp() {
        this.experience -= this.getExperienceForNextLevel();
        this.level++;
        
        // Increase base stats
        this.baseStats.hp += 10;
        this.baseStats.mp += 5;
        this.baseStats.pa += 0.5;
        this.baseStats.ma += 0.5;
        this.baseStats.sp += 0.3;
        this.baseStats.ev += 0.2;
        
        // Heal to full
        this.status.hp = this.getMaxHP();
        this.status.mp = this.getMaxMP();
        
        return true;
    }

    // Combat Methods
    getAvailableAbilities() {
        const currentJobClass = JobInterface.getJobClass(this.currentJob);
        const currentJobAbilities = currentJobClass.getAbilities();
        const secondaryJobClass = this.abilities.secondaryActive ? JobInterface.getJobClass(this.abilities.secondaryActive) : null;
        const secondaryAbilities = secondaryJobClass ? secondaryJobClass.getAbilities() : null;

        const abilities = {
            active: { ...currentJobAbilities.active.abilities },
            secondary: secondaryJobClass ? { ...secondaryAbilities.active.abilities } : {},
            reaction: null,
            support: []
        };

        if (this.abilities.reaction) {
            const reactionJobClass = JobInterface.getJobClass(this.abilities.reaction.jobId);
            const reactionAbilities = reactionJobClass.getAbilities();
            abilities.reaction = reactionAbilities.reaction[this.abilities.reaction.abilityId];
        }

        abilities.support = this.abilities.support.map(({ jobId, abilityId }) => {
            const supportJobClass = JobInterface.getJobClass(jobId);
            const supportAbilities = supportJobClass.getAbilities();
            return supportAbilities.support[abilityId];
        });

        return abilities;
    }

    useAbility(ability, target) {
        const abilities = this.getAvailableAbilities();
        let abilityData = abilities.active[ability] || abilities.secondary[ability];
        
        if (!abilityData) {
            return { success: false, message: 'Ability not found' };
        }

        if (this.status.mp < abilityData.mp) {
            return { success: false, message: 'Not enough MP' };
        }

        // Apply ability effects
        this.status.mp -= abilityData.mp;
        let result = { success: true, effects: [] };

        switch (abilityData.type) {
            case 'physical':
                result.damage = this._calculatePhysicalDamage(abilityData, target);
                break;
            case 'magical':
                result.damage = this._calculateMagicalDamage(abilityData, target);
                break;
            case 'healing':
                result.healing = this._calculateHealing(abilityData);
                break;
            case 'buff':
                result.effects.push({
                    ...abilityData.effect,
                    duration: abilityData.duration || 3
                });
                break;
        }

        return result;
    }

    _calculatePhysicalDamage(ability, target) {
        const stats = this.getStats();
        const baseDamage = stats.pa * ability.power;
        return Math.floor(baseDamage * (1 - target.getStats().ev / 100));
    }

    _calculateMagicalDamage(ability, target) {
        const stats = this.getStats();
        const baseDamage = stats.ma * ability.power;
        return Math.floor(baseDamage * (1 - target.getStats().ev / 100));
    }

    _calculateHealing(ability) {
        const stats = this.getStats();
        return Math.floor(stats.ma * ability.power);
    }

    // Status Effect Methods
    addEffect(effect) {
        this.status.effects.push(effect);
    }

    removeEffect(effectName) {
        this.status.effects = this.status.effects.filter(effect => effect.name !== effectName);
    }

    updateEffects() {
        this.status.effects = this.status.effects
            .map(effect => ({
                ...effect,
                duration: effect.duration - 1
            }))
            .filter(effect => effect.duration > 0);
    }
}

export {
    Character
};
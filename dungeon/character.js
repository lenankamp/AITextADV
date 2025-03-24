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
            [JOBS.SQUIRE]: { 
                level: 1, 
                jp: 0, 
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: {},
                    reaction: {},
                    support: {}
                }
            },
            [JOBS.CHEMIST]: { 
                level: 1, 
                jp: 0, 
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: {},
                    reaction: {},
                    support: {}
                }
            }
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
            this.jobs[jobId] = { 
                level: 1, 
                jp: 0, 
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: {},
                    reaction: {},
                    support: {}
                }
            };
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

    // Ability Learning Methods
    canLearnAbility(jobId, abilityType, abilityId) {
        const jobData = this.jobs[jobId];
        if (!jobData) return false;

        const JobClass = JobInterface.getJobClass(jobId);
        const abilities = JobClass.getAbilities();
        const ability = abilities[abilityType]?.abilities?.[abilityId] || 
                       abilities[abilityType]?.[abilityId];
        
        if (!ability) return false;

        // Check if already learned
        if (jobData.learnedAbilities[abilityType][abilityId]) return false;

        // Check if we have enough available JP
        const availableJP = jobData.jp + (jobData.spentJp || 0);
        return availableJP >= ability.jpCost;
    }

    learnAbility(jobId, abilityType, abilityId) {
        if (!this.canLearnAbility(jobId, abilityType, abilityId)) return false;

        const jobData = this.jobs[jobId];
        const JobClass = JobInterface.getJobClass(jobId);
        const abilities = JobClass.getAbilities();
        const ability = abilities[abilityType]?.abilities?.[abilityId] || 
                       abilities[abilityType]?.[abilityId];

        // Spend JP
        const jpCost = ability.jpCost;
        const availableJP = jobData.jp + jobData.spentJp;
        
        if (availableJP < jpCost) return false;

        // If cost would exceed current JP, use from spent JP first
        let remainingCost = jpCost;
        if (remainingCost > jobData.jp) {
            remainingCost -= jobData.jp;
            jobData.jp = 0;
            jobData.spentJp -= remainingCost;
        } else {
            jobData.jp -= remainingCost;
        }
        jobData.spentJp += jpCost;

        // Mark ability as learned
        jobData.learnedAbilities[abilityType][abilityId] = true;

        // Check for job mastery
        this.checkJobMastery(jobId);

        return true;
    }

    checkJobMastery(jobId) {
        const jobData = this.jobs[jobId];
        if (!jobData || jobData.mastered) return false;

        const JobClass = JobInterface.getJobClass(jobId);
        const abilities = JobClass.getAbilities();

        // Check if all abilities are learned
        const isAllLearned = Object.entries(abilities).every(([type, typeData]) => {
            const abilityList = typeData.abilities || typeData;
            return Object.keys(abilityList).every(abilityId => 
                jobData.learnedAbilities[type][abilityId]
            );
        });

        if (isAllLearned) {
            jobData.mastered = true;
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

    _calculatePhysicalDamage(ability, target) {
        const stats = this.getStats();
        const targetStats = target.getStats();
        
        // Base damage calculation using physical attack and ability power
        let damage = stats.pa * (ability.power || 1);
        
        // Apply variance (±10%)
        const variance = 0.1;
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        damage *= randomFactor;
        
        // Apply target defense unless ability is piercing
        if (!ability.effect?.includes('armor_pierce')) {
            const defenseRatio = 100 / (100 + targetStats.pa);
            damage *= defenseRatio;
        }
        
        return Math.floor(damage);
    }

    _calculateMagicalDamage(ability, target) {
        const stats = this.getStats();
        const targetStats = target.getStats();
        
        // Base damage calculation using magical attack and ability power
        let damage = stats.ma * (ability.power || 1);
        
        // Apply variance (±15% for magical attacks)
        const variance = 0.15;
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        damage *= randomFactor;
        
        // Apply target magical defense
        const defenseRatio = 100 / (100 + targetStats.ma);
        damage *= defenseRatio;
        
        // Apply elemental modifiers if any
        if (ability.element) {
            const elementMultiplier = target.getElementalMultiplier?.(ability.element) || 1;
            damage *= elementMultiplier;
        }
        
        return Math.floor(damage);
    }

    _calculateHealing(ability) {
        const stats = this.getStats();
        
        // Base healing calculation using magical attack and ability power
        let healing = stats.ma * (ability.power || 1);
        
        // Apply variance (±5% for healing)
        const variance = 0.05;
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        healing *= randomFactor;
        
        // Apply any healing boost effects
        const healingBoost = this.status.effects
            .filter(effect => effect.name === 'enhance_healing')
            .reduce((total, effect) => total + (effect.power || 0.2), 1);
        
        healing *= healingBoost;
        
        return Math.floor(healing);
    }

    getElementalMultiplier(element) {
        // Check for elemental resistances or weaknesses from equipment and effects
        let multiplier = 1;
        
        // Check equipment for resistances/weaknesses
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = this.equipment[slot];
            if (item?.resistances?.includes(element)) {
                multiplier *= 0.5;
            }
            if (item?.weaknesses?.includes(element)) {
                multiplier *= 1.5;
            }
        });
        
        // Check status effects for temporary resistances/weaknesses
        this.status.effects.forEach(effect => {
            if (effect.name === `resist_${element}`) {
                multiplier *= 0.5;
            }
            if (effect.name === `weak_${element}`) {
                multiplier *= 1.5;
            }
        });
        
        return multiplier;
    }

    isImmuneToEffect(effectName) {
        // Check if immune to this type of effect
        const immuneEffects = this.status.effects
            .filter(effect => effect.name === 'prevent_status')
            .map(effect => effect.prevents || [])
            .flat();
        
        if (immuneEffects.includes(effectName)) {
            return true;
        }
        
        // Check equipment for immunities
        return ['weapon', 'armor', 'accessory'].some(slot => 
            this.equipment[slot]?.immunities?.includes(effectName)
        );
    }

    getWeaknesses() {
        const weaknesses = new Set();
        
        // Check equipment for weaknesses
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = this.equipment[slot];
            if (item?.weaknesses) {
                item.weaknesses.forEach(w => weaknesses.add(w));
            }
        });
        
        // Add temporary weaknesses from status effects
        this.status.effects.forEach(effect => {
            if (effect.name.startsWith('weak_')) {
                weaknesses.add(effect.name.replace('weak_', ''));
            }
        });
        
        return Array.from(weaknesses);
    }

    getResistances() {
        const resistances = new Set();
        
        // Check equipment for resistances
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const item = this.equipment[slot];
            if (item?.resistances) {
                item.resistances.forEach(r => resistances.add(r));
            }
        });
        
        // Add temporary resistances from status effects
        this.status.effects.forEach(effect => {
            if (effect.name.startsWith('resist_')) {
                resistances.add(effect.name.replace('resist_', ''));
            }
        });
        
        return Array.from(resistances);
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
            active: {},
            secondary: {},
            reaction: null,
            support: []
        };

        // Filter active abilities to only include learned ones
        Object.entries(currentJobAbilities.active.abilities).forEach(([id, ability]) => {
            if (this.jobs[this.currentJob].learnedAbilities.active[id]) {
                abilities.active[id] = ability;
            }
        });

        // Filter secondary abilities
        if (secondaryJobClass && this.abilities.secondaryActive) {
            Object.entries(secondaryAbilities.active.abilities).forEach(([id, ability]) => {
                if (this.jobs[this.abilities.secondaryActive].learnedAbilities.active[id]) {
                    abilities.secondary[id] = ability;
                }
            });
        }

        // Only include learned reaction ability
        if (this.abilities.reaction) {
            const reactionJobClass = JobInterface.getJobClass(this.abilities.reaction.jobId);
            const reactionAbilities = reactionJobClass.getAbilities();
            if (this.jobs[this.abilities.reaction.jobId].learnedAbilities.reaction[this.abilities.reaction.abilityId]) {
                abilities.reaction = reactionAbilities.reaction[this.abilities.reaction.abilityId];
            }
        }

        // Only include learned support abilities
        abilities.support = this.abilities.support
            .filter(({jobId, abilityId}) => 
                this.jobs[jobId].learnedAbilities.support[abilityId])
            .map(({jobId, abilityId}) => {
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
                result = this._resolvePhysicalAbility(abilityData, target);
                break;
            case 'magical':
                result = this._resolveMagicalAbility(abilityData, target);
                break;
            case 'healing':
                result = this._resolveHealingAbility(abilityData, target);
                break;
            case 'support':
                result = this._resolveSupportAbility(abilityData, target);
                break;
            case 'status':
                result = this._resolveStatusAbility(abilityData, target);
                break;
            case 'drain':
                result = this._resolveDrainAbility(abilityData, target);
                break;
            case 'analyze':
                result = this._resolveAnalyzeAbility(abilityData, target);
                break;
            case 'special':
                // Defer to job-specific implementation
                const JobClass = JobInterface.getJobClass(this.currentJob);
                result = JobClass.resolveSpecialAbility(abilityData, this, target);
                break;
            case 'dungeon':
                result = { success: false, message: 'This ability cannot be used in combat' };
                break;
        }

        // Apply any additional effects if the ability was successful
        if (result.success && abilityData.effect) {
            if (Array.isArray(abilityData.effect)) {
                abilityData.effect.forEach(effect => {
                    result.effects.push(this._applyEffect(effect, target));
                });
            } else {
                result.effects.push(this._applyEffect(abilityData.effect, target));
            }
        }

        return result;
    }

    _resolvePhysicalAbility(ability, target) {
        const result = { success: true, effects: [] };
        result.damage = this._calculatePhysicalDamage(ability, target);
        
        // Handle multi-hit abilities
        if (ability.hits) {
            result.damage *= ability.hits;
            result.hits = ability.hits;
        }

        // Handle AoE abilities
        if (ability.aoe) {
            result.isAoe = true;
        }

        // Apply armor piercing if specified
        if (ability.effect?.includes('armor_pierce')) {
            result.isPiercing = true;
        }

        return result;
    }

    _resolveMagicalAbility(ability, target) {
        const result = { success: true, effects: [] };
        result.damage = this._calculateMagicalDamage(ability, target);

        // Handle elemental aspects
        if (ability.element) {
            result.element = ability.element;
            // Check for resistances/weaknesses
            const elementMultiplier = target.getElementalMultiplier?.(ability.element) || 1;
            result.damage = Math.floor(result.damage * elementMultiplier);
        }

        // Handle AoE abilities
        if (ability.aoe) {
            result.isAoe = true;
        }

        return result;
    }

    _resolveHealingAbility(ability, target) {
        const result = { success: true, effects: [] };
        result.healing = this._calculateHealing(ability);

        // Handle AoE healing
        if (ability.aoe) {
            result.isAoe = true;
        }

        return result;
    }

    _resolveSupportAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        if (ability.effect) {
            const effects = Array.isArray(ability.effect) ? ability.effect : [ability.effect];
            effects.forEach(effect => {
                result.effects.push({
                    type: effect,
                    duration: ability.duration || 3,
                    power: ability.power || 1
                });
            });
        }

        if (ability.aoe) {
            result.isAoe = true;
        }

        return result;
    }

    _resolveStatusAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        if (ability.effect) {
            const effects = Array.isArray(ability.effect) ? ability.effect : [ability.effect];
            effects.forEach(effect => {
                // Check if status effect applies based on chance
                const chance = ability.chance || 0.5; // Default 50% chance if not specified
                if (Math.random() < chance) {
                    result.effects.push({
                        type: effect,
                        duration: ability.duration || 3,
                        power: ability.power || 1
                    });
                }
            });
        }

        if (ability.aoe) {
            result.isAoe = true;
        }

        return result;
    }

    _resolveDrainAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        // Calculate base damage
        if (ability.type === 'physical') {
            result.damage = this._calculatePhysicalDamage(ability, target);
        } else {
            result.damage = this._calculateMagicalDamage(ability, target);
        }

        // Calculate drain amount (usually a percentage of damage dealt)
        const drainRatio = ability.drainRatio || 0.5; // Default to 50% if not specified
        
        if (ability.effect === 'hp_drain') {
            result.healing = Math.floor(result.damage * drainRatio);
            result.drainType = 'hp';
        } else if (ability.effect === 'mp_drain') {
            result.mpRestore = Math.floor(result.damage * drainRatio);
            result.drainType = 'mp';
        }

        return result;
    }

    _resolveAnalyzeAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        result.analysis = {
            stats: target.getStats(),
            weaknesses: target.getWeaknesses?.() || [],
            resistances: target.getResistances?.() || []
        };

        // Some analyze abilities might reveal specific information
        if (ability.reveals) {
            ability.reveals.forEach(info => {
                switch (info) {
                    case 'abilities':
                        result.analysis.abilities = target.getAvailableAbilities();
                        break;
                    case 'status':
                        result.analysis.status = target.status;
                        break;
                    case 'equipment':
                        result.analysis.equipment = target.equipment;
                        break;
                }
            });
        }

        return result;
    }

    _applyEffect(effect, target) {
        const duration = 3; // Default duration if not specified
        const effectResult = {
            type: effect,
            duration: duration,
            success: true
        };

        // Check if target is immune to this effect
        if (target.isImmuneToEffect?.(effect)) {
            effectResult.success = false;
            effectResult.message = 'Target is immune';
            return effectResult;
        }

        target.addEffect({
            name: effect,
            duration: duration,
            source: this.name
        });

        return effectResult;
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
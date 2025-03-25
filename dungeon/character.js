import { JOBS, JobInterface } from './jobs/index.js';
import * as Jobs from './jobs/index.js';

// Base character class
class Character {
    constructor(name) {
        this.name = name;
        this.level = 1;
        this.experience = 0;
        this.jp = 0;
        this.position = 'front';
        this.jobs = {};
        this._cachedJobData = new Map();
        
        this.baseAbilities = {
            active: {
                ATTACK: {
                    name: 'Attack',
                    type: 'physical',
                    power: 1,
                    mp: 0,
                    description: 'Basic physical attack'
                }
            },
            reaction: {},
            support: {}
        };
        
        this.currentJob = null;
        this.abilities = { ...this.baseAbilities };
        
        this.baseStats = {
            hp: 100,
            mp: 50,
            pa: 5,
            ma: 5,
            sp: 5,
            ev: 5
        };
        
        this.equipment = {
            mainHand: null,
            offHand: null,
            head: null,
            body: null,
            accessory: null
        };
        
        this.inventory = [];
        
        // Initialize with Squire job - this will set up the cached data before status initialization
        this.setJob(JOBS.SQUIRE);
        
        // Initialize status with base values after job is set
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };
    }

    // Job Management
    setJob(jobId) {
        if (this.currentJob === jobId) return true;

        const JobClass = this.getJobClass(jobId);
        if (!JobClass) return false;

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

        // Cache the job data including abilities
        if (!this._cachedJobData.has(jobId)) {
            this._cachedJobData.set(jobId, {
                abilities: JobClass.getAbilities(),
                baseStats: JobClass.getBaseStats()
            });
        }

        return true;
    }

    getJobClass(jobId) {
        switch (jobId) {
            case JOBS.SQUIRE: return Jobs.Squire;
            case JOBS.CHEMIST: return Jobs.Chemist;
            case JOBS.KNIGHT: return Jobs.Knight;
            case JOBS.ARCHER: return Jobs.Archer;
            case JOBS.WHITE_MAGE: return Jobs.WhiteMage;
            case JOBS.BLACK_MAGE: return Jobs.BlackMage;
            case JOBS.MONK: return Jobs.Monk;
            case JOBS.THIEF: return Jobs.Thief;
            case JOBS.ORACLE: return Jobs.Oracle;
            case JOBS.TIME_MAGE: return Jobs.TimeMage;
            case JOBS.GEOMANCER: return Jobs.Geomancer;
            case JOBS.DRAGOON: return Jobs.Dragoon;
            case JOBS.SUMMONER: return Jobs.Summoner;
            case JOBS.ORATOR: return Jobs.Orator;
            case JOBS.SAMURAI: return Jobs.Samurai;
            case JOBS.NINJA: return Jobs.Ninja;
            case JOBS.CALCULATOR: return Jobs.Calculator;
            case JOBS.DANCER: return Jobs.Dancer;
            case JOBS.BARD: return Jobs.Bard;
            case JOBS.MIME: return Jobs.Mime;
            default: return null;
        }
    }

    canChangeToJob(jobId) {
        try {
            const JobClass = this.getJobClass(jobId);
            if (!JobClass) return false;
            const requirements = JobClass.getRequirements();
            if (!requirements) return true; // Base jobs have no requirements
            
            return Object.entries(requirements).every(([requiredJob, requiredLevel]) =>
                this.jobs[requiredJob] && this.jobs[requiredJob].level >= requiredLevel
            );
        } catch (e) {
            return false;
        }
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

        try {
            const JobClass = this.getJobClass(jobId);
            const abilities = JobClass.getAbilities();
            const ability = abilities[abilityType]?.abilities?.[abilityId] || 
                          abilities[abilityType]?.[abilityId];
            
            if (!ability) return false;

            // Check if already learned
            if (jobData.learnedAbilities[abilityType][abilityId]) return false;

            // Check if we have enough available JP
            const availableJP = jobData.jp + (jobData.spentJp || 0);
            return availableJP >= ability.jpCost;
        } catch (e) {
            return false;
        }
    }

    learnAbility(jobId, abilityType, abilityId) {
        if (!this.canLearnAbility(jobId, abilityType, abilityId)) return false;

        try {
            const jobData = this.jobs[jobId];
            const JobClass = this.getJobClass(jobId);
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
        } catch (e) {
            return false;
        }
    }

    checkJobMastery(jobId) {
        const jobData = this.jobs[jobId];
        if (!jobData || jobData.mastered) return false;

        try {
            const JobClass = this.getJobClass(jobId);
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
        } catch (e) {
            return false;
        }
    }

    // Stat Calculations
    getMaxHP() {
        const baseHP = this.baseStats.hp;
        const jobBonus = this._cachedJobData.get(this.currentJob)?.baseStats?.hp || 0;
        return Math.floor(baseHP + jobBonus);
    }

    getMaxMP() {
        const baseMP = this.baseStats.mp;
        const jobBonus = this._cachedJobData.get(this.currentJob)?.baseStats?.mp || 0;
        return Math.floor(baseMP + jobBonus);
    }

    getStats() {
        const stats = { ...this.baseStats };
        const jobStats = this._cachedJobData.get(this.currentJob)?.baseStats;
        
        if (jobStats) {
            Object.entries(jobStats).forEach(([stat, value]) => {
                stats[stat] += value;
            });
        }

        // Apply equipment bonuses
        Object.values(this.equipment).forEach(item => {
            if (item && item.stats) {
                Object.entries(item.stats).forEach(([stat, value]) => {
                    stats[stat] += value;
                });
            }
        });

        return stats;
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
        // Start with base abilities
        const abilities = {
            active: { ...this.baseAbilities.active },
            reaction: { ...this.baseAbilities.reaction },
            support: { ...this.baseAbilities.support }
        };
        
        // Add job abilities if we have a current job
        if (this.currentJob) {
            const jobData = this.jobs[this.currentJob];
            if (!jobData) return abilities;

            // Get cached job abilities or load them if not cached
            if (!this._cachedJobData.has(this.currentJob)) {
                const JobClass = this.getJobClass(this.currentJob);
                if (JobClass) {
                    this._cachedJobData.set(this.currentJob, {
                        abilities: JobClass.getAbilities(),
                        baseStats: JobClass.getBaseStats()
                    });
                }
            }

            const cachedData = this._cachedJobData.get(this.currentJob);
            if (cachedData?.abilities) {
                // Handle nested ability structure (for monsters) or flat structure (for characters)
                if (cachedData.abilities.active?.abilities) {
                    // Monster-style nested abilities
                    Object.entries(cachedData.abilities.active.abilities).forEach(([id, ability]) => {
                        abilities.active[id] = ability;
                    });
                } else if (cachedData.abilities.active) {
                    // Character-style flat abilities
                    Object.entries(cachedData.abilities.active).forEach(([id, ability]) => {
                        if (jobData.learnedAbilities?.active?.[id]) {
                            abilities.active[id] = ability;
                        }
                    });
                }
                
                // Add reaction abilities
                if (cachedData.abilities.reaction) {
                    Object.entries(cachedData.abilities.reaction).forEach(([id, ability]) => {
                        if (!jobData.learnedAbilities || jobData.learnedAbilities.reaction?.[id]) {
                            abilities.reaction[id] = ability;
                        }
                    });
                }
                
                // Add support abilities
                if (cachedData.abilities.support) {
                    Object.entries(cachedData.abilities.support).forEach(([id, ability]) => {
                        if (!jobData.learnedAbilities || jobData.learnedAbilities.support?.[id]) {
                            abilities.support[id] = ability;
                        }
                    });
                }
            }
        }
        
        return abilities;
    }

    useAbility(abilityId, target) {
        const abilities = this.getAvailableAbilities();
        const ability = abilities.active[abilityId];
        
        if (!ability) {
            return { success: false, message: 'Ability not found' };
        }

        // Handle position restrictions - only physical non-ranged abilities are restricted
        if (this.position === 'back' && ability.type === 'physical' && !ability.ranged) {
            return { success: false, message: 'Cannot use melee attack from back row' };
        }

        // Check MP cost
        if (this.status.mp < (ability.mp || 0)) {
            return { success: false, message: 'Not enough MP' };
        }

        // Apply MP cost
        this.status.mp -= (ability.mp || 0);

        // Calculate and apply effects
        let result;
        switch (ability.type) {
            case 'physical':
                result = this._resolvePhysicalAbility(ability, target);
                break;
            case 'magical':
                result = this._resolveMagicalAbility(ability, target);
                break;
            case 'healing':
                result = this._resolveHealingAbility(ability, target);
                break;
            case 'support':
                result = this._resolveSupportAbility(ability, target);
                break;
            case 'status':
                result = this._resolveStatusAbility(ability, target);
                break;
            case 'drain':
                result = this._resolveDrainAbility(ability, target);
                break;
            default:
                result = { success: false, message: 'Invalid ability type' };
        }

        // Apply back row damage reduction for physical attacks
        if (target.position === 'back' && ability.type === 'physical' && result.damage) {
            result.damage = Math.floor(result.damage * 0.5);
        }

        return result;
    }

    _resolvePhysicalAbility(ability, target) {
        const stats = this.getStats();
        const damage = Math.floor(stats.pa * (ability.power || 1));
        target.status.hp = Math.max(0, target.status.hp - damage);
        return {
            success: true,
            damage,
            effects: []
        };
    }

    _resolveMagicalAbility(ability, target) {
        const stats = this.getStats();
        const damage = Math.floor(stats.ma * (ability.power || 1));
        target.status.hp = Math.max(0, target.status.hp - damage);
        return {
            success: true,
            damage,
            effects: []
        };
    }

    _resolveHealingAbility(ability, target) {
        const stats = this.getStats();
        const healing = Math.floor(stats.ma * (ability.power || 1));
        const maxHp = target.getMaxHP();
        target.status.hp = Math.min(maxHp, target.status.hp + healing);
        return {
            success: true,
            healing,
            effects: []
        };
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
            for (const info of ability.reveals) {
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
            }
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

    setPosition(position) {
        if (position !== 'front' && position !== 'back') {
            return false;
        }
        this.position = position;
        return true;
    }
}

export {
    Character
};
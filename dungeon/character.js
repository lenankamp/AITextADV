import { JOBS } from './jobs/index.js';
import { EQUIPMENT_SLOTS } from './equipment/index.js';
import * as Jobs from './jobs/index.js';
import { TILE_TYPES } from './dungeon.js';

// Base character class
class Character {
    constructor(name) {
        this.name = name;
        this.type = 'person'; // Base class is for people, monsters override this
        this.level = 1;
        this.experience = 0;
        this.jp = 0;
        this.row = 'front';
        this.jobs = {};
        this.party = null;
        this.dungeonContext = null;
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
            support: []
        };
        
        this.currentJob = null;
        this.abilities = {
            ...this.baseAbilities,
            secondaryActive: null, // job ID for secondary active abilities
            secondaryActiveAbilities: {}, // Cached abilities from secondary job
            equippedReaction: null, // { jobId, abilityId } for equipped reaction
            equippedSupport: [] // Array of { jobId, abilityId } for equipped support abilities (max 2)
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
            mainHand: null,
            offHand: null,
            head: null,
            body: null,
            accessory: null
        };
        
        this.inventory = [];
        
        this.status = {
            hp: this.baseStats.hp,
            mp: this.baseStats.mp,
            effects: []
        };

        // Initialize job system before setting initial job
        this.jobs[JOBS.Squire] = { 
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

        // Initialize with Squire job
        this.setJob(JOBS.Squire);
        
        // Update HP/MP to include job bonuses
        this.status.hp = this.getMaxHP();
        this.status.mp = this.getMaxMP();
    }

    // Job Management
    setJob(jobId) {
        // Don't change if it's the same job
        if (this.currentJob === jobId) return true;

        // Get the job class and validate it exists
        const JobClass = this.getJobClass(jobId);
        if (!JobClass) return false;

        // Check if we meet requirements to change to this job
        if (!this.canChangeToJob(jobId)) return false;

        // Initialize job data if we haven't used this job before
        if (!this.jobs[jobId]) {
            this.jobs[jobId] = { 
                level: 1, 
                jp: 0,        // Total JP earned for this job
                spentJp: 0,   // JP spent on learned abilities
                mastered: false,
                learnedAbilities: {
                    active: {},
                    reaction: {},
                    support: {}
                }
            };
        }

        // Store the job ID and update cached data
        this.currentJob = jobId;
        
        // Cache the job data including abilities
        if (!this._cachedJobData.has(jobId)) {
            this._cachedJobData.set(jobId, {
                abilities: JobClass.getAbilities(),
                baseStats: JobClass.getBaseStats()
            });
        }

        return true;
    }

    gainJP(amount) {
        if (!this.currentJob || amount <= 0) return false;
        
        const currentJobData = this.jobs[this.currentJob];
        if (!currentJobData) return false;
        
        // Apply JP Boost if available
        amount = this._calculateJPGain(amount);
        
        currentJobData.jp += amount;
        
        let leveled = false;
        while (true) {
            const jpNeeded = this.getJPNeededForNextLevel(currentJobData.level);
            if (currentJobData.jp >= jpNeeded * currentJobData.level) {
                currentJobData.level++;
                leveled = true;
            } else {
                break;
            }
        }
        
        return leveled;
    }

    getJobClass(jobId) {
        switch (jobId) {
            case JOBS.Squire: return Jobs.Squire;
            case JOBS.Chemist: return Jobs.Chemist;
            case JOBS.Knight: return Jobs.Knight;
            case JOBS.Archer: return Jobs.Archer;
            case JOBS.WhiteMage: return Jobs.WhiteMage;
            case JOBS.BlackMage: return Jobs.BlackMage;
            case JOBS.Monk: return Jobs.Monk;
            case JOBS.Thief: return Jobs.Thief;
            case JOBS.Oracle: return Jobs.Oracle;
            case JOBS.TimeMage: return Jobs.TimeMage;
            case JOBS.Geomancer: return Jobs.Geomancer;
            case JOBS.Dragoon: return Jobs.Dragoon;
            case JOBS.Summoner: return Jobs.Summoner;
            case JOBS.Orator: return Jobs.Orator;
            case JOBS.Samurai: return Jobs.Samurai;
            case JOBS.Ninja: return Jobs.Ninja;
            case JOBS.Calculator: return Jobs.Calculator;
            case JOBS.Dancer: return Jobs.Dancer;
            case JOBS.Bard: return Jobs.Bard;
            case JOBS.Mime: return Jobs.Mime;
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
        const JobClass = this.getJobClass(jobId);
        if (!JobClass || !JobClass.getAbilities().reaction[abilityId]) return false;
        this.abilities.reaction = { jobId, abilityId };
        return true;
    }

    getReactionAbility() {
        const { jobId, abilityId } = this.abilities.reaction;
        const JobClass = this.getJobClass(jobId);
        if (!abilityId || !JobClass) return null;
        return JobClass.getAbilities().reaction[abilityId];
    }

    setSupportAbility(jobId, abilityId) {
        const JobClass = this.getJobClass(jobId);
        if (!JobClass || !JobClass.getAbilities().support[abilityId]) return false;
        if (this.abilities.support.length >= 2) return false;
        
        this.abilities.support.push({ jobId, abilityId });
        return true;
    }

    getSupportAbilities() {
        return this.abilities.support.map(({ jobId, abilityId }) => {
            const JobClass = this.getJobClass(jobId);
            return JobClass.getAbilities().support[abilityId];
        });
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
            return (jobData.jp - jobData.spentJp) >= ability.jpCost;
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

            // Deduct JP cost from available JP
            const jpCost = ability.jpCost;
            jobData.spentJp += jpCost;

            // Mark ability as learned
            jobData.learnedAbilities[abilityType][abilityId] = true;

            // Check for job mastery
            this.checkJobMastery(jobId);

            return true;
        } catch (e) {
            console.error('Error in learnAbility:', e);
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

    // Equipment Methods
    canEquipToSlot(item, slot) {
        // Check if item can be equipped by this character
        if (!item.canBeEquippedBy(this)) {
            return false;
        }

        // Handle shield equipping
        if (item.type === 'shield') {
            const hasShieldAbility = this.getSupportAbilities()
                .some(ability => ability.effect === 'enable_shield');
            if (!hasShieldAbility) {
                return false;
            }
        }

        // Handle dual wielding
        if (slot === EQUIPMENT_SLOTS.OFF_HAND && item.type === 'weapon') {
            const hasDualWield = this.getSupportAbilities()
                .some(ability => ability.effect === 'enable_dual_wielding');
            const hasDoubleHand = this.getSupportAbilities()
                .some(ability => ability.effect === 'enable_two_hand');
            if (!hasDualWield && !hasDoubleHand) {
                return false;
            }
        }

        return item.isValidForSlot(slot, this);
    }

    equipItem(item, slot) {
        // Check if item can be equipped to this slot
        if (!this.canEquipToSlot(item, slot)) {
            return { success: false, message: 'Cannot equip this item to that slot' };
        }

        // Handle two-handed weapons
        if (item.isTwoHanded && slot === EQUIPMENT_SLOTS.MAIN_HAND) {
            // Can't equip two-handed weapon if dual wielding
            if (this.equipment[EQUIPMENT_SLOTS.OFF_HAND]?.type === 'weapon') {
                return { success: false, message: 'Cannot equip two-handed weapon while dual wielding' };
            }
            this.equipment[EQUIPMENT_SLOTS.OFF_HAND] = null;
        }

        // Store the current item for potential return to inventory
        const previousItem = this.equipment[slot];

        // Equip the new item
        this.equipment[slot] = item;

        return { 
            success: true, 
            message: 'Item equipped successfully', 
            previousItem 
        };
    }

    calculateWeaponDamage() {
        const stats = this.getStats();
        const mainWeapon = this.equipment[EQUIPMENT_SLOTS.MAIN_HAND];
        const offWeapon = this.equipment[EQUIPMENT_SLOTS.OFF_HAND];
        const hasDualWield = this.getSupportAbilities()
            .some(ability => ability.effect === 'enable_dual_wielding');
        
        if (!mainWeapon) {
            return stats.pa; // Base physical attack if no weapon
        }

        let damage = mainWeapon.calculateDamage(stats);

        // Add off-hand weapon damage if dual wielding
        if (hasDualWield && offWeapon?.type === 'weapon') {
            const offHandDamage = offWeapon.calculateDamage(stats);
            // Off-hand attacks deal 50% damage
            damage += Math.floor(offHandDamage * 0.5);
        }

        // Apply weapon effects that modify damage
        [mainWeapon, offWeapon].forEach(weapon => {
            if (!weapon?.effects) return;
            weapon.effects.forEach(effect => {
                if (effect === 'critical_up') {
                    damage *= 1.5;
                }
            });
        });

        return Math.floor(damage);
    }

    isRanged() {
        return this.equipment.mainHand?.isRanged || false;
    }

    // Update stat calculation to include equipment
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
            if (item) {
                const modifiers = item.getStatModifiers();
                Object.entries(modifiers).forEach(([stat, value]) => {
                    stats[stat] = (stats[stat] || 0) + value;
                });
            }
        });

        return stats;
    }

    getMaxHP() {
        const baseHP = this.baseStats.hp;
        const jobStats = this._cachedJobData.get(this.currentJob)?.baseStats || {};
        const jobHP = jobStats.hp || 0;
        
        // Get HP bonuses from equipment
        const equipmentHP = Object.values(this.equipment)
            .filter(item => item)
            .reduce((total, item) => {
                const stats = item.getStatModifiers();
                return total + (stats.hp || 0);
            }, 0);

        // Calculate growth from level
        const jobGrowth = this.getJobClass(this.currentJob)?.getGrowthRates()?.hp || 0;
        const levelGrowth = Math.floor(jobGrowth * (this.level - 1));

        return baseHP + jobHP + equipmentHP + levelGrowth;
    }

    getMaxMP() {
        const baseMP = this.baseStats.mp;
        const jobStats = this._cachedJobData.get(this.currentJob)?.baseStats || {};
        const jobMP = jobStats.mp || 0;
        
        // Get MP bonuses from equipment
        const equipmentMP = Object.values(this.equipment)
            .filter(item => item)
            .reduce((total, item) => {
                const stats = item.getStatModifiers();
                return total + (stats.mp || 0);
            }, 0);

        // Calculate growth from level
        const jobGrowth = this.getJobClass(this.currentJob)?.getGrowthRates()?.mp || 0;
        const levelGrowth = Math.floor(jobGrowth * (this.level - 1));

        return baseMP + jobMP + equipmentMP + levelGrowth;
    }

    _effectAttackRelevant(effect, ability, target) {
        // Check if the effect is relevant to the current attack
        switch (effect) {
            case 'attack_up':
                if(ability.type !== 'magical') return true;
                else return false;
            case 'increase_magic_power':
            case 'magic_up':
                if(ability.type === 'magical') return true;
                else return false;
            case 'increase_dance_potency':
                const dancerAbilities = this.jobs[JOBS.Dancer]?.learnedAbilities?.active;
                if (dancerAbilities && dancerAbilities[ability]) return true;
                else return false;
            case 'jump_damage_up':
                const dragoonAbilities = this.jobs[JOBS.Dragoon]?.learnedAbilities?.active;
                if (dragoonAbilities && dragoonAbilities[ability]) return true;
                else return false;
            case 'improve_martial_arts':
                const monkAbilities = this.jobs[JOBS.Monk]?.learnedAbilities?.active;
                if (monkAbilities && monkAbilities[ability]) return true;
                else return false;
            case 'enhance_next_summon':
            case 'enhance_summons':
                const summonerAbilities = this.jobs[JOBS.Summoner]?.learnedAbilities?.active;
                if (summonerAbilities && summonerAbilities[ability]) return true;
                else return false;
            case 'unarmed_damage_up':
                if (this.equipment.mainHand === null) return true;
                else return false;
            case 'katana_damage_up':
                if (this.equipment.mainHand?.type === 'katana') return true;
            case 'armor_pierce':
                    return true;
            default:
                return false;
        }
    }

    _effectDefenseRelevant(effect, ability, target) {
        // Check if the effect is relevant to the current attack
        switch (effect) {
            case 'damage_reduction':
            case 'predict_damage':
            case 'defense_up':
            case 'defense_down':
                return true;
            case 'protect':
                if (ability.type !== 'magical') return true;
                else return false;
            case 'shell':
                if (ability.type === 'magical') return true;
                else return false;
            case 'ranged_defense_up':
                if (ability.type !== 'magical' && (ability.ranged || this.isRanged())) return true;
                else return false;
            default:
                return false;
        }
    }

    _getDamageMultiplier(ability, target) {
        
        // Calculate attack bonuses
        const attackBonusEffects = [];
        const defenseBonusEffects = [];
        
        // Check equipment effects
        Object.values(this.equipment).forEach(item => {
            if (!item) return;
            if (item.effects) {
                const relevantEffects = [
                    'attack_up', 'armor_pierce', 'armor_pierce',
                    'increase_magic_power', 'magic_up', 'increase_dance_potency',
                    'jump_damage_up', 'unarmed_damage_up', 'improve_martial_arts',
                    'katana_damage_up', 'enhance_next_summon', 'enhance_summons'
                ];
                relevantEffects.forEach(effect => {
                    if (item.effects.includes(effect) && _effectAttackRelevant(effect, ability, target)) attackBonusEffects.push(effect);
                });
            }
        });

        // Check status effects
        this.status.effects.forEach(effect => {
            if ((effect.name === 'attack_up' && ability.type !== 'magical') || (effect.name === 'magic_up') && ability.type === 'magical') {
                attackBonusEffects.push(effect.name);
            }
            // Special case for attack down which reduces damage
            if (effect.name === 'attack_down' && ability.type !== 'magical') {
                defenseBonusEffects.push('attack_down');
            }
        });

        // Check support abilities
        this.abilities.support.forEach(support => {
            const relevantEffects = [
                'attack_up', 'armor_pierce',
                'increase_magic_power', 'magic_up', 'increase_dance_potency',
                'jump_damage_up', 'unarmed_damage_up', 'improve_martial_arts',
                'katana_damage_up', 'enhance_next_summon', 'enhance_summons'
        ];
            if (relevantEffects.includes(support.effect) && _effectAttackRelevant(support.effect, ability, target)) {
                attackBonusEffects.push(support.effect);
            }
        });

        
        // Check target equipment effects
        Object.values(target.equipment).forEach(item => {
            if (!item) return;
            if (item.effects) {
                const relevantEffects = ['protect', 'shell', 'defense_up', 'defense_down', 'damage_reduction', 'predict_damage', 'ranged_defense_up'];
                relevantEffects.forEach(effect => {
                    if (item.effects.includes(effect) && _effectDefenseRelevant(effect, ability, target)) {
                        if (effect === 'defense_down') attackBonusEffects.push('defense_down');
                        else defenseBonusEffects.push(effect);
                    }
                });
            }
        });

        // Check target status effects
        target.status.effects.forEach(effect => {
            const relevantEffects = ['protect', 'shell', 'defense_up', 'defense_down', 'damage_reduction', 'predict_damage', 'ranged_defense_up'];
            if (relevantEffects.includes(effect.name)) {
                if (effect.name === 'defense_down') {
                    attackBonusEffects.push('defense_down');
                } else {
                    defenseBonusEffects.push(effect.name);
                }
            }
        });

        // check target reaction ability
        if (target.abilities.reaction) {
            const reaction = target.getReactionAbility();
            if (reaction) {
                if(Math.random() < reaction.chance) {
                    if (reaction.effect === 'protect' && ability.type !== 'magical') defenseBonusEffects.push('protect');
                    if (reaction.effect === 'shell' && ability.type === 'magical') defenseBonusEffects.push('shell');
                    if (reaction.effect === 'reduce_damage') defenseBonusEffects.push('ranged_defense_up');
                    if (reaction.effect === 'summon_barrier') defenseBonusEffects.push('summon_barrier');
                }
            }
        }

        // Calculate net attack bonus with diminishing returns
        let attackBonus = 0;
        let defenseBonus = 0;
        const positiveAttackEffects = attackBonusEffects.filter(effect => effect !== 'armor_pierce');
        attackBonus = positiveAttackEffects.length;
        defenseBonus = defenseBonusEffects.length;
        if (attackBonusEffects.includes('armor_pierce')) {
            const armorPierceCount = attackBonusEffects.filter(effect => effect === 'armor_pierce').length;
            defenseBonus -= armorPierceCount*2;
            if (defenseBonus < 0) defenseBonus = 0;
        }
        const netBonus = attackBonus - defenseBonus;
        if (netBonus !== 0) {
            let multiplier = 0;
            for(let i = 0; i < Math.abs(netBonus); i++) {
                multiplier += .5*(1-multiplier);
            }
            if (netBonus < 0) multiplier = 1 - multiplier;
            return multiplier;
        } else return 1;
    }

    // Combat Methods
    _calculateDamage(ability, target) {
        const stats = this.getStats();
        const targetStats = target.getStats();
        
        // Use weapon damage formula if it's a basic attack
        let damage;
        if (!ability || ability.name === 'Attack') {
            damage = this.calculateWeaponDamage();
        } else {
            if (ability.type === 'magical')
                damage = stats.ma * (ability.power || 1);
            else damage = stats.pa * (ability.power || 1);
        }
        
        // Apply variance (±10%)
        const variance = 0.1;
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        damage *= randomFactor;
        damage *= this._getDamageMultiplier(ability, target);
        damage *= target.getElementalMultiplier(ability.element || 'none');

        // Apply back row damage reduction for physical attacks
        if (target.row === 'back' && ability.type === 'physical' && !ability.ranged && !this.isRanged()) {
            damage *= 0.5;
        }
        return Math.floor(damage);
    }

    _calculateHealing(ability) {
        const stats = this.getStats();
        
        // Base healing calculation using magical attack and ability power
        let healing = stats.ma * (ability.power || 1);
        
        // Check for Healing Boost support ability
        const hasHealingBoost = this.getSupportAbilities()
            .some(ability => ability.effect === 'increase_heal_power');
        if (hasHealingBoost) {
            healing *= 1.5; // 50% healing increase
        }

        // Check for Medicine Lore (Chemist) when healing
        const hasMedicineLore = this.getSupportAbilities()
            .some(ability => ability.effect === 'improve_healing');
        if (hasMedicineLore) {
            healing *= 1.4; // 40% healing increase
        }

        // Check for Item Boost when using items
        if (ability.isItem) {
            const hasItemBoost = this.getSupportAbilities()
                .some(ability => ability.effect === 'improve_item_effect');
            if (hasItemBoost) {
                healing *= 1.3; // 30% boost to item healing
            }
        }
        
        // Apply variance (±5% for healing)
        const variance = 0.05;
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        healing *= randomFactor;
        
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
            reaction: {},  // Only equipped reaction
            support: []    // Only equipped support abilities
        };
        
        // Add primary job abilities
        if (this.currentJob) {
            const jobData = this.jobs[this.currentJob];
            if (jobData) {
                // Get cached job abilities or load them
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
                    // Add active abilities from current job that have been learned
                    if (cachedData.abilities.active) {
                        const activeAbilities = cachedData.abilities.active.abilities || cachedData.abilities.active;
                        Object.entries(activeAbilities).forEach(([id, ability]) => {
                            if (jobData.learnedAbilities.active[id]) {
                                abilities.active[id] = ability;
                            }
                        });
                    }
                }
            }
        }
        
        // Add secondary job's active abilities if set
        if (this.abilities.secondaryActive) {
            const secondaryJobData = this.jobs[this.abilities.secondaryActive];
            if (secondaryJobData) {
                // Get cached job abilities or load them
                if (!this._cachedJobData.has(this.abilities.secondaryActive)) {
                    const JobClass = this.getJobClass(this.abilities.secondaryActive);
                    if (JobClass) {
                        this._cachedJobData.set(this.abilities.secondaryActive, {
                            abilities: JobClass.getAbilities(),
                            baseStats: JobClass.getBaseStats()
                        });
                    }
                }

                const cachedData = this._cachedJobData.get(this.abilities.secondaryActive);
                if (cachedData?.abilities?.active) {
                    const activeAbilities = cachedData.abilities.active.abilities || cachedData.abilities.active;
                    Object.entries(activeAbilities).forEach(([id, ability]) => {
                        if (secondaryJobData.learnedAbilities.active[id]) {
                            abilities.active[id] = ability;
                        }
                    });
                }
            }
        }

        // Add equipped reaction ability if set
        if (this.abilities.equippedReaction) {
            const { jobId, abilityId } = this.abilities.equippedReaction;
            const cachedData = this._cachedJobData.get(jobId);
            if (cachedData?.abilities?.reaction?.[abilityId]) {
                abilities.reaction[abilityId] = cachedData.abilities.reaction[abilityId];
            }
        }

        // Add equipped support abilities (max 2)
        if (this.abilities.equippedSupport) {
            this.abilities.equippedSupport.forEach(({ jobId, abilityId }) => {
                const cachedData = this._cachedJobData.get(jobId);
                if (cachedData?.abilities?.support?.[abilityId]) {
                    abilities.support.push(cachedData.abilities.support[abilityId]);
                }
            });
        }
        
        return abilities;
    }

    useAbility(abilityId, target) {
        const ability = this.getAvailableAbilities().active[abilityId];
        if (!ability) {
            return { success: false, message: 'Ability not found' };
        }

        // Handle Quick Calculate
        const hasQuickCalculate = this.getSupportAbilities()
            .some(ability => ability.effect === 'reduce_cast_time');
        if (hasQuickCalculate && ability.castTime) {
            ability = { ...ability, castTime: Math.floor(ability.castTime * 0.5) };
        }

        // Handle row restrictions
        if (this.row === 'back' && ability.type === 'physical' && !ability.ranged && !this.isRanged()) {
            return { success: false, message: 'Cannot use melee attack from back row' };
        }

        // Check MP cost and any MP cost reduction effects
        let mpCost = ability.mp || 0;
        const hasSilverTongue = this.getSupportAbilities()
            .some(ability => ability.effect === 'reduce_mp_cost');
        if (hasSilverTongue) {
            mpCost = Math.floor(mpCost * 0.7); // 30% MP cost reduction
        }

        if (this.status.mp < mpCost) {
            return { success: false, message: 'Not enough MP' };
        }

        // Special handling for dungeon abilities
        if (ability.type === 'dungeon') {
            this.status.mp -= mpCost;
            return this._resolveDungeonAbility(ability, target);
        }

        // For AOE abilities, we need all targets in the same party as the target
        const targets = ability.aoe ? (target.party || [target]) : [target];

        // Check for Dual Cast support ability
        const hasDualCast = this.getSupportAbilities()
            .some(ability => ability.effect === 'cast_twice');
        const isSpell = ability.type === 'magical' || ability.type === 'status';

        // Apply MP cost and resolve first cast
        this.status.mp -= mpCost;
        const firstCastResults = targets.map(currentTarget => {
            let result;
            switch (ability.type) {
                case 'physical':
                case 'magical':
                    result = this._resolveAttackAbility(ability, currentTarget);
                    break;
                case 'healing':
                    result = this._resolveHealingAbility(ability, currentTarget);
                    break;
                case 'buff':
                    result = this._resolveSupportAbility(ability, currentTarget);
                    break;
                case 'status':
                    result = this._resolveStatusAbility(ability, currentTarget);
                    break;
                case 'drain':
                    result = this._resolveDrainAbility(ability, currentTarget);
                    break;
                case 'special':
                    const jobId = ability.jobId || this.currentJob;
                    const JobClass = this.getJobClass(jobId);
                    if (!JobClass) {
                        result = { success: false, message: 'Invalid job for special ability' };
                    } else {
                        // Pass the ability ID for proper routing in resolveSpecialAbility
                        result = JobClass.resolveSpecialAbility(this, { ...ability, id: abilityId }, currentTarget);
                        if (result.success && result.effects) {
                            result.effects.forEach(effect => {
                                if (typeof effect === 'string') {
                                    currentTarget.addEffect({
                                        name: effect,
                                        duration: ability.duration || 3,
                                        source: this.name
                                    });
                                } else {
                                    currentTarget.addEffect({
                                        name: effect.type,
                                        duration: effect.duration,
                                        power: effect.power,
                                        source: this.name
                                    });
                                }
                            });
                        }
                    }
                    break;
                default:
                    result = { success: false, message: 'Invalid ability type' };
            }
            return { ...result, target: currentTarget };
        });

        // Handle Dual Cast for spells
        if (hasDualCast && isSpell && this.status.mp >= mpCost) {
            this.status.mp -= mpCost;
            const secondCastResults = targets.map(currentTarget => {
                let result;
                switch (ability.type) {
                    case 'magical':
                        result = this._resolveAttackAbility(ability, currentTarget);
                        break;
                    case 'status':
                        result = this._resolveStatusAbility(ability, currentTarget);
                        break;
                    default:
                        result = { success: false, message: 'Invalid dual cast type' };
                }
                return { ...result, target: currentTarget };
            });

            if (ability.aoe) {
                return {
                    success: true,
                    isAoe: true,
                    targets: [...firstCastResults, ...secondCastResults]
                };
            }
            return [firstCastResults[0], secondCastResults[0]];
        }

        if (ability.aoe) {
            return {
                success: true,
                isAoe: true,
                targets: firstCastResults
            };
        }
        return firstCastResults[0];
    }

    _resolveAttackAbility(ability, target) {
        const reaction = target.getReactionAbility();
        const result = { success: true, effects: [] };
        
        // Pre-hit reaction checks
        if (this._handleReaction(reaction, ability, target, result)) {
            return result;
        }

        // Replace the old evasion check with new accuracy system
        const hitChance = this._calculateAccuracy(ability, target);
        if (Math.random() >= hitChance) {
            return { success: false, message: 'Attack missed', effects: [] };
        }

        // Calculate critical hit
        const critChance = this._calculateCriticalChance(ability, target);
        const isCritical = Math.random() < critChance;

        // Calculate and apply damage
        let damage = this._calculateDamage(ability, target);
        
        // Apply critical hit multiplier
        if (isCritical) {
            damage = Math.floor(damage * 1.5);
            result.isCritical = true;
        }

        // Apply any damage reduction from reactions
        if (result.damageReduction) {
            damage = Math.floor(damage * (1 - result.damageReduction));
        }
        
        target.status.hp = Math.max(0, target.status.hp - damage);
        result.damage = damage;

        // Post-hit reaction checks
        if (reaction && Math.random() < reaction.chance) {
            switch (reaction.effect) {
                // Counter attacks
                case 'counter_attack':
                case 'counter_with_power':
                    result.counter = {
                        type: 'damage',
                        power: reaction.power || (reaction.effect === 'counter_with_power' ? 1.5 : 1),
                        target: this
                    };
                    break;
                case 'counter_with_dance':
                case 'counter_with_song':
                    result.counter = {
                        type: reaction.effect,
                        target: this
                    };
                    break;
                case 'counter_with_status':
                    result.counter = {
                        type: 'status',
                        effect: 'blind',  // Example status effect
                        target: this
                    };
                    break;
                case 'counter_steal':
                    result.counter = {
                        type: 'steal',
                        target: this
                    };
                    break;

                // MP related reactions
                case 'mp_drain':
                    const mpDrain = Math.floor(damage * 0.2);
                    this.status.mp = Math.max(0, this.status.mp - mpDrain);
                    target.status.mp = Math.min(target.getMaxMP(), target.status.mp + mpDrain);
                    result.effects.push({ type: 'mp_drain', value: mpDrain });
                    break;

                // Recovery reactions
                case 'use_potion_when_hurt':
                    const healAmount = Math.min(50, target.getMaxHP() - target.status.hp);
                    if (healAmount > 0) {
                        target.status.hp += healAmount;
                        result.effects.push({ type: 'heal', value: healAmount });
                    }
                    break;
                case 'hp_restore':
                    const restoration = Math.floor(damage * 0.3);
                    target.status.hp = Math.min(target.getMaxHP(), target.status.hp + restoration);
                    result.effects.push({ type: 'heal', value: restoration });
                    break;
                case 'terrain_heal':
                    const terrainHeal = Math.floor(damage * 0.2);
                    target.status.hp = Math.min(target.getMaxHP(), target.status.hp + terrainHeal);
                    result.effects.push({ type: 'heal', value: terrainHeal });
                    break;
                case 'recover_fall':
                    if (target.status.effects.some(e => e.name === 'falling')) {
                        result.effects.push({ type: 'remove_status', status: 'falling' });
                    }
                    break;

                // Status effect reactions
                case 'regen':
                    result.effects.push({ type: 'regen', duration: 3 });
                    break;
                case 'adapt_to_damage_type':
                    result.effects.push({ type: `resist_${ability.type}`, duration: 3 });
                    break;
                case 'prevent_status':
                    result.effects.push({ type: 'status_immune', duration: 2 });
                    break;
                case 'reflect_status':
                    if (ability.type === 'status') {
                        result.counter = {
                            type: 'status',
                            effect: ability.effect,
                            target: this
                        };
                    }
                    break;
                case 'enhance_healing':
                    result.effects.push({ type: 'healing_up', duration: 3 });
                    break;
                case 'survive_fatal':
                    if (target.status.hp <= 0) {
                        target.status.hp = 1;
                        result.effects.push({ type: 'survive_fatal' });
                    }
                    break;
                case 'enhance_next_summon':
                    result.effects.push({ type: 'summon_power_up', duration: 1 });
                    break;
            }
        }

        this._handleCounter(result, result.counter);

        return result;
    }

    _resolveHealingAbility(ability, target) {
        const reaction = target.getReactionAbility();
        const result = { success: true, effects: [] };
        
        // Handle pre-healing reactions
        if (reaction && Math.random() < reaction.chance) {
            switch (reaction.effect) {
                case 'enhance_healing':
                    result.healingBoost = 1.5;
                    break;
                case 'quick_pocket':
                    // Chemist's ability to use items without consuming them
                    if (ability.isItem) {
                        result.preserveItem = true;
                    }
                    break;
                case 'survive_fatal':
                    // Oracle's ability to survive fatal damage also enhances healing
                    result.healingBoost = (result.healingBoost || 1) * 1.2;
                    break;
            }
        }

        // Calculate and apply healing
        let healing = this._calculateHealing(ability);
        
        // Apply healing boost if applicable
        if (result.healingBoost) {
            healing = Math.floor(healing * result.healingBoost);
        }
        
        const maxHp = target.getMaxHP();
        target.status.hp = Math.min(maxHp, target.status.hp + healing);
        result.healing = healing;

        // Handle post-healing reactions
        if (reaction && Math.random() < reaction.chance) {
            switch (reaction.effect) {
                case 'regen':
                    result.effects.push({ type: 'regen', duration: 3 });
                    break;
                case 'enhance_next_summon':
                    result.effects.push({ type: 'summon_power_up', duration: 1 });
                    break;
                case 'adapt_to_damage_type':
                    // When healed, gain temporary resistance to the last damage type received
                    if (target.lastDamageType) {
                        result.effects.push({ type: `resist_${target.lastDamageType}`, duration: 3 });
                    }
                    break;
            }
        }

        return result;
    }

    _resolveSupportAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        if (ability.effect) {
            const effects = Array.isArray(ability.effect) ? ability.effect : [ability.effect];
            effects.forEach(effect => {
                target.addEffect({
                    name: effect,
                    duration: ability.duration || 3,
                    power: ability.power || 1,
                    source: this.name
                });
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
        const reaction = target.getReactionAbility();
        const result = { success: true, effects: [] };

        // Check for specific immunities first
        if (target.isImmuneToEffect(ability.effect)) {
            result.success = false;
            result.message = 'Target is immune to effect';
            return result;
        }

        // Handle pre-effect reactions
        if (reaction && Math.random() < reaction.chance) {
            switch (reaction.effect) {
                case 'prevent_status':
                    result.success = false;
                    result.message = 'Status effect prevented';
                    result.effects.push({ type: 'status_immune', duration: 2 });
                    return result;
                
                case 'reflect_status':
                    result.counter = {
                        type: 'status',
                        effect: ability.effect,
                        target: this,
                        duration: ability.duration
                    };
                    return result;
            }
        }

        // Apply the status effect if not prevented
        if (ability.effect) {
            const effects = Array.isArray(ability.effect) ? ability.effect : [ability.effect];
            effects.forEach(effect => {
                const chance = ability.chance || 0.5;
                if (Math.random() < chance) {
                    const effectData = {
                        type: effect,
                        duration: ability.duration || 3,
                        power: ability.power || 1
                    };
                    result.effects.push(effectData);
                    
                    target.addEffect({
                        name: effect,
                        duration: effectData.duration,
                        power: effectData.power,
                        source: this.name
                    });
                }
            });
        }

        // Handle counter reactions after status is applied
        if (reaction && Math.random() < reaction.chance) {
            switch (reaction.effect) {
                case 'counter_argue':
                    // Orator's special counter
                    result.counter = {
                        type: 'status',
                        effect: ['silence', 'confusion'][Math.floor(Math.random() * 2)],
                        target: this,
                        duration: 2
                    };
                    break;
            }
        }

        // Resolve any counters
        if (result.counter) {
            this._handleCounter(result, result.counter);
        }

        return result;
    }

    _resolveDrainAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        result.damage = this._calculateDamage(ability, target);

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

    _resolveDungeonAbility(ability, target) {
        if (!this.dungeonContext) {
            return { success: false, message: 'No dungeon context available' };
        }

        const floor = this.dungeonContext.getCurrentFloor();
        if (!floor) {
            return { success: false, message: 'Invalid floor' };
        }

        const pos = this.party?.position;
        if (!pos) {
            return { success: false, message: 'Invalid position' };
        }

        switch (ability.effect) {
            case 'reveal_terrain': {
                // For Oracle's Divine Sight, Geomancer's Terrain Sight
                const revealRadius = ability.radius || 3;
                const revealed = floor.revealArea(pos.x, pos.y, revealRadius);
                return { 
                    success: true, 
                    message: 'Area revealed',
                    revealedTiles: revealed
                };
            }

            case 'stealth_movement':
            case 'bypass_enemies': {
                const enabled = this.dungeonContext.setStealthMode(true, ability.duration || 3);
                return { 
                    success: enabled, 
                    effects: ['stealth_active'],
                    duration: ability.duration || 3
                };
            }

            case 'traverse_walls': {
                const enabled = this.dungeonContext.enableWallTraversal(true, ability.duration || 2);
                return { 
                    success: enabled, 
                    effects: ['wall_walk_active'],
                    duration: ability.duration || 2
                };
            }

            case 'unlock': {
                const tile = floor.getTile(pos.x, pos.y);
                if (tile !== TILE_TYPES.DOOR && tile !== TILE_TYPES.SECRET_DOOR) {
                    return { success: false, message: 'No door to unlock' };
                }
                const unlocked = floor.unlockDoor(pos.x, pos.y);
                return {
                    success: unlocked,
                    message: unlocked ? 'Door unlocked' : 'Failed to unlock door'
                };
            }

            case 'detect_traps': {
                const range = ability.range || 2;
                const traps = floor.getTrapsInRange(pos.x, pos.y, range);
                const autoDisarm = ability.autoDisarm || false;

                traps.forEach(trap => {
                    if (autoDisarm) {
                        floor.disarmTrap(trap.x, trap.y);
                    } else {
                        floor.revealTrap(trap.x, trap.y);
                    }
                });

                return {
                    success: true,
                    trapsFound: traps.length,
                    trapsDisarmed: autoDisarm ? traps.length : 0,
                    message: `${traps.length} traps ${autoDisarm ? 'disarmed' : 'detected'}`
                };
            }

            case 'predict_encounters': {
                const range = ability.range || 5;
                const encounters = this.dungeonContext.getUpcomingEncounters?.(pos.x, pos.y, range) || [];
                return {
                    success: true,
                    encounters,
                    message: `Predicted ${encounters.length} potential encounters`
                };
            }

            case 'create_checkpoint': {
                const created = this.dungeonContext.createCheckpoint();
                return {
                    success: created,
                    effects: ['checkpoint_created'],
                    message: created ? 'Checkpoint created' : 'Failed to create checkpoint'
                };
            }

            case 'reset_room': {
                const room = this.dungeonContext.getCurrentRoom();
                if (!room) {
                    return { success: false, message: 'Not in a valid room' };
                }
                room.reset();
                return {
                    success: true,
                    message: 'Room reset to original state'
                };
            }

            case 'modify_terrain': {
                const currentTerrain = floor.getTerrain(pos.x, pos.y);
                if (!this._isValidTerrainModification(currentTerrain, ability.targetTerrain)) {
                    return { success: false, message: 'Invalid terrain modification' };
                }
                floor.setTerrain(pos.x, pos.y, ability.targetTerrain);
                return {
                    success: true,
                    previousTerrain: currentTerrain,
                    newTerrain: ability.targetTerrain
                };
            }

            default:
                return { success: false, message: 'Unknown dungeon ability effect' };
        }
    }

    _resolveAnalyzeAbility(ability, target) {
        const result = { success: true, effects: [] };
        
        result.analysis = {
            stats: target.getStats()
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

    _handleCounter(result, counter) {
        if (!counter) return;

        switch (counter.type) {
            case 'damage':
                const damageResult = this._resolveAttackAbility({
                    type: 'physical',
                    power: counter.power || 1
                }, counter.target);
                result.counterResult = damageResult;
                break;
            case 'status':
                const statusResult = this._resolveStatusAbility({
                    type: 'status',
                    effect: counter.effect,
                    chance: 1
                }, counter.target);
                result.counterResult = statusResult;
                break;
            case 'counter_with_song':
                const songResult = this._resolveSupportAbility({
                    type: 'buff',
                    effect: ['attack_up', 'defense_up', 'speed_up'][Math.floor(Math.random() * 3)],
                    duration: 3
                }, counter.target);
                result.counterResult = songResult;
                break;
            case 'counter_with_dance':
                const danceResult = this._resolveStatusAbility({
                    type: 'status',
                    effect: ['slow', 'blind', 'silence'][Math.floor(Math.random() * 3)],
                    chance: 1,
                    duration: 3
                }, counter.target);
                result.counterResult = danceResult;
                break;
            case 'steal':
                // TODO: Implement stealing mechanics
                result.counterResult = { type: 'steal', success: true };
                break;
        }
    }

    _handleReaction(reaction, ability, target, result) {
        if (!reaction || Math.random() >= reaction.chance) return false;

        switch (reaction.effect) {
            // Counter shot specific handling
            case 'counter_shot':
                result.counter = {
                    type: 'damage',
                    power: reaction.power || 0.8,
                    ranged: true,
                    target: this
                };
                break;

            // Quick Pocket ability
            case 'free_item_use':
                if (ability.isItem) {
                    result.preserveItem = true;
                    return false; // Don't block the ability
                }
                break;

            // Defense Boost ability
            case 'increase_defense':
                result.effects.push({ 
                    type: 'defense_up', 
                    duration: 3,
                    power: 1.5
                });
                return false; // Don't block the ability

            // Time magic specific
            case 'resist_time_magic':
                if (ability.element === 'time') {
                    result.success = false;
                    result.message = 'Time magic resisted';
                    return true;
                }
                break;

            // Status effect handling
            case 'reflect_status':
                if (ability.type === 'status') {
                    result.counter = {
                        type: 'status',
                        effect: ability.effect,
                        target: this
                    };
                    return true;
                }
                break;
            case 'prevent_status':
                if (ability.type === 'status') {
                    result.effects.push({ type: 'status_immune', duration: 2 });
                    return true;
                }
                break;

            // Magical effect handling
            case 'reflect':
                if (ability.type === 'magical') {
                    result.counter = {
                        type: ability.type,
                        effect: ability.effect,
                        target: this
                    };
                    return true;
                }
                break;
            case 'enhance_healing':
                if (ability.type === 'healing') {
                    result.healingBoost = 1.5;
                    return false; // Don't block the ability
                }
                break;

            // Physical attack avoidance
            case 'evade_melee':
                if (ability.type === 'physical' && !ability.ranged) {
                    result.success = false;
                    result.message = 'Attack evaded through dance';
                    return true;
                }
                break;
            case 'anticipate_attack':
                if (ability.type === 'physical') {
                    result.success = false;
                    result.message = 'Attack anticipated and avoided';
                    return true;
                }
                break;
            case 'detect_ambush':
                if (!this.status.effects.some(e => e.name === 'revealed')) {
                    result.success = false;
                    result.message = 'Surprise attack detected';
                    return true;
                }
                break;
            case 'avoid_damage':
                result.success = false;
                result.message = 'Damage avoided through negotiation';
                return true;

            // Terrain and position-based effects
            case 'nullify_air_damage':
                if (this.status.effects.some(e => e.name === 'jump')) {
                    result.success = false;
                    result.message = 'Attack nullified mid-air';
                    return true;
                }
                break;
            case 'terrain_defense':
                // TODO: Implement terrain type check
                result.damageReduction = 0.3;
                return false;
                
            // Special defensive effects
            case 'number_defense':
                // Calculator's special defense based on numbers
                if ((this.status.hp % 5) === 0) {
                    result.damageReduction = 0.5;
                    return false;
                }
                break;
            case 'temporary_invisibility':
                result.success = false;
                result.message = 'Target vanished';
                result.effects.push({ type: 'invisible', duration: 1 });
                return true;
        }
        return false;
    }

    _resolvePostActionReactions(result, target, ability) {
        const reaction = target.getReactionAbility();
        if (!reaction || Math.random() >= reaction.chance) return;

        switch (reaction.effect) {
            // Response to damage
            case 'counter_shot':
                if (ability.type === 'physical') {
                    result.counter = {
                        type: 'damage',
                        power: 0.8,
                        ranged: true,
                        target: this
                    };
                }
                break;

            // Item preservation
            case 'free_item_use':
                if (ability.isItem) {
                    result.preserveItem = true;
                }
                break;

            // Post-damage status effects
            case 'adapt_to_damage_type':
                if (ability.type) {
                    result.effects.push({
                        type: `resist_${ability.type}`,
                        duration: 3
                    });
                }
                break;

            // Stat modifications
            case 'increase_defense':
                result.effects.push({
                    type: 'defense_up',
                    duration: 3,
                    power: 1.5
                });
                break;

            // Recovery effects
            case 'hp_restore':
                const healAmount = Math.floor(result.damage * 0.3);
                target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healAmount);
                result.effects.push({ type: 'heal', value: healAmount });
                break;

            // Special counters
            case 'counter_argue':
                if (ability.type === 'status') {
                    result.counter = {
                        type: 'status',
                        effect: ['silence', 'confusion'][Math.floor(Math.random() * 2)],
                        target: this,
                        duration: 2
                    };
                }
                break;
        }

        if (result.counter) {
            this._handleCounter(result, result.counter);
        }
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

    setRow(row) {
        if (row !== 'front' && row !== 'back') {
            return false;
        }
        this.row = row;
        return true;
    }
    
    switchRow() {
        if (this.row === 'front')
            this.row = 'back';
        else
            this.row = 'front';
    }

    getAIAction(enemies, allies = []) {
        const abilities = this.getAvailableAbilities();
        const activeAbilities = Object.entries(abilities.active || {});
        
        if (activeAbilities.length === 0) return null;

        // Filter abilities based on MP cost
        const usableAbilities = activeAbilities.filter(([, ability]) => {
            if (this.status.mp < (ability.mp || 0)) return false;
            if (ability.type === 'dungeon') return false;
            return true;
        });

        if (usableAbilities.length === 0) return null;

        // Sort abilities by priority
        const prioritizedAbilities = this._prioritizeAbilities(usableAbilities, enemies);
        if (prioritizedAbilities.length === 0) return null;

        const [chosenAbilityId, chosenAbility] = prioritizedAbilities[0];
        
        // Select appropriate targets based on ability type
        let validTargets;
        if (chosenAbility.type === 'healing' || chosenAbility.type === 'buff') {
            validTargets = this._getValidTargetsForAbility(chosenAbility, allies);
        } else {
            validTargets = this._getValidTargetsForAbility(chosenAbility, enemies);
        }

        const target = this._selectBestTarget(chosenAbility, validTargets);
        if (!target) return null;

        return {
            type: 'ability',
            ability: chosenAbilityId,
            target: target
        };
    }

    _getValidTargetsForAbility(ability, targets) {
        // For healing/buff, target allies
        if (ability.type === 'healing' || ability.type === 'buff') {
            return targets;  // The combat manager already filters for correct targets
        }

        // For physical attacks, handle ranged vs melee based on row and weapon
        if (ability.type === 'physical' && !this.isRanged()) {
            return targets.filter(t => 
                t.row === 'front' || this.row === 'front'
            );
        }

        // For all other ability types (magical, status, etc.) or ranged physical attacks/weapons
        return targets;
    }

    _selectBestTarget(ability, targets) {
        if (targets.length === 0) return null;
        
        switch (ability.type) {
            case 'buff':
                return targets.reduce((highest, current) => 
                    (current.status.hp / current.getMaxHP()) > (highest.status.hp / highest.getMaxHP())
                        ? current : highest
                );
            case 'healing':
                return targets.reduce((lowest, current) => 
                    (current.status.hp / current.getMaxHP()) < (lowest.status.hp / lowest.getMaxHP())
                        ? current : lowest
                );
            case 'drain':
                if (ability.effect === 'mp_drain') {
                    return targets.reduce((highest, current) => 
                        current.status.mp > highest.status.mp ? current : highest
                    );
                }
                return targets.reduce((highest, current) => 
                    current.status.hp > highest.status.hp ? current : highest
                );
            case 'status':
                return targets.find(t => !t.status.effects.some(e => e.type === ability.effect)) || 
                       targets[Math.floor(Math.random() * targets.length)];
            case 'physical':
                const frontRowTargets = targets.filter(t => t.row === 'front');
                if (frontRowTargets.length > 0 && !ability.ranged && !this.isRanged()) {
                    return frontRowTargets[Math.floor(Math.random() * frontRowTargets.length)];
                }
            default:
                const totalWeight = targets.reduce((sum, t) => 
                    sum + (1 - t.status.hp / t.getMaxHP()), 0);
                let random = Math.random() * totalWeight;
                
                for (const target of targets) {
                    const weight = 1 - target.status.hp / target.getMaxHP();
                    if (random <= weight) return target;
                    random -= weight;
                }
                return targets[0];
        }
    }

    _prioritizeAbilities(abilities, targets) {
        // Score each ability based on the situation
        const scoredAbilities = abilities.map(([id, ability]) => {
            let score = 0;

            // Base score on ability power
            if (ability.power) {
                score += ability.power * 10;
            }

            // Bonus for AoE abilities when multiple targets
            if (ability.aoe && targets.length > 1) {
                score += 5;
            }

            // Bonus for status effects
            if (ability.effect) {
                score += 5;
            }

            // Penalty for MP cost
            score -= (ability.mp || 0) * 0.1;

            return { id, ability, score };
        });

        // Sort by score and return array of [id, ability] pairs
        scoredAbilities.sort((a, b) => b.score - a.score);
        return scoredAbilities.map(({ id, ability }) => [id, ability]);
    }

    // Add these new methods for accuracy and critical calculations
    _calculateAccuracy(ability, target) {
        // Base accuracy (85%)
        let accuracy = 0.85;
        
        // Get accuracy bonuses from support abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            if (ability.effect === 'accuracy_up') {
                accuracy += ability.power || 0.15;
            }
        });

        // Check equipment for accuracy modifiers
        Object.values(this.equipment).forEach(item => {
            if (!item) return;
            if (item.effects?.includes('accuracy_up')) {
                accuracy += 0.1;
            }
            // Apply item-specific accuracy bonus if it exists
            if (item.getAccuracyBonus) {
                accuracy += item.getAccuracyBonus();
            }
        });

        // Check status effects for accuracy modifiers
        this.status.effects.forEach(effect => {
            switch (effect.name) {
                case 'blind':
                    accuracy *= 0.5;
                    break;
                case 'precision':
                    accuracy += 0.2;
                    break;
            }
        });

        // Calculate target's evasion
        let evasion = target.getStats().ev / 100; // Base evasion from stats
        
        // Check target's status effects for evasion modifiers
        target.status.effects.forEach(effect => {
            switch (effect.name) {
                case 'slow':
                    evasion *= 0.7;
                    break;
                case 'haste':
                    evasion *= 1.3;
                    break;
                case 'immobilize':
                    evasion *= 0.5;
                    break;
            }
        });

        // Final hit chance calculation
        return Math.min(0.99, Math.max(0.1, accuracy - evasion));
    }

    _calculateCriticalChance(ability, target) {
        // Base critical chance (5%)
        let critChance = 0.05;
        
        // Get critical bonuses from support abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            if (ability.effect === 'increase_critical') {
                critChance += ability.power || 0.1;
            }
        });

        // Check equipment for critical modifiers
        Object.values(this.equipment).forEach(item => {
            if (!item) return;
            if (item.effects?.includes('critical_up')) {
                critChance += 0.05;
            }
            // Apply item-specific critical bonus if it exists
            if (item.getCriticalBonus) {
                critChance += item.getCriticalBonus();
            }
        });

        // Check status effects for critical modifiers
        this.status.effects.forEach(effect => {
            switch (effect.name) {
                case 'focus':
                    critChance += 0.15;
                    break;
                case 'weakness_exposed':
                    critChance += 0.2;
                    break;
            }
        });

        // Check target's critical resistance
        target.status.effects.forEach(effect => {
            if (effect.name === 'guard') {
                critChance *= 0.5;
            }
        });

        // Final critical chance calculation
        return Math.min(0.5, Math.max(0.01, critChance));
    }

    getInitiative() {
        let initiative = this.getStats().sp;
        
        // Apply Time Sense support ability
        const hasTimeSense = this.getSupportAbilities()
            .some(ability => ability.effect === 'initiative_up');
        if (hasTimeSense) {
            initiative *= 1.5;
        }

        // Check status effects
        this.status.effects.forEach(effect => {
            switch (effect.name) {
                case 'haste':
                    initiative *= 1.5;
                    break;
                case 'slow':
                    initiative *= 0.5;
                    break;
                case 'stop':
                    initiative = 0;
                    break;
            }
        });

        return Math.floor(initiative);
    }

    useItem(item, target) {
        // Check for Item Boost support ability
        const hasItemBoost = this.getSupportAbilities()
            .some(ability => ability.effect === 'improve_item_effect');
            
        const itemEffect = { ...item.effect };
        
        // Apply Item Boost if applicable
        if (hasItemBoost) {
            if (itemEffect.healing) {
                itemEffect.healing *= 1.3;
            }
            if (itemEffect.power) {
                itemEffect.power *= 1.3;
            }
            if (itemEffect.duration) {
                itemEffect.duration = Math.floor(itemEffect.duration * 1.3);
            }
        }

        return this.useAbility({
            ...itemEffect,
            isItem: true,
            name: item.name
        }, target);
    }

    _calculatePerformanceEffect(ability) {
        const stats = this.getStats();
        let effectPower = ability.power || 1;
        let duration = ability.duration || 3;

        // Check for performance enhancing abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            switch (ability.effect) {
                case 'enhance_song_power':
                    if (ability.type === 'song') {
                        effectPower *= 1.5;
                    }
                    break;
                case 'extend_song_duration':
                    if (ability.type === 'song') {
                        duration = Math.floor(duration * 1.5);
                    }
                    break;
                case 'increase_dance_success':
                    if (ability.type === 'dance') {
                        effectPower *= 1.3;
                    }
                    break;
                case 'extend_dance_duration':
                    if (ability.type === 'dance') {
                        duration = Math.floor(duration * 1.4);
                    }
                    break;
                case 'increase_dance_potency':
                    if (ability.type === 'dance') {
                        effectPower *= 1.4;
                    }
                    break;
            }
        });

        return { power: effectPower, duration };
    }

    _calculateTerrainEffects(ability) {
        // Skip if no terrain system is present
        if (!this.currentTerrain) return { power: 1, duration: 1 };

        let power = 1;
        let ignoreNegative = false;

        // Check for terrain-affecting support abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            switch (ability.effect) {
                case 'enhance_terrain_magic':
                    if (this.currentTerrain.type === ability.terrainType) {
                        power *= 1.5;
                    }
                    break;
                case 'ignore_terrain':
                    ignoreNegative = true;
                    break;
            }
        });

        // Apply terrain effects if not ignored
        if (!ignoreNegative && this.currentTerrain.penalty) {
            power *= (1 - this.currentTerrain.penalty);
        }

        return { power };
    }

    _calculateStealthBonus() {
        let stealthLevel = 0;

        // Check for stealth-enhancing support abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            if (ability.effect === 'improve_sneaking') {
                stealthLevel += 2;
            }
        });

        // Add equipment stealth bonuses
        Object.values(this.equipment).forEach(item => {
            if (item?.effects?.includes('stealth_up')) {
                stealthLevel += 1;
            }
        });

        // Check status effects
        this.status.effects.forEach(effect => {
            if (effect.name === 'invisible') {
                stealthLevel += 3;
            }
            if (effect.name === 'camouflage') {
                stealthLevel += 2;
            }
        });

        return stealthLevel;
    }

    resolveMove() {
        // Handle movement-based abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            switch (ability.effect) {
                case 'heal_while_moving':
                    const healAmount = Math.floor(this.getMaxHP() * 0.1);
                    this.status.hp = Math.min(this.getMaxHP(), this.status.hp + healAmount);
                    break;
                case 'mp_regen_walking':
                    const mpAmount = Math.floor(this.getMaxMP() * 0.05);
                    this.status.mp = Math.min(this.getMaxMP(), this.status.mp + mpAmount);
                    break;
                case 'safe_landing':
                    if (this.status.effects.some(e => e.name === 'jump')) {
                        this.addEffect({
                            name: 'safe_landing',
                            duration: 1,
                            power: 1
                        });
                    }
                    break;
            }
        });

        return true;
    }

    _calculateMimicAccuracy(originalAbility) {
        // Base mimic accuracy of 75%
        let accuracy = 0.75;
        
        // Improve accuracy with Mime's support ability
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            if (ability.effect === 'improve_copy_accuracy') {
                accuracy = Math.min(0.95, accuracy + 0.2);
            }
        });

        return accuracy;
    }

    _handleTrapDetection(area) {
        let detectionRange = 1; // Base detection range
        let autoDisarm = false;

        // Check for Thief's trap mastery
        const trapMastery = this.getSupportAbilities()
            .find(ability => ability.effect.includes('extended_trap_detection') || 
                            ability.effect.includes('auto_disarm'));
        
        if (trapMastery) {
            if (trapMastery.effect.includes('extended_trap_detection')) {
                detectionRange = 2;
            }
            if (trapMastery.effect.includes('auto_disarm')) {
                autoDisarm = true;
            }
        }

        // Return detection capabilities
        return {
            range: detectionRange,
            autoDisarm: autoDisarm
        };
    }

    _calculatePredictionAccuracy() {
        let predictionPower = 1;
        
        // Enhance prediction abilities
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            if (ability.effect === 'enhance_prediction') {
                predictionPower += 0.5;
            }
            if (ability.effect === 'enhance_detection') {
                predictionPower += 0.3;
            }
        });

        return predictionPower;
    }

    _calculateMagicModifiers(ability) {
        let powerMultiplier = 1;
        let mpCostMultiplier = 1;

        const support = this.getSupportAbilities();
        support.forEach(supportAbility => {
            switch (supportAbility.effect) {
                case 'enhance_math_magic':
                    if (ability.jobId === JOBS.Calculator) {
                        powerMultiplier *= 1.5;
                    }
                    break;
                case 'enhance_time_magic':
                    if (ability.element === 'time') {
                        powerMultiplier *= 1.4;
                    }
                    break;
                case 'reduce_summon_mp_cost':
                    if (ability.jobId === JOBS.Summoner) {
                        mpCostMultiplier *= 0.7;
                    }
                    break;
            }
        });

        return { powerMultiplier, mpCostMultiplier };
    }

    _calculateMPCost(ability) {
        let mpCost = ability.mp || 0;
        
        // Apply general MP cost reductions
        const support = this.getSupportAbilities();
        support.forEach(ability => {
            switch (ability.effect) {
                case 'reduce_mp_cost':
                    mpCost *= 0.7; // Orator's Silver Tongue
                    break;
                case 'reduce_summon_mp_cost':
                    if (ability.jobId === JOBS.Summoner) {
                        mpCost *= 0.7; // Summoner's Mastery
                    }
                    break;
            }
        });

        return Math.floor(mpCost);
    }

    _calculateJPGain(amount) {
        // Check for JP Boost support ability
        const hasJPBoost = this.getSupportAbilities()
            .some(ability => ability.effect === 'increase_jp_gain');
        if (hasJPBoost) {
            amount = Math.floor(amount * 1.5); // 50% JP gain increase
        }
        return amount;
    }

    _calculateDanceEffect(ability) {
        let duration = ability.duration || 3;
        let potency = ability.power || 1;

        // Check for Performance Focus (Dancer)
        const performanceFocus = this.getSupportAbilities()
            .find(ability => ability.effect === 'extend_dance_duration,increase_dance_potency');
        
        if (performanceFocus) {
            duration = Math.floor(duration * 1.5);
            potency *= 1.3;
        }

        return { duration, potency };
    }

    _resolveSpeechcraftAbility(ability, target) {
        const result = { success: false, effects: [] };
        
        // Base success chance (50%)
        let successRate = 0.5;
        
        // Apply Negotiator bonus if present
        const hasNegotiator = this.getSupportAbilities()
            .some(ability => ability.effect === 'improve_persuasion');
        if (hasNegotiator) {
            successRate += 0.2; // +20% success rate
        }
        
        // Apply level difference modifier
        const levelDiff = this.level - target.level;
        successRate += levelDiff * 0.05; // +/-5% per level difference
        
        // Check for success
        if (Math.random() < successRate) {
            result.success = true;
            
            switch (ability.name) {
                case 'Persuade':
                    result.effects.push({ type: 'charm', duration: 3 });
                    break;
                case 'Negotiate':
                    result.effects.push({ type: 'gil_gain', amount: Math.floor(target.level * 50) });
                    break;
                case 'Peace Talk':
                    result.effects.push({ type: 'retreat', chance: 0.7 });
                    break;
                // ... other speechcraft abilities
            }
            
            // Apply effects to target
            result.effects.forEach(effect => {
                if (effect.type !== 'gil_gain') {
                    target.addEffect({
                        name: effect.type,
                        duration: effect.duration || 1,
                        source: this.name
                    });
                }
            });
        }
        
        return result;
    }
}

export {
    Character
};
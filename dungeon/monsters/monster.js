import { Character } from '../character.js';

class Monster extends Character {
    constructor(template) {
        super(template.name);
        this.level = template.level || 1;
        this.baseStats = template.stats;
        this.currentJob = 'monster';
        this.position = template.position || 'front'; // 'front' or 'back' row

        // Structure abilities to match Character class format
        const structuredAbilities = {};
        if (template.abilities) {
            Object.entries(template.abilities).forEach(([id, ability]) => {
                structuredAbilities[id] = {
                    ...ability,
                    id: id // Add ID to ability data
                };
            });
        }

        this.jobs = {
            monster: {
                level: this.level,
                jp: 0,
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: structuredAbilities,
                    reaction: {},
                    support: {}
                }
            }
        };
        this.equipment = template.equipment || {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.experience = template.experience || this.level * 50;
        this.loot = template.loot || [];
        this.status = {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            effects: []
        };
    }

    // Override async methods with synchronous versions for monsters
    setJob(jobId) {
        this.currentJob = jobId;
        if (!this.jobs[jobId]) {
            this.jobs[jobId] = { 
                level: 1, 
                jp: 0, 
                spentJp: 0,
                mastered: false,
                learnedAbilities: {
                    active: this.jobs.monster.learnedAbilities.active,
                    reaction: {},
                    support: {}
                }
            };
        }
        return true;
    }

    getStats() {
        return {
            hp: this.getMaxHP(),
            mp: this.getMaxMP(),
            pa: this.baseStats.pa,
            ma: this.baseStats.ma,
            sp: this.baseStats.sp,
            ev: this.baseStats.ev
        };
    }

    getMaxHP() {
        return this.baseStats.hp;
    }

    getMaxMP() {
        return this.baseStats.mp;
    }

    getAvailableAbilities() {
        return {
            active: this.jobs.monster.learnedAbilities.active,
            secondary: {},
            reaction: {},
            support: []
        };
    }

    useAbility(ability, target) {
        const abilities = this.getAvailableAbilities();
        let abilityData = abilities.active[ability];
        
        if (!abilityData) {
            return { success: false, message: 'Ability not found' };
        }

        if (this.status.mp < abilityData.mp) {
            return { success: false, message: 'Not enough MP' };
        }

        // Handle row position restrictions
        if (this.position === 'back' && abilityData.type === 'physical' && !abilityData.ranged) {
            return { success: false, message: 'Cannot use melee attack from back row' };
        }

        // Apply costs and resolve ability
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
        }

        // Apply back row damage reduction
        if (target.position === 'back' && abilityData.type === 'physical') {
            if (result.damage) {
                result.damage = Math.floor(result.damage * 0.5);
            }
        }

        // Apply any effects
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
        const damage = Math.floor(this.baseStats.pa * (ability.power || 1));
        target.status.hp = Math.max(0, target.status.hp - damage);
        return {
            success: true,
            damage,
            effects: []
        };
    }

    _resolveMagicalAbility(ability, target) {
        const damage = Math.floor(this.baseStats.ma * (ability.power || 1));
        target.status.hp = Math.max(0, target.status.hp - damage);
        return {
            success: true,
            damage,
            effects: []
        };
    }

    _resolveHealingAbility(ability, target) {
        const healing = Math.floor(this.baseStats.ma * (ability.power || 1));
        const maxHp = target.getMaxHP();
        target.status.hp = Math.min(maxHp, target.status.hp + healing);
        return {
            success: true,
            healing,
            effects: []
        };
    }

    _resolveSupportAbility(ability, target) {
        return {
            success: true,
            effects: this._applyEffect(ability.effect, target)
        };
    }

    _resolveStatusAbility(ability, target) {
        return {
            success: true,
            effects: this._applyEffect(ability.effect, target)
        };
    }

    _applyEffect(effect, target) {
        if (Array.isArray(effect)) {
            return effect.map(e => this._applySingleEffect(e, target));
        }
        return [this._applySingleEffect(effect, target)];
    }

    _applySingleEffect(effect, target) {
        const duration = 3; // Default duration
        const result = {
            type: effect,
            duration,
            success: true
        };

        if (effect === 'hp_drain' || effect === 'mp_drain') {
            const drainAmount = Math.floor(this.baseStats.ma * 0.5);
            if (effect === 'hp_drain') {
                target.status.hp = Math.max(0, target.status.hp - drainAmount);
                this.status.hp = Math.min(this.getMaxHP(), this.status.hp + drainAmount);
                result.power = drainAmount;
            } else {
                target.status.mp = Math.max(0, target.status.mp - drainAmount);
                this.status.mp = Math.min(this.getMaxMP(), this.status.mp + drainAmount);
                result.power = drainAmount;
            }
        }

        // Add the effect to target's status
        target.status.effects.push(result);
        return result;
    }

    getAIAction(targets) {
        const abilities = this.getAvailableAbilities();
        const activeAbilities = Object.entries(abilities.active || {});
        
        if (activeAbilities.length === 0) {
            return null;
        }

        // Filter abilities based on MP cost and position
        const usableAbilities = activeAbilities.filter(([, ability]) => {
            // Check MP cost
            if (this.status.mp < (ability.mp || 0)) return false;
            
            // Skip non-combat abilities
            if (ability.type === 'dungeon') return false;
            
            // If in back row, only allow magical abilities or ranged physical abilities
            if (this.position === 'back') {
                if (ability.type === 'physical' && !ability.ranged) return false;
            }
            
            return true;
        });

        if (usableAbilities.length === 0) {
            return null;
        }

        // Sort abilities by priority
        const prioritizedAbilities = usableAbilities.sort(([, a], [, b]) => {
            // In back row, prioritize magical abilities
            if (this.position === 'back') {
                if (a.type === 'magical' && b.type !== 'magical') return -1;
                if (a.type !== 'magical' && b.type === 'magical') return 1;
            }

            // If we have status effects to apply and none are applied, prioritize them
            const noEffectsOnTargets = targets.every(t => t.status.effects.length === 0);
            if (noEffectsOnTargets) {
                if (a.type === 'status' && b.type !== 'status') return -1;
                if (a.type !== 'status' && b.type === 'status') return 1;
            }

            // If low on health, prioritize healing
            if (this.status.hp < this.getMaxHP() * 0.3) {
                if (a.type === 'healing' && b.type !== 'healing') return -1;
                if (a.type !== 'healing' && b.type === 'healing') return 1;
            }
            
            // If enemies are clustered, prioritize AoE
            if (targets.length > 2) {
                if (a.aoe && !b.aoe) return -1;
                if (!a.aoe && b.aoe) return 1;
            }

            // Prefer more powerful abilities
            return (b.power || 1) - (a.power || 1);
        });

        // Select the highest priority ability
        const [chosenAbilityId, chosenAbility] = prioritizedAbilities[0];

        // Get valid targets for the chosen ability
        let validTargets;
        switch (chosenAbility.type) {
            case 'healing':
            case 'support':
                // Target allies including self
                validTargets = [this];
                break;
            case 'status':
                // Target enemies without the effect
                validTargets = targets.filter(t => 
                    !t.status.effects.some(e => e.type === chosenAbility.effect)
                );
                break;
            default:
                // For attacks, target all living enemies
                validTargets = targets.filter(t => t.status.hp > 0);
        }

        if (!validTargets || validTargets.length === 0) {
            return null;
        }

        // Select target based on ability type
        const target = this._selectBestTarget(chosenAbility, validTargets);
        if (!target) {
            return null;
        }

        return {
            type: 'ability',
            ability: chosenAbilityId,
            target: target
        };
    }

    _prioritizeAbilities(abilities, targets) {
        // Filter abilities based on position first
        const validAbilities = abilities.filter(([, ability]) => {
            if (this.position === 'back' && ability.type === 'physical' && !ability.ranged) {
                return false; // Skip melee physical abilities in back row
            }
            return true;
        });

        if (validAbilities.length === 0) {
            return abilities; // Return all abilities if no valid ones found
        }

        // Sort abilities based on current situation
        return validAbilities.sort(([, a], [, b]) => {
            // Prioritize magical/ranged attacks from back row
            if (this.position === 'back') {
                if ((a.type === 'magical' || a.ranged) && !(b.type === 'magical' || b.ranged)) return -1;
                if (!(a.type === 'magical' || a.ranged) && (b.type === 'magical' || b.ranged)) return 1;
            }
            
            // If low on health, prioritize healing
            if (this.status.hp < this.getMaxHP() * 0.3) {
                if (a.type === 'healing' && b.type !== 'healing') return -1;
                if (a.type !== 'healing' && b.type === 'healing') return 1;
            }
            
            // If enemies are clustered, prioritize AoE
            if (targets.length > 2) {
                if (a.aoe && !b.aoe) return -1;
                if (!a.aoe && b.aoe) return 1;
            }

            // If we have status effects to apply and none are applied, prioritize them
            const noEffectsOnTargets = targets.every(t => t.status.effects.length === 0);
            if (noEffectsOnTargets) {
                if (a.type === 'status' && b.type !== 'status') return -1;
                if (a.type !== 'status' && b.type === 'status') return 1;
            }

            return 0;
        });
    }

    // Override to handle row positioning in AI
    _getValidTargetsForAbility(ability, targets) {
        switch (ability.type) {
            case 'healing':
            case 'support':
                // Target self or allies
                return [this];
            case 'physical':
                // Filter out back row targets for melee attacks if not ranged
                if (!ability.ranged) {
                    return targets.filter(t => t.position === 'front' && t.status.hp > 0);
                }
                // Fall through to default for ranged attacks
            default:
                // For other types, all living targets are valid
                return targets.filter(t => t.status.hp > 0);
        }
    }

    _selectBestTarget(ability, targets) {
        if (targets.length === 0) return null;
        
        switch (ability.type) {
            case 'healing':
                // Target lowest HP ratio
                return targets.reduce((lowest, current) => 
                    (current.status.hp / current.getMaxHP()) < (lowest.status.hp / lowest.getMaxHP())
                        ? current : lowest
                );
            
            case 'drain':
                // Target highest HP for HP drain, highest MP for MP drain
                if (ability.effect === 'mp_drain') {
                    return targets.reduce((highest, current) => 
                        current.status.mp > highest.status.mp ? current : highest
                    );
                } else {
                    return targets.reduce((highest, current) => 
                        current.status.hp > highest.status.hp ? current : highest
                    );
                }
            
            case 'status':
                // Target without the effect already
                return targets.find(t => !t.status.effects.some(e => e.name === ability.effect)) || 
                       targets[Math.floor(Math.random() * targets.length)];
            
            case 'physical':
                // Prefer front row targets for physical attacks
                const frontRowTargets = targets.filter(t => t.position === 'front');
                if (frontRowTargets.length > 0 && !ability.ranged) {
                    return frontRowTargets[Math.floor(Math.random() * frontRowTargets.length)];
                }
                // Fall through to default if no front row targets or ranged attack
                
            default:
                // For other types, pick randomly but weight towards lower HP targets
                const totalWeight = targets.reduce((sum, t) => 
                    sum + (1 - t.status.hp / t.getMaxHP()), 0);
                let random = Math.random() * totalWeight;
                
                for (const target of targets) {
                    const weight = 1 - target.status.hp / target.getMaxHP();
                    if (random <= weight) return target;
                    random -= weight;
                }
                return targets[0]; // Fallback
        }
    }
}

export { Monster };
import { JobInterface, JOBS } from './index.js';

export class Oracle extends JobInterface {
    static getDescription() {
        return "Mystical seers who can predict and manipulate future events. Their foresight abilities allow them to anticipate enemy actions and discover hidden paths. In addition to combat support through prophecy, they excel at revealing secrets and preventing ambushes through their precognitive abilities.";
    }

    static getBaseStats() {
        return {
            hp: 85,
            mp: 95,
            pa: 4,
            ma: 11,
            sp: 7,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 25,
            mp: 22,
            pa: 0.1,
            ma: 0.5,
            sp: 0.2,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Divination',
                abilities: {
                    DIVINE_SIGHT: {
                        name: 'Divine Sight',
                        type: 'dungeon',
                        effect: 'predict_encounters',
                        mp: 18,
                        jpCost: 250,
                        description: 'Foresee upcoming enemy encounters and their patterns'
                    },
                    PREMONITION: {
                        name: 'Premonition',
                        type: 'special',
                        mp: 22,
                        jpCost: 300,
                        description: 'See outcomes of actions before taking them'
                    },
                    ENEMY_INSIGHT: {
                        name: 'Enemy Insight',
                        type: 'special',
                        mp: 25,
                        jpCost: 400,
                        description: 'Reveal enemy stats and predict next action'
                    },
                    FATE_MAP: {
                        name: 'Fate Map',
                        type: 'dungeon',
                        effect: ['reveal_events', 'reveal_treasure'],
                        mp: 30,
                        jpCost: 450,
                        description: 'Reveal locations of future events and treasures'
                    },
                    CONDEMN: {
                        name: 'Condemn',
                        type: 'status',
                        effect: 'doom',
                        mp: 35,
                        jpCost: 500,
                        description: 'Mark target for inevitable defeat'
                    },
                    STAR_SIGHT: {
                        name: 'Star Sight',
                        type: 'status',
                        effect: ['blind', 'silence'],
                        mp: 38,
                        jpCost: 550,
                        description: 'Blind and silence target with starlight'
                    },
                    CALAMITY: {
                        name: 'Calamity',
                        type: 'status',
                        effect: ['poison', 'slow', 'silence'],
                        mp: 45,
                        jpCost: 650,
                        description: 'Inflict multiple status effects'
                    },
                    FORTUNE_GUARD: {
                        name: 'Fortune Guard',
                        type: 'buff',
                        effect: 'predict_critical',
                        aoe: true,
                        mp: 40,
                        jpCost: 600,
                        description: 'Protect allies from critical hits'
                    },
                    PROPHECY_SHIELD: {
                        name: 'Prophecy Shield',
                        type: 'buff',
                        effect: 'predict_damage',
                        aoe: true,
                        mp: 50,
                        jpCost: 700,
                        description: 'Use future sight to protect from incoming threats'
                    }
                }
            },
            reaction: {
                PRESCIENCE: {
                    name: 'Prescience',
                    chance: 0.25,
                    effect: 'survive_fatal',
                    jpCost: 400,
                    description: 'Chance to survive fatal damage with 1 HP'
                },
                FORTUNE_SHIELD: {
                    name: 'Fortune Shield',
                    chance: 0.3,
                    effect: 'prevent_status',
                    jpCost: 450,
                    description: 'Chance to prevent status effects'
                },
            },
            support: {
                PROPHECY: {
                    name: 'Prophecy',
                    effect: 'enhance_prediction',
                    jpCost: 500,
                    description: 'Improves accuracy of prediction abilities'
                },
                ASTRAL_SIGHT: {
                    name: 'Astral Sight',
                    effect: 'enhance_detection',
                    jpCost: 600,
                    description: 'Greatly improves all detection abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.WhiteMage]: 2
        };
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'PREDICT':
                return this._resolvePredict(user, ability, target);
            case 'CONDEMN':
                return this._resolveCondemn(user, ability, target);
            case 'PROPHECY':
                return this._resolveProphecy(user, ability, target);
            case 'STAR_READING':
                return this._resolveStarReading(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolvePredict(user, ability, target) {
        // Base success rate on MA and level difference
        const baseChance = 0.5 + (user.getStats().ma - target.level) * 0.04;
        const successRate = Math.min(0.9, Math.max(0.2, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Failed to read target\'s future'
            };
        }

        // Predict upcoming hostile action
        const prediction = this._generatePrediction(target);
        target.status.predicted = true;
        target.status.predictedAction = prediction;

        // Apply defensive buff to allies if prediction is hostile
        if (prediction.isHostile) {
            user.status.effects.push({
                name: 'foresight',
                duration: 3,
                power: 1.2
            });
        }

        return {
            success: true,
            prediction,
            effects: [{
                name: 'predicted',
                duration: 3
            }]
        };
    }

    static _resolveCondemn(user, ability, target) {
        // Check if target is already under status effects
        const existingEffects = target.status.effects?.length || 0;
        const baseChance = 0.4 + (existingEffects * 0.1) + (user.getStats().ma - target.level) * 0.03;
        const successRate = Math.min(0.85, Math.max(0.15, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Failed to condemn target'
            };
        }

        // Apply doom effect with delay based on target's current HP ratio
        const hpRatio = target.status.hp / target.getMaxHP();
        const doomDelay = Math.max(1, Math.ceil(hpRatio * 5));

        target.status.effects.push({
            name: 'doom',
            duration: doomDelay,
            fatal: true
        });

        return {
            success: true,
            message: `Condemned target with ${doomDelay} turn delay`,
            effects: [{
                name: 'doom',
                duration: doomDelay
            }]
        };
    }

    static _resolveProphecy(user, ability, target) {
        // Prophecy affects an area with status effects based on celestial alignment
        const alignment = this._getCurrentCelestialAlignment();
        const effects = [];

        switch (alignment) {
            case 'beneficial':
                effects.push({
                    name: 'regen',
                    duration: 4,
                    power: 1.5
                }, {
                    name: 'protect',
                    duration: 4
                });
                break;
            case 'hostile':
                effects.push({
                    name: 'poison',
                    duration: 4,
                    power: 1.2
                }, {
                    name: 'slow',
                    duration: 3
                });
                break;
            case 'neutral':
                effects.push({
                    name: 'reflect',
                    duration: 3
                });
                break;
        }

        // Apply effects to target
        effects.forEach(effect => {
            if (!target.isImmuneToEffect(effect.name)) {
                target.addEffect(effect);
            }
        });

        return {
            success: true,
            alignment,
            effects
        };
    }

    static _resolveStarReading(user, ability, target) {
        // Read celestial bodies to grant powerful buffs/debuffs
        const stats = user.getStats();
        const starPower = Math.floor(stats.ma * ability.power);
        
        // Get zodiac compatibility between user and target
        const compatibility = this._getZodiacCompatibility(user, target);
        const effectMultiplier = compatibility === 'compatible' ? 1.5 :
                               compatibility === 'opposing' ? 0.5 : 1;

        // Apply star-based effects
        const effects = [{
            name: 'celestial_blessing',
            duration: 4,
            power: starPower * effectMultiplier
        }];

        if (compatibility === 'compatible') {
            effects.push({
                name: 'haste',
                duration: 3
            });
        } else if (compatibility === 'opposing') {
            effects.push({
                name: 'slow',
                duration: 3
            });
        }

        effects.forEach(effect => {
            if (!target.isImmuneToEffect(effect.name)) {
                target.addEffect(effect);
            }
        });

        return {
            success: true,
            zodiacCompatibility: compatibility,
            effects
        };
    }

    static _generatePrediction(target) {
        // Simulate predicting target's next action
        const targetStats = target.getStats();
        const isAggressive = target.status.hp < target.getMaxHP() * 0.5;
        
        return {
            isHostile: isAggressive,
            predictedAction: isAggressive ? 'attack' : 'defend',
            turnDelay: Math.floor(Math.random() * 2) + 1
        };
    }

    static _getCurrentCelestialAlignment() {
        // Simulate celestial alignment based on time/turn
        const alignments = ['beneficial', 'hostile', 'neutral'];
        return alignments[Math.floor(Math.random() * alignments.length)];
    }

    static _getZodiacCompatibility(user, target) {
        // Simulate zodiac sign compatibility
        const compatibilities = ['compatible', 'opposing', 'neutral'];
        return compatibilities[Math.floor(Math.random() * compatibilities.length)];
    }
}
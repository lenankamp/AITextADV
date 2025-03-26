import { JobInterface, JOBS } from './index.js';

export class Geomancer extends JobInterface {
    static getDescription() {
        return "Masters of terrain manipulation and natural forces. Their unique abilities allow them to draw power from and shape the environment around them. Experts at navigating and utilizing terrain features, they excel at area control and environmental manipulation while providing crucial exploration abilities.";
    }

    static getBaseStats() {
        return {
            hp: 100,
            mp: 75,
            pa: 7,
            ma: 9,
            sp: 8,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 35,
            mp: 15,
            pa: 0.3,
            ma: 0.4,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Geomancy',
                abilities: {
                    TERRAIN_POWER: {
                        name: 'Terrain Power',
                        type: 'special',
                        mp: 25,
                        jpCost: 300,
                        description: 'Attack based on current terrain'
                    },
                    EARTH_RENDER: {
                        name: 'Earth Render',
                        type: 'magical',
                        element: 'earth',
                        power: 2.4,
                        mp: 30,
                        jpCost: 400,
                        description: 'Powerful earth-based attack'
                    },
                    TERRA_PULSE: {
                        name: 'Terra Pulse',
                        type: 'magical',
                        element: 'earth',
                        power: 2.2,
                        aoe: true,
                        mp: 35,
                        jpCost: 450,
                        description: 'Area earth damage'
                    },
                    TERRAIN_SIGHT: {
                        name: 'Terrain Sight',
                        type: 'dungeon',
                        effect: 'reveal_terrain',
                        mp: 28,
                        jpCost: 350,
                        description: 'Reveal detailed terrain layout and features'
                    },
                    EARTH_SENSE: {
                        name: 'Earth Sense',
                        type: 'dungeon',
                        effect: ['detect_traps', 'detect_passages'],
                        mp: 20,
                        jpCost: 300,
                        description: 'Detect hidden paths and hazards in current area'
                    },
                    ROCK_PATH: {
                        name: 'Rock Path',
                        type: 'dungeon',
                        effect: 'create_path',
                        mp: 32,
                        jpCost: 400,
                        description: 'Create temporary paths over gaps'
                    },
                    TERRAIN_SHIFT: {
                        name: 'Terrain Shift',
                        type: 'dungeon',
                        effect: 'modify_terrain',
                        mp: 40,
                        jpCost: 500,
                        description: 'Temporarily modify terrain properties'
                    },
                    SANDSTORM: {
                        name: 'Sandstorm',
                        type: 'magical',
                        element: 'earth',
                        power: 2.0,
                        effect: 'blind',
                        aoe: true,
                        mp: 38,
                        jpCost: 450,
                        description: 'Area damage with chance to blind'
                    },
                    NATURE_COMMUNION: {
                        name: 'Nature Communion',
                        type: 'dungeon',
                        effect: ['reveal_hazards', 'detect_resources'],
                        mp: 45,
                        jpCost: 600,
                        description: 'Reveal environmental hazards and natural resources'
                    },
                    GAIA_FORCE: {
                        name: 'Gaia Force',
                        type: 'magical',
                        element: 'earth',
                        power: 3.0,
                        aoe: true,
                        mp: 50,
                        jpCost: 700,
                        description: 'Ultimate earth-based attack'
                    }
                }
            },
            reaction: {
                EARTH_EMBRACE: {
                    name: 'Earth Embrace',
                    chance: 0.3,
                    effect: 'terrain_heal',
                    jpCost: 400,
                    description: 'Chance to heal when standing on natural terrain'
                },
                NATURE_SHIELD: {
                    name: 'Nature Shield',
                    chance: 0.25,
                    effect: 'terrain_defense',
                    jpCost: 450,
                    description: 'Reduces damage based on current terrain'
                }
            },
            support: {
                TERRAIN_MASTERY: {
                    name: 'Terrain Mastery',
                    effect: 'enhance_terrain_magic',
                    jpCost: 500,
                    description: 'Strengthens all terrain-based abilities'
                },
                NATURE_STEP: {
                    name: 'Nature Step',
                    effect: 'ignore_terrain',
                    jpCost: 400,
                    description: 'Ignore negative terrain effects'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.Monk]: 3
        };
    }

    // Track current terrain effects
    static currentTerrain = {
        type: 'neutral',
        power: 1.0
    };

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'TERRAIN_POWER':
                return this._resolveTerrainPower(user, target);
            case 'TERRAIN_MASTERY':
                return this._resolveTerrainMastery(user, ability, target);
            case 'NATURE_WRATH':
                return this._resolveNatureWrath(user, ability, target);
            case 'EARTH_HARMONY':
                return this._resolveEarthHarmony(user, ability, target);
            case 'ELEMENTAL_SEAL':
                return this._resolveElementalSeal(user, ability, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveTerrainPower(user, target) {
        // Get current terrain type from combat environment
        const terrain = user.getCurrentTerrain?.() || 'neutral';
        
        // Define terrain-based effects
        const terrainEffects = {
            plains: {
                type: 'wind',
                power: 1.8,
                effect: 'float'
            },
            forest: {
                type: 'nature',
                power: 2.0,
                effect: 'poison'
            },
            mountain: {
                type: 'earth',
                power: 2.2,
                effect: 'slow'
            },
            water: {
                type: 'water',
                power: 1.9,
                effect: 'water_chain'
            },
            desert: {
                type: 'earth',
                power: 2.1,
                effect: 'blind'
            },
            swamp: {
                type: 'water',
                power: 1.7,
                effect: ['poison', 'slow']
            },
            volcano: {
                type: 'fire',
                power: 2.4,
                effect: 'burn'
            },
            snow: {
                type: 'ice',
                power: 2.0,
                effect: 'freeze'
            },
            neutral: {
                type: 'earth',
                power: 1.5,
                effect: null
            }
        };

        const effect = terrainEffects[terrain];
        const damage = Math.floor(user.getMA() * effect.power);

        // Apply terrain-based damage and effects
        const result = {
            success: true,
            damage: damage,
            message: `Drew power from ${terrain} terrain!`,
            effects: []
        };

        if (effect.effect) {
            if (Array.isArray(effect.effect)) {
                effect.effect.forEach(e => {
                    if (!target.isImmuneToEffect(e)) {
                        result.effects.push({ type: e, duration: 3 });
                    }
                });
            } else if (!target.isImmuneToEffect(effect.effect)) {
                result.effects.push({ type: effect.effect, duration: 3 });
            }
        }

        return result;
    }

    static _resolveTerrainMastery(user, ability, target) {
        // Analyze and enhance terrain effects
        const terrainTypes = ['forest', 'mountain', 'desert', 'swamp', 'urban', 'coastal'];
        const terrainType = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        
        // Update current terrain effect
        this.currentTerrain = {
            type: terrainType,
            power: 1.0 + (user.getStats().ma * 0.05)
        };

        const effect = {
            name: 'terrain_mastery',
            duration: 4,
            power: this.currentTerrain.power,
            terrain: terrainType,
            bonuses: this._getTerrainBonuses(terrainType)
        };

        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
        }

        return {
            success: true,
            message: `The ${terrainType} terrain responds to your mastery`,
            currentTerrain: this.currentTerrain,
            effects: [effect]
        };
    }

    static _resolveNatureWrath(user, ability, target) {
        // Unleash terrain-based damage
        const stats = user.getStats();
        const terrainPower = this.currentTerrain.power;
        let baseDamage = Math.floor(stats.ma * ability.power * terrainPower);

        // Apply terrain-specific damage modifications
        const terrainMultiplier = this._getTerrainDamageMultiplier(this.currentTerrain.type, target);
        const totalDamage = Math.floor(baseDamage * terrainMultiplier);

        // Apply damage
        target.status.hp = Math.max(0, target.status.hp - totalDamage);

        // Add terrain-specific status effect
        const statusEffect = this._getTerrainStatusEffect(this.currentTerrain.type);
        if (statusEffect && !target.isImmuneToEffect(statusEffect.name)) {
            target.addEffect(statusEffect);
        }

        return {
            success: true,
            damage: totalDamage,
            message: `${target.name} takes ${totalDamage} damage from the ${this.currentTerrain.type}'s fury`,
            effects: statusEffect ? [statusEffect] : []
        };
    }

    static _resolveEarthHarmony(user, ability, target) {
        // Defensive ability that grants terrain-based protection
        const stats = user.getStats();
        const terrainPower = this.currentTerrain.power;
        
        const effect = {
            name: 'earth_harmony',
            duration: 3,
            power: terrainPower,
            terrain: this.currentTerrain.type,
            bonuses: {
                defense: 1.2 * terrainPower,
                magicDefense: 1.2 * terrainPower,
                ...this._getTerrainBonuses(this.currentTerrain.type)
            }
        };

        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
        }

        // Heal based on terrain if applicable
        let healing = 0;
        if (['forest', 'coastal'].includes(this.currentTerrain.type)) {
            healing = Math.floor(target.getMaxHP() * 0.15 * terrainPower);
            target.status.hp = Math.min(target.getMaxHP(), target.status.hp + healing);
        }

        return {
            success: true,
            healing,
            message: `${target.name} harmonizes with the ${this.currentTerrain.type}` +
                     (healing > 0 ? ` and recovers ${healing} HP` : ''),
            effects: [effect]
        };
    }

    static _resolveElementalSeal(user, ability, target) {
        // Create a powerful seal using terrain energy
        const stats = user.getStats();
        const terrainPower = this.currentTerrain.power;
        const sealPower = Math.floor(stats.ma * ability.power * terrainPower);

        const effect = {
            name: 'elemental_seal',
            duration: 4,
            power: sealPower,
            terrain: this.currentTerrain.type,
            penalties: {
                elementalResistance: 0.5,
                magicDefense: 0.7
            }
        };

        // Add terrain-specific seal effects
        const sealEffects = this._getTerrainSealEffects(this.currentTerrain.type);
        Object.assign(effect.penalties, sealEffects);

        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
        }

        return {
            success: true,
            message: `${target.name} is sealed by ${this.currentTerrain.type} energy`,
            effects: [effect]
        };
    }

    static _getTerrainBonuses(terrainType) {
        switch (terrainType) {
            case 'forest':
                return { evasion: 1.2, magicPower: 1.15 };
            case 'mountain':
                return { defense: 1.3, magicDefense: 1.2 };
            case 'desert':
                return { speed: 1.15, magicPower: 1.25 };
            case 'swamp':
                return { magicPower: 1.3, mpCost: 0.8 };
            case 'urban':
                return { defense: 1.15, speed: 1.2 };
            case 'coastal':
                return { evasion: 1.25, speed: 1.15 };
            default:
                return {};
        }
    }

    static _getTerrainDamageMultiplier(terrainType, target) {
        // Calculate damage multiplier based on terrain and target properties
        let multiplier = 1.0;

        switch (terrainType) {
            case 'forest':
                multiplier = target.type === 'beast' ? 0.7 : 1.2;
                break;
            case 'mountain':
                multiplier = target.type === 'flying' ? 1.5 : 1.1;
                break;
            case 'desert':
                multiplier = target.type === 'aquatic' ? 1.8 : 1.3;
                break;
            case 'swamp':
                multiplier = target.type === 'undead' ? 0.8 : 1.4;
                break;
            case 'urban':
                multiplier = target.type === 'mechanical' ? 0.9 : 1.2;
                break;
            case 'coastal':
                multiplier = target.type === 'aquatic' ? 0.7 : 1.3;
                break;
        }

        return multiplier;
    }

    static _getTerrainStatusEffect(terrainType) {
        switch (terrainType) {
            case 'forest':
                return { name: 'entangle', duration: 3, power: 1.0 };
            case 'mountain':
                return { name: 'stun', duration: 2, power: 1.0 };
            case 'desert':
                return { name: 'dehydrate', duration: 3, power: 1.2 };
            case 'swamp':
                return { name: 'poison', duration: 4, power: 1.3 };
            case 'urban':
                return { name: 'blind', duration: 2, power: 1.0 };
            case 'coastal':
                return { name: 'slow', duration: 3, power: 1.1 };
            default:
                return null;
        }
    }

    static _getTerrainSealEffects(terrainType) {
        switch (terrainType) {
            case 'forest':
                return { mpRegen: 0.5, evasion: 0.7 };
            case 'mountain':
                return { defense: 0.6, magicDefense: 0.6 };
            case 'desert':
                return { speed: 0.6, mpCost: 1.5 };
            case 'swamp':
                return { attack: 0.7, magicPower: 0.7 };
            case 'urban':
                return { criticalRate: 0.5, accuracy: 0.8 };
            case 'coastal':
                return { speed: 0.7, evasion: 0.6 };
            default:
                return {};
        }
    }
}
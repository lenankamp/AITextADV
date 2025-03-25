import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class GEOMANCER extends JOBINTERFACE {
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
            [JOBS.MONK]: 3
        };
    }
}
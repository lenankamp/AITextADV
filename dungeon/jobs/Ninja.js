import { JobInterface } from './JobInterface.js';
import { JOBS } from './index.js';

export class Ninja extends JobInterface {
    static getDescription() {
        return "Highly skilled infiltrators and combat specialists who excel in stealth and agility. Masters of deception who can throw weapons, walk on walls, and create illusions. Their versatile skillset combines offensive capabilities with exceptional mobility and evasion, making them equally adept at combat and covert operations.";
    }

    static getBaseStats() {
        return {
            hp: 95,
            mp: 60,
            pa: 9,
            ma: 7,
            sp: 11,
            ev: 8
        };
    }

    static getGrowthRates() {
        return {
            hp: 32,
            mp: 12,
            pa: 0.4,
            ma: 0.3,
            sp: 0.6,
            ev: 0.4
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Ninjutsu',
                abilities: {
                    THROW: {
                        name: 'Throw',
                        type: 'physical',
                        power: 'weapon_dependent',
                        mp: 0,
                        jpCost: 200,
                        description: 'Throw any weapon as a projectile'
                    },
                    SHADOW_WALK: {
                        name: 'Shadow Walk',
                        type: 'dungeon',
                        effect: 'stealth_movement',
                        mp: 15,
                        jpCost: 300,
                        description: 'Move silently through areas undetected'
                    },
                    WALL_WALK: {
                        name: 'Wall Walk',
                        type: 'dungeon',
                        effect: 'traverse_walls',
                        mp: 25,
                        jpCost: 400,
                        description: 'Walk on walls to bypass obstacles'
                    },
                    SMOKE_BOMB: {
                        name: 'Smoke Bomb',
                        type: 'status',
                        effect: 'blind',
                        aoe: true,
                        mp: 12,
                        jpCost: 250,
                        description: 'Create smoke screen that blinds enemies'
                    },
                    INFILTRATE: {
                        name: 'Infiltrate',
                        type: 'dungeon',
                        effect: 'bypass_enemies',
                        mp: 20,
                        jpCost: 350,
                        description: 'Sneak past enemy patrols undetected'
                    },
                    FLAME_VEIL: {
                        name: 'Flame Veil',
                        type: 'magical',
                        element: 'fire',
                        power: 1.8,
                        mp: 16,
                        jpCost: 300,
                        description: 'Fire-based ninjutsu attack'
                    },
                    WATER_VEIL: {
                        name: 'Water Veil',
                        type: 'magical',
                        element: 'water',
                        power: 1.9,
                        mp: 20,
                        jpCost: 300,
                        description: 'Water-based ninjutsu attack'
                    },
                    SHADOW_STITCH: {
                        name: 'Shadow Stitch',
                        type: 'status',
                        effect: 'immobilize',
                        mp: 18,
                        jpCost: 350,
                        description: 'Bind target\'s shadow to prevent movement'
                    },
                    MIRROR_IMAGE: {
                        name: 'Mirror Image',
                        type: 'support',
                        effect: 'create_decoy',
                        mp: 28,
                        jpCost: 450,
                        description: 'Create illusory copies to evade attacks'
                    },
                    ASSASSINATE: {
                        name: 'Assassinate',
                        type: 'physical',
                        power: 3.0,
                        effect: 'instant_death',
                        mp: 45,
                        jpCost: 600,
                        description: 'Powerful strike with chance of instant death'
                    }
                }
            },
            reaction: {
                VANISH: {
                    name: 'Vanish',
                    chance: 0.3,
                    effect: 'temporary_invisibility',
                    jpCost: 400,
                    description: 'Become temporarily invisible when hit'
                },
                SHADOW_RETURN: {
                    name: 'Shadow Return',
                    chance: 0.25,
                    effect: 'counter_with_status',
                    jpCost: 500,
                    description: 'Counter attacks with status effect'
                }
            },
            support: {
                DUAL_WIELD: {
                    name: 'Dual Wield',
                    effect: 'enable_dual_wielding',
                    jpCost: 500,
                    description: 'Equip weapons in both hands'
                },
                STEALTH: {
                    name: 'Stealth',
                    effect: 'improve_sneaking',
                    jpCost: 400,
                    description: 'Improved stealth movement and detection avoidance'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.ARCHER]: 3,
            [JOBS.THIEF]: 4,
            [JOBS.GEOMANCER]: 2
        };
    }
}
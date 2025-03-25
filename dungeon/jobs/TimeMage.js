import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class TIMEMAGE extends JOBINTERFACE {
    static getBaseStats() {
        return {
            hp: 82,
            mp: 98,
            pa: 4,
            ma: 11,
            sp: 7,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 22,
            mp: 24,
            pa: 0.1,
            ma: 0.5,
            sp: 0.3,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Time Magic',
                abilities: {
                    HASTE: {
                        name: 'Haste',
                        type: 'buff',
                        effect: 'haste',
                        mp: 24,
                        jpCost: 300,
                        description: 'Increase target\'s speed'
                    },
                    SLOW: {
                        name: 'Slow',
                        type: 'status',
                        effect: 'slow',
                        mp: 20,
                        jpCost: 300,
                        description: 'Decrease target\'s speed'
                    },
                    STOP: {
                        name: 'Stop',
                        type: 'status',
                        effect: 'stop',
                        mp: 30,
                        jpCost: 500,
                        description: 'Freeze target in time'
                    },
                    FLOAT: {
                        name: 'Float',
                        type: 'buff',
                        effect: 'levitate',
                        mp: 18,
                        jpCost: 200,
                        description: 'Allow target to float above ground'
                    },
                    GRAVITY: {
                        name: 'Gravity',
                        type: 'magical',
                        effect: 'gravity_damage',
                        mp: 32,
                        jpCost: 400,
                        description: 'Deal damage based on target\'s max HP'
                    },
                    TIME_SLIP: {
                        name: 'Time Slip',
                        type: 'dungeon',
                        effect: 'reset_room',
                        mp: 35,
                        jpCost: 450,
                        description: 'Reset a room to its original state'
                    },
                    TEMPORAL_ANCHOR: {
                        name: 'Temporal Anchor',
                        type: 'dungeon',
                        effect: 'create_checkpoint',
                        mp: 40,
                        jpCost: 500,
                        description: 'Create a temporal checkpoint to return to'
                    },
                    QUICK: {
                        name: 'Quick',
                        type: 'special',
                        mp: 45,
                        jpCost: 800,
                        description: 'Grant an immediate extra turn'
                    },
                    METEOR: {
                        name: 'Meteor',
                        type: 'magical',
                        power: 3.5,
                        aoe: true,
                        mp: 60,
                        jpCost: 900,
                        description: 'Call down devastating meteors'
                    }
                }
            },
            reaction: {
                TIME_WARD: {
                    name: 'Time Ward',
                    chance: 0.3,
                    effect: 'resist_time_magic',
                    jpCost: 400,
                    description: 'Chance to resist time magic'
                },
                TEMPORAL_SHIFT: {
                    name: 'Temporal Shift',
                    chance: 0.25,
                    effect: 'evade',
                    jpCost: 500,
                    description: 'Phase through time to avoid damage'
                }
            },
            support: {
                TIME_SENSE: {
                    name: 'Time Sense',
                    effect: 'initiative_up',
                    jpCost: 300,
                    description: 'Improve chance of acting first'
                },
                TEMPORAL_MASTERY: {
                    name: 'Temporal Mastery',
                    effect: 'enhance_time_magic',
                    jpCost: 600,
                    description: 'Strengthen all time magic effects'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.BLACK_MAGE]: 2
        };
    }

    static getDescription() {
        return "Enigmatic spellcasters who manipulate the flow of time itself. Their mastery over temporal magic allows them to speed allies, slow enemies, and even stop time briefly. In combat, they excel at battlefield control through time manipulation. Their unique abilities to reset rooms and create temporal checkpoints make them invaluable for dungeon exploration and puzzle-solving.";
    }
}
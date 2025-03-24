import { JobInterface } from './JobInterface.js';
import { JOBS } from './index.js';


export class Thief extends JobInterface {
    static getDescription() {
        return "Masters of stealth and acquisition who excel at obtaining resources through cunning. Their high speed and evasion make them difficult targets, while their stealing abilities provide crucial resources and strategic advantages. In dungeons, they are essential for disarming traps, picking locks, and finding hidden treasures, making them invaluable for exploration and resource gathering.";
    }
    static getBaseStats() {
        return {
            hp: 90,
            mp: 45,
            pa: 8,
            ma: 5,
            sp: 10,
            ev: 9
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 10,
            pa: 0.3,
            ma: 0.2,
            sp: 0.5,
            ev: 0.4
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Thievery',
                abilities: {
                    STEAL_GIL: {
                        name: 'Steal Gil',
                        type: 'special',
                        mp: 0,
                        jpCost: 200
                    },
                    STEAL_ITEM: {
                        name: 'Steal Item',
                        type: 'special',
                        mp: 0,
                        jpCost: 300
                    },
                    STEAL_WEAPON: {
                        name: 'Steal Weapon',
                        type: 'special',
                        mp: 10,
                        jpCost: 400
                    },
                    STEAL_HEART: {
                        name: 'Steal Heart',
                        type: 'status',
                        effect: 'charm',
                        mp: 18,
                        jpCost: 350
                    },
                    STEAL_EXP: {
                        name: 'Steal EXP',
                        type: 'special',
                        mp: 25,
                        jpCost: 450
                    },
                    MUG: {
                        name: 'Mug',
                        type: 'physical',
                        power: 1.5,
                        effect: 'damage_and_steal',
                        mp: 15,
                        jpCost: 400
                    },
                    TRAPSMITH: {
                        name: 'Trapsmith',
                        type: 'dungeon',
                        effect: ['detect_traps', 'disarm_trap', 'trap_analysis'],
                        mp: 18,
                        jpCost: 350,
                        description: 'Detect and safely disarm traps in the area'
                    },
                    LOCKPICK: {
                        name: 'Lockpick',
                        type: 'dungeon',
                        effect: 'unlock',
                        mp: 10,
                        jpCost: 200,
                        description: 'Pick locks on doors and chests'
                    },
                    PILFER: {
                        name: 'Pilfer',
                        type: 'special',
                        mp: 20,
                        jpCost: 500,
                        description: 'Steals positive status effects from target'
                    }
                }
            },
            reaction: {
                VIGILANCE: {
                    name: 'Vigilance',
                    chance: 0.3,
                    effect: 'detect_ambush',
                    jpCost: 300,
                    description: 'Chance to detect and prevent surprise attacks'
                },
                STICKY_FINGERS: {
                    name: 'Sticky Fingers',
                    chance: 0.25,
                    effect: 'counter_steal',
                    jpCost: 400,
                    description: 'Chance to steal items when hit'
                }
            },
            support: {
                TREASURE_HUNTER: {
                    name: 'Treasure Hunter',
                    effect: 'increase_steal_rate',
                    jpCost: 400,
                    description: 'Improves success rate of stealing abilities'
                },
                TRAP_MASTERY: {
                    name: 'Trap Mastery',
                    effect: ['extended_trap_detection', 'auto_disarm'],
                    jpCost: 450,
                    description: 'Enhances trap detection range and grants chance to auto-disarm'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.ARCHER]: 2
        };
    }
}
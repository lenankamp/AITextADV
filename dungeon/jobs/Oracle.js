import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class ORACLE extends JOBINTERFACE {
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
            [JOBS.WHITE_MAGE]: 2
        };
    }
}
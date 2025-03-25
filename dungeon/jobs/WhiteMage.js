import { JOBINTERFACE } from './JobInterface.js';
import { JOBS } from './constants.js';

export class WHITEMAGE extends JOBINTERFACE {
    static getDescription() {
        return "Primary healers and support specialists who wield holy magic. Masters of recovery magic, status ailment removal, and protective enchantments. Essential for party survival with powerful healing spells and defensive buffs. In dungeons, they excel at creating safe zones through purification magic and are particularly effective at dealing with undead threats and cursed areas.";
    }
    
    static getBaseStats() {
        return {
            hp: 85,
            mp: 90,
            pa: 4,
            ma: 10,
            sp: 6,
            ev: 5
        };
    }

    static getGrowthRates() {
        return {
            hp: 25,
            mp: 20,
            pa: 0.1,
            ma: 0.5,
            sp: 0.2,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'White Magic',
                abilities: {
                    CURE: {
                        name: 'Cure',
                        type: 'healing',
                        power: 1.8,
                        mp: 14,
                        jpCost: 200
                    },
                    CURA: {
                        name: 'Cura',
                        type: 'healing',
                        power: 2.4,
                        mp: 20,
                        jpCost: 400
                    },
                    CURAGA: {
                        name: 'Curaga',
                        type: 'healing',
                        power: 3.0,
                        aoe: true,
                        mp: 40,
                        jpCost: 600
                    },
                    RAISE: {
                        name: 'Raise',
                        type: 'healing',
                        effect: 'revive',
                        mp: 30,
                        jpCost: 500
                    },
                    RERAISE: {
                        name: 'Reraise',
                        type: 'buff',
                        effect: 'auto_revive',
                        mp: 40,
                        jpCost: 800
                    },
                    ESUNA: {
                        name: 'Esuna',
                        type: 'special',
                        mp: 18,
                        jpCost: 300
                    },
                    PROTECT: {
                        name: 'Protect',
                        type: 'buff',
                        effect: 'protect',
                        mp: 15,
                        jpCost: 250
                    },
                    SHELL: {
                        name: 'Shell',
                        type: 'buff',
                        effect: 'increase_magic_defense',
                        mp: 15,
                        jpCost: 250
                    },
                    HOLY: {
                        name: 'Holy',
                        type: 'magical',
                        element: 'holy',
                        power: 3.2,
                        mp: 56,
                        jpCost: 900
                    },
                    REGEN: {
                        name: 'Regen',
                        type: 'buff',
                        effect: 'heal_over_time',
                        mp: 22,
                        jpCost: 400
                    },
                    DISPEL: {
                        name: 'Dispel',
                        type: 'special',
                        mp: 25,
                        jpCost: 350
                    },
                    SACRED_PURIFICATION: {
                        name: 'Sacred Purification',
                        type: 'dungeon',
                        effect: ['purify_area', 'create_holy_barrier', 'cure_status'],
                        aoe: true,
                        mp: 38,
                        jpCost: 500,
                        description: 'Creates a purified holy zone that cleanses and protects'
                    },
                    BANISH: {
                        name: 'Banish',
                        type: 'magical',
                        element: 'holy',
                        power: 2.5,
                        effect: 'undead_repel',
                        mp: 30,
                        jpCost: 450,
                        description: 'Forces undead creatures to flee'
                    }
                }
            },
            reaction: {
                AUTO_REGEN: {
                    name: 'Auto-Regen',
                    chance: 0.4,
                    effect: 'regen',
                    jpCost: 400,
                    description: 'Chance to gain regen when damaged'
                },
                DIVINE_GRACE: {
                    name: 'Divine Grace',
                    chance: 0.25,
                    effect: 'enhance_healing',
                    jpCost: 450,
                    description: 'Chance to enhance healing received'
                }
            },
            support: {
                HEALING_BOOST: {
                    name: 'Healing Boost',
                    effect: 'increase_heal_power',
                    jpCost: 500,
                    description: 'Increases healing power'
                },
                MP_RECOVERY: {
                    name: 'MP Recovery',
                    effect: 'mp_regen_walking',
                    jpCost: 600,
                    description: 'Gradually restore MP while walking'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.CHEMIST]: 2
        };
    }
}
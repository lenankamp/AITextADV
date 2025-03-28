import { JobInterface, JOBS } from './index.js';

export class Bard extends JobInterface {
    static getDescription() {
        return "Musical specialists who empower allies and weaken foes through magical songs. Their varied repertoire includes defensive chants, restorative melodies, and disruptive harmonies. While their direct combat abilities are limited, their party-wide support capabilities and ability to inflict status effects make them invaluable strategists.";
    }

    static getBaseStats() {
        return {
            hp: 85,
            mp: 85,
            pa: 6,
            ma: 9,
            sp: 8,
            ev: 6
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 25,
            pa: 0.2,
            ma: 0.45,
            sp: 0.4,
            ev: 0.3
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Songs',
                abilities: {
                    BATTLE_CHANT: {
                        name: 'Battle Chant',
                        type: 'buff',
                        effect: 'protect',
                        aoe: true,
                        mp: 18,
                        jpCost: 200,
                        description: 'Increase party defense through song'
                    },
                    LIFE_SONG: {
                        name: 'Life Song',
                        type: 'buff',
                        effect: 'regen',
                        aoe: true,
                        mp: 22,
                        jpCost: 250,
                        description: 'Grant regeneration to party'
                    },
                    MANA_PAEAN: {
                        name: 'Mana Paean',
                        type: 'buff',
                        effect: 'mp_regen',
                        aoe: true,
                        mp: 25,
                        jpCost: 300,
                        description: 'Grant MP regeneration to party'
                    },
                    HERO_BALLAD: {
                        name: 'Hero Ballad',
                        type: 'buff',
                        effect: ['attack_up', 'protect'],
                        aoe: true,
                        mp: 35,
                        jpCost: 400,
                        description: 'Major boost to party combat stats'
                    },
                    SILENCE_SONG: {
                        name: 'Silence Song',
                        type: 'status',
                        effect: 'silence',
                        aoe: true,
                        mp: 28,
                        jpCost: 350,
                        description: 'Silence all enemies in range'
                    },
                    CONFUSION_CAROL: {
                        name: 'Confusion Carol',
                        type: 'status',
                        effect: 'confuse',
                        aoe: true,
                        mp: 30,
                        jpCost: 375,
                        description: 'Confuse enemies with discordant notes'
                    },
                    PEACEFUL_NOCTURNE: {
                        name: 'Peaceful Nocturne',
                        type: 'status',
                        effect: 'sleep',
                        aoe: true,
                        mp: 32,
                        jpCost: 400,
                        description: 'Put enemies to sleep with soothing melody'
                    },
                    NAMELESS_SONG: {
                        name: 'Nameless Song',
                        type: 'buff',
                        effect: 'random_buff',
                        aoe: true,
                        mp: 20,
                        jpCost: 300,
                        description: 'Grant random positive effects to party'
                    },
                    DISSONANT_WAVE: {
                        name: 'Dissonant Wave',
                        type: 'magical',
                        power: 2.0,
                        element: 'sonic',
                        aoe: true,
                        mp: 32,
                        jpCost: 450,
                        description: 'Damage enemies with sonic waves'
                    },
                    GRAND_FINALE: {
                        name: 'Grand Finale',
                        type: 'special',
                        power: 2.5,
                        aoe: true,
                        mp: 45,
                        jpCost: 500,
                        description: 'Powerful sonic attack that removes buffs'
                    }
                }
            },
            reaction: {
                PERFECT_PITCH: {
                    name: 'Perfect Pitch',
                    chance: 0.3,
                    effect: 'counter_with_song',
                    jpCost: 400,
                    description: 'Counter attacks with random song effect'
                },
                HARMONY_SHIELD: {
                    name: 'Harmony Shield',
                    chance: 0.35,
                    effect: 'shell',
                    jpCost: 450,
                    description: 'Reduce incoming magical damage'
                }
            },
            support: {
                SONG_MASTERY: {
                    name: 'Song Mastery',
                    effect: 'extend_song_duration',
                    jpCost: 500,
                    description: 'Increase duration of song effects'
                },
                RESONANCE: {
                    name: 'Resonance',
                    effect: 'enhance_song_power',
                    jpCost: 450,
                    description: 'Increase potency of song effects'
                },
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.WhiteMage]: 3,
            [JOBS.Oracle]: 2,
            [JOBS.Dancer]: 2
        };
    }

    // Track active songs and their effects
    static activeSongs = new Map();

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'GRAND_FINALE':
                return this._resolveGrandFinale(user, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolveMinuet(user, ability, target) {
        // Speed and accuracy enhancement song
        const stats = user.getStats();
        const songPower = Math.floor(stats.ma * ability.power);
        
        const effect = {
            name: 'minuet',
            duration: 3,
            power: songPower,
            bonuses: {
                speed: 1.2,
                accuracy: 1.15
            }
        };

        this._applySongEffect(target, effect);
        return {
            success: true,
            message: `${target.name} is energized by the minuet`,
            effects: [effect]
        };
    }

    static _resolveBattleSong(user, ability, target) {
        // Combat enhancement song
        const stats = user.getStats();
        const songPower = Math.floor(stats.ma * ability.power);

        const effect = {
            name: 'battle_song',
            duration: 4,
            power: songPower,
            bonuses: {
                attack: 1.3,
                defense: 1.1
            }
        };

        this._applySongEffect(target, effect);
        return {
            success: true,
            message: `${target.name}'s fighting spirit is bolstered`,
            effects: [effect]
        };
    }

    static _resolveRequiem(user, ability, target) {
        // Debuff song that weakens enemies
        const stats = user.getStats();
        const baseChance = 0.6 + ((stats.ma - target.level) * 0.05);
        const successRate = Math.min(0.9, Math.max(0.2, baseChance));

        if (Math.random() > successRate) {
            return {
                success: false,
                message: 'Target resists the requiem'
            };
        }

        const effect = {
            name: 'requiem',
            duration: 3,
            power: ability.power,
            penalties: {
                attack: 0.7,
                defense: 0.8,
                speed: 0.9
            }
        };

        this._applySongEffect(target, effect);
        return {
            success: true,
            message: `${target.name} is weakened by the somber melody`,
            effects: [effect]
        };
    }

    static _resolveFinale(user, ability, target) {
        // Powerful finishing move that consumes active song effects
        const activeEffects = this.activeSongs.get(target.id) || [];
        if (activeEffects.length === 0) {
            return {
                success: false,
                message: 'No active songs to consume'
            };
        }

        let totalPower = ability.power;
        activeEffects.forEach(effect => {
            totalPower += effect.power * 0.5;
        });

        const damage = Math.floor(user.getStats().ma * totalPower);
        target.status.hp = Math.max(0, target.status.hp - damage);

        // Clear all song effects after finale
        this.activeSongs.delete(target.id);

        return {
            success: true,
            damage,
            message: `${target.name} takes ${damage} damage from the dramatic finale`,
            consumedEffects: activeEffects.map(e => e.name)
        };
    }

    static _resolveGrandFinale(user, target) {
        // Find all active songs on allies and enemies
        const activeSongs = [...(target.status.effects || [])].filter(effect => 
            effect.source === 'song'
        );

        if (activeSongs.length === 0) {
            return {
                success: false,
                message: 'No active songs to consume'
            };
        }

        // Remove all active songs and convert their power into damage
        activeSongs.forEach(song => {
            target.removeEffect(song.type);
        });

        const baseDamage = Math.floor(user.getMA() * 2);
        const totalDamage = baseDamage * (1 + (activeSongs.length * 0.5));

        return {
            success: true,
            damage: totalDamage,
            message: `Grand Finale consumes ${activeSongs.length} songs for massive damage!`,
            effects: activeSongs.map(song => ({ type: `remove_${song.type}` }))
        };
    }

    static _applySongEffect(target, effect) {
        if (!target.id) {
            target.id = Math.random().toString(36).substr(2, 9);
        }

        let activeEffects = this.activeSongs.get(target.id) || [];
        // Remove any existing effect of the same type
        activeEffects = activeEffects.filter(e => e.name !== effect.name);
        // Add new effect
        activeEffects.push(effect);
        this.activeSongs.set(target.id, activeEffects);

        // Apply effect to target
        if (!target.isImmuneToEffect(effect.name)) {
            target.addEffect(effect);
        }
    }
}
import { JobInterface, JOBS } from './index.js';

export class Calculator extends JobInterface {
    static getDescription() {
        return "Tactical specialists who utilize mathematical principles to manipulate combat conditions. Their unique abilities allow them to target enemies based on numerical properties like height, level, and other statistical values. While complex to master, their ability to affect multiple targets simultaneously through mathematical calculations makes them powerful battlefield controllers.";
    }

    static getBaseStats() {
        return {
            hp: 85,
            mp: 100,
            pa: 6,
            ma: 10,
            sp: 5,
            ev: 4
        };
    }

    static getGrowthRates() {
        return {
            hp: 28,
            mp: 35,
            pa: 0.2,
            ma: 0.5,
            sp: 0.2,
            ev: 0.2
        };
    }

    static getAbilities() {
        return {
            active: {
                name: 'Arithmeticks',
                abilities: {
                    CT_PRIME: {
                        name: 'CT Prime',
                        type: 'special',
                        effect: 'prime_target',
                        mp: 25,
                        jpCost: 300,
                        description: 'Target units with prime CT values'
                    },
                    LEVEL_DIVIDE: {
                        name: 'Level Divide',
                        type: 'special',
                        effect: 'level_target',
                        mp: 28,
                        jpCost: 350,
                        description: 'Target units with divisible levels'
                    },
                    HEIGHT_FACTOR: {
                        name: 'Height Factor',
                        type: 'special',
                        effect: 'height_target',
                        mp: 30,
                        jpCost: 400,
                        description: 'Target units at specific height multiples'
                    },
                    MULTIPLY: {
                        name: 'Multiply',
                        type: 'special',
                        mp: 35,
                        jpCost: 450,
                        description: 'Multiply spell effects on valid targets'
                    },
                    PRIME_STRIKE: {
                        name: 'Prime Strike',
                        type: 'magical',
                        power: 2.0,
                        effect: 'prime_damage',
                        mp: 32,
                        jpCost: 500,
                        description: 'Deal damage based on prime numbers'
                    },
                    NUMERICAL_FORCE: {
                        name: 'Numerical Force',
                        type: 'special',
                        power: 1.8,
                        effect: 'number_based_damage',
                        mp: 30,
                        jpCost: 450,
                        description: 'Deal damage based on numerical properties'
                    },
                    FACTOR_BARRIER: {
                        name: 'Factor Barrier',
                        type: 'buff',
                        effect: 'numeric_shield',
                        mp: 38,
                        jpCost: 550,
                        description: 'Create barrier based on mathematical factors'
                    },
                    DIVIDE_MP: {
                        name: 'Divide MP',
                        type: 'special',
                        mp: 20,
                        jpCost: 400,
                        description: 'Divide target\'s MP by a factor'
                    },
                    PERFECT_NUMBER: {
                        name: 'Perfect Number',
                        type: 'buff',
                        effect: 'perfect_stats',
                        mp: 45,
                        jpCost: 600,
                        description: 'Optimize stats based on perfect numbers'
                    },
                    MODULO_MASTERY: {
                        name: 'Modulo Mastery',
                        type: 'magical',
                        power: 2.5,
                        effect: 'remainder_damage',
                        mp: 50,
                        jpCost: 700,
                        description: 'Ultimate number-based attack'
                    }
                }
            },
            reaction: {
                ABSORB_MP: {
                    name: 'Absorb MP',
                    chance: 0.3,
                    effect: 'mp_drain',
                    jpCost: 400,
                    description: 'Chance to drain MP when hit'
                },
                NUMERIC_GUARD: {
                    name: 'Numeric Guard',
                    chance: 0.25,
                    effect: 'number_defense',
                    jpCost: 450,
                    description: 'Reduce damage based on numerical properties'
                }
            },
            support: {
                ARCANE_MATH: {
                    name: 'Arcane Math',
                    effect: 'enhance_math_magic',
                    jpCost: 500,
                    description: 'Increase power of mathematical abilities'
                },
                QUICK_CALCULATE: {
                    name: 'Quick Calculate',
                    effect: 'reduce_cast_time',
                    jpCost: 400,
                    description: 'Reduce casting time of abilities'
                }
            }
        };
    }

    static getRequirements() {
        return {
            [JOBS.BlackMage]: 4,
            [JOBS.TimeMage]: 3,
            [JOBS.Oracle]: 3
        };
    }

    static resolveSpecialAbility(user, ability, target) {
        switch (ability.id) {
            case 'CT_PRIME':
                return this._resolvePrimeNumber(user, target, 'ct');
            case 'LEVEL_DIVIDE':
                return this._resolveDivisibleNumber(user, target, 'level');
            case 'HEIGHT_FACTOR':
                return this._resolveHeightFactor(user, target);
            case 'MULTIPLY':
                return this._resolveMultiply(user, ability, target);
            case 'NUMERICAL_FORCE':
                return this._resolveNumericalForce(user, target);
            case 'DIVIDE_MP':
                return this._resolveDivideMP(user, target);
            default:
                throw new Error(`Unknown special ability: ${ability.id}`);
        }
    }

    static _resolvePrimeNumber(user, target, attribute) {
        const value = target[attribute];
        if (this._isPrime(value)) {
            return {
                success: true,
                damage: Math.floor(user.getMA() * 2.5),
                message: `${target.name}'s ${attribute} value is prime!`
            };
        }
        return {
            success: false,
            message: `${target.name}'s ${attribute} value is not prime`
        };
    }

    static _resolveDivisibleNumber(user, target, attribute) {
        const value = target[attribute];
        if (value % 4 === 0 || value % 5 === 0) {
            return {
                success: true,
                damage: Math.floor(user.getMA() * 2),
                message: `${target.name}'s ${attribute} is divisible by 4 or 5!`
            };
        }
        return {
            success: false,
            message: `${target.name}'s ${attribute} is not divisible by 4 or 5`
        };
    }

    static _resolveHeightFactor(user, target) {
        const heightDiff = Math.abs(user.height - target.height);
        if (heightDiff > 0) {
            return {
                success: true,
                damage: Math.floor(user.getMA() * (heightDiff * 0.5)),
                message: `Height difference of ${heightDiff} affects damage!`
            };
        }
        return {
            success: false,
            message: 'No height difference to exploit'
        };
    }

    static _resolveMultiply(user, ability, target) {
        const baseDamage = Math.floor(user.getMA() * 1.5);
        return {
            success: true,
            damage: baseDamage * 2,
            effects: [
                { type: 'magic_vulnerability', duration: 3 }
            ],
            message: 'Magical damage multiplied!'
        };
    }

    static _resolveNumericalForce(user, target) {
        // Damage based on last digit of target's HP
        const lastDigit = target.status.hp % 10;
        return {
            success: true,
            damage: Math.floor(user.getMA() * (1 + lastDigit * 0.1)),
            message: `Damage calculated from HP's last digit: ${lastDigit}`
        };
    }

    static _resolveDivideMP(user, target) {
        const currentMP = target.status.mp;
        const reduction = Math.floor(currentMP / 2);
        target.status.mp -= reduction;
        return {
            success: true,
            message: `Reduced target's MP by half (${reduction})`,
            effects: [
                { type: 'mp_reduced', value: reduction }
            ]
        };
    }

    static _isPrime(num) {
        if (num <= 1) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }

    static _resolveCTSpell(user, ability, target) {
        // Check if target's CT matches condition
        const targetCT = target.status.ct || 0;
        if (targetCT % ability.ctMultiple !== 0) {
            return {
                success: false,
                message: 'Target CT does not match condition'
            };
        }

        // Apply the spell effect
        const damage = Math.floor(user.getStats().ma * ability.power);
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            effects: ability.effects || []
        };
    }

    static _resolveLevelSpell(user, ability, target) {
        // Check if target's level matches condition
        if (target.level % ability.levelMultiple !== 0) {
            return {
                success: false,
                message: 'Target level does not match condition'
            };
        }

        // Apply the spell effect
        const damage = Math.floor(user.getStats().ma * ability.power);
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            effects: ability.effects || []
        };
    }

    static _resolvePrimeSpell(user, ability, target) {
        // Check if target's level is prime
        const isPrime = this._isPrimeNumber(target.level);
        if (!isPrime) {
            return {
                success: false,
                message: 'Target level is not prime'
            };
        }

        // Apply the spell effect
        const damage = Math.floor(user.getStats().ma * ability.power);
        target.status.hp = Math.max(0, target.status.hp - damage);

        return {
            success: true,
            damage,
            effects: ability.effects || []
        };
    }

    static _isPrimeNumber(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;

        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }
}
import { Equipment } from './Equipment.js';
import { EQUIPMENT_TYPES, WEAPON_TYPES, TWO_HANDED_WEAPONS, RANGED_WEAPONS, WEAPON_DAMAGE_FORMULAS } from './index.js';

export class Weapon extends Equipment {
    constructor(config) {
        super({
            ...config,
            type: EQUIPMENT_TYPES.WEAPON
        });
        
        this.weaponType = config.weaponType;
        this.isTwoHanded = TWO_HANDED_WEAPONS.has(config.weaponType);
        this.isRanged = RANGED_WEAPONS.has(config.weaponType);
        this.accuracy = config.accuracy || 100;
        this.damageFormula = WEAPON_DAMAGE_FORMULAS[config.weaponType];
    }

    calculateDamage(stats) {
        if (!this.damageFormula) {
            return stats.pa; // Fallback to basic physical attack
        }
        return this.damageFormula(stats);
    }

    isValidForSlot(slot, character) {
        // If it's two-handed, it must be equipped in main hand and off-hand must be empty
        if (this.isTwoHanded) {
            if (slot === 'mainHand') {
                return !character.equipment.offHand;
            }
            return false;
        }

        // One-handed weapons can go in either hand if character has dual wield
        const hasDualWield = character.abilities.support.some(ability => 
            ability.name === 'Dual Wield');
            
        if (slot === 'offHand' && !hasDualWield) {
            return false;
        }

        return true;
    }

    getAccuracy() {
        return this.accuracy;
    }

    modifyDamage(baseDamage) {
        // Apply any weapon-specific damage modifiers
        let damage = baseDamage;
        
        // Apply effects that modify damage
        this.effects.forEach(effect => {
            if (effect.type === 'damage_modifier') {
                damage *= effect.value;
            }
        });

        return Math.floor(damage);
    }
}
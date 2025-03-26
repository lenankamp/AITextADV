import { Equipment } from './Equipment.js';
import { EQUIPMENT_TYPES, EQUIPMENT_SLOTS, WEAPON_TYPES, TWO_HANDED_WEAPONS, RANGED_WEAPONS, WEAPON_DAMAGE_FORMULAS } from './index.js';

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
        if (!stats || !this.damageFormula) {
            return stats?.pa || 0; // Fallback to basic physical attack
        }
        return Math.max(0, Math.floor(this.damageFormula(stats)));
    }

    isValidForSlot(slot, character) {
        // If it's two-handed, it must be equipped in main hand and off-hand must be empty
        if (this.isTwoHanded) {
            if (slot === EQUIPMENT_SLOTS.MAIN_HAND) {
                return !character.equipment[EQUIPMENT_SLOTS.OFF_HAND];
            }
            return false;
        }

        // One-handed weapons can go in either hand if character has dual wield
        const abilities = character.getSupportAbilities();
        const hasDualWield = abilities.some(ability => 
            ability.effect === 'enable_dual_wielding');
            
        if (slot === EQUIPMENT_SLOTS.OFF_HAND && !hasDualWield) {
            return false;
        }

        return slot === EQUIPMENT_SLOTS.MAIN_HAND || slot === EQUIPMENT_SLOTS.OFF_HAND;
    }

    getAccuracy() {
        return this.accuracy;
    }

    modifyDamage(baseDamage) {
        // Apply any weapon-specific damage modifiers
        let damage = baseDamage;
        
        // Apply effects that modify damage
        if (this.effects) {
            this.effects.forEach(effect => {
                if (effect === 'critical_up') {
                    damage *= 1.5;
                }
            });
        }

        return Math.floor(damage);
    }
}
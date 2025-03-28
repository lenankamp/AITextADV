import { Equipment } from './Equipment.js';
import { EQUIPMENT_TYPES, ARMOR_TYPES, EQUIPMENT_SLOTS } from './index.js';

export class Armor extends Equipment {
    constructor(config) {
        super({
            ...config,
            type: config.isAccessory ? EQUIPMENT_TYPES.ACCESSORY : EQUIPMENT_TYPES.ARMOR
        });
        
        this.armorType = config.armorType;
        this.validSlots = this._determineValidSlots(config.armorType, config.isAccessory);
        this.weight = config.weight || 'medium'; // light, medium, heavy
        this.evasionModifier = config.evasionModifier || 0;
    }

    _determineValidSlots(armorType, isAccessory) {
        if (isAccessory) {
            return [EQUIPMENT_SLOTS.ACCESSORY];
        }

        switch (armorType) {
            case ARMOR_TYPES.SHIELD:
                return [EQUIPMENT_SLOTS.OFF_HAND];
            case ARMOR_TYPES.HELM:
            case ARMOR_TYPES.HAT:
            case ARMOR_TYPES.RIBBON:
                return [EQUIPMENT_SLOTS.HEAD];
            case ARMOR_TYPES.HEAVY_ARMOR:
            case ARMOR_TYPES.LIGHT_ARMOR:
            case ARMOR_TYPES.ROBE:
                return [EQUIPMENT_SLOTS.BODY];
            default:
                return [];
        }
    }

    isValidForSlot(slot, character) {
        // Check if this slot is valid for this armor type
        if (!this.validSlots.includes(slot)) {
            return false;
        }

        // For shield, check if character has a two-handed weapon
        if (this.armorType === ARMOR_TYPES.SHIELD) {
            const mainHandWeapon = character.equipment[EQUIPMENT_SLOTS.MAIN_HAND];
            if (mainHandWeapon && mainHandWeapon.isTwoHanded) {
                return false;
            }
        }

        // Check weight restrictions based on job
        const heavyArmorJobs = ['Knight', 'Dragoon'];
        if (this.weight === 'heavy' && !heavyArmorJobs.includes(character.currentJob)) {
            return false;
        }

        return true;
    }

    getEvasionModifier() {
        return this.evasionModifier;
    }

    modifyIncomingDamage(damage, damageType) {
        let modifiedDamage = damage;
        
        // Apply special effects that modify incoming damage
        this.effects.forEach(effect => {
            if (effect.type === 'damage_reduction') {
                if (!effect.damageType || effect.damageType === damageType) {
                    modifiedDamage *= (1 - effect.value);
                }
            }
        });

        return Math.floor(modifiedDamage);
    }
}
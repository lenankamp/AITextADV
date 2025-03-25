export const EQUIPMENT_SLOTS = {
    MAIN_HAND: 'mainHand',
    OFF_HAND: 'offHand',
    HEAD: 'head',
    BODY: 'body',
    ACCESSORY: 'accessory'
};

export const EQUIPMENT_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    ACCESSORY: 'accessory'
};

export const WEAPON_TYPES = {
    KNIFE: 'knife',
    STAFF: 'staff',
    POLEARM: 'polearm',
    NINJA_BLADE: 'ninjaBlade',
    FLAIL: 'flail',
    POLE: 'pole',
    SWORD: 'sword',
    GUN: 'gun',
    CLOTH: 'cloth',
    CROSSBOW: 'crossbow',
    KATANA: 'katana',
    BOW: 'bow',
    AXE: 'axe',
    INSTRUMENT: 'instrument',
    ROD: 'rod',
    BOOK: 'book'
};

export const ARMOR_TYPES = {
    HEAVY_ARMOR: 'heavyArmor',
    LIGHT_ARMOR: 'lightArmor',
    ROBE: 'robe',
    SHIELD: 'shield',
    HELM: 'helm',
    HAT: 'hat',
    RIBBON: 'ribbon'
};

// Define which weapons are two-handed
export const TWO_HANDED_WEAPONS = new Set([
    WEAPON_TYPES.POLEARM,
    WEAPON_TYPES.STAFF,
    WEAPON_TYPES.BOW,
    WEAPON_TYPES.CROSSBOW
]);

// Define which weapons are ranged
export const RANGED_WEAPONS = new Set([
    WEAPON_TYPES.GUN,
    WEAPON_TYPES.CROSSBOW,
    WEAPON_TYPES.BOW,
    WEAPON_TYPES.INSTRUMENT,
    WEAPON_TYPES.BOOK
]);

// Define damage formulas for each weapon type
export const WEAPON_DAMAGE_FORMULAS = {
    [WEAPON_TYPES.KNIFE]: (stats) => stats.pa + Math.floor(stats.sp / 2),
    [WEAPON_TYPES.STAFF]: (stats) => stats.ma,
    [WEAPON_TYPES.POLEARM]: (stats) => stats.pa,
    [WEAPON_TYPES.NINJA_BLADE]: (stats) => stats.pa + Math.floor(stats.sp / 2),
    [WEAPON_TYPES.FLAIL]: (stats) => stats.pa,
    [WEAPON_TYPES.POLE]: (stats) => stats.pa,
    [WEAPON_TYPES.SWORD]: (stats) => stats.pa,
    [WEAPON_TYPES.GUN]: (stats) => stats.pa + Math.floor(stats.sp / 2),
    [WEAPON_TYPES.CLOTH]: (stats) => stats.pa + Math.floor(stats.ma / 2),
    [WEAPON_TYPES.CROSSBOW]: (stats) => stats.pa + Math.floor(stats.sp / 2),
    [WEAPON_TYPES.KATANA]: (stats) => stats.pa,
    [WEAPON_TYPES.BOW]: (stats) => stats.pa + Math.floor(stats.sp / 2),
    [WEAPON_TYPES.AXE]: (stats) => stats.pa,
    [WEAPON_TYPES.INSTRUMENT]: (stats) => Math.floor(stats.pa / 2 + stats.sp / 2),
    [WEAPON_TYPES.ROD]: (stats) => stats.pa,
    [WEAPON_TYPES.BOOK]: (stats) => stats.pa + Math.floor(stats.ma / 2)
};

// Equipment class exports
export { Equipment } from './Equipment.js';
export { Weapon } from './Weapon.js';
export { Armor } from './Armor.js';
/**
 * @interface JobInterface
 * @description Template for all job classes
 * @property {function} getDescription - Returns job description
 * @property {function} getBaseStats - Returns base stats object
 * @property {function} getGrowthRates - Returns growth rates object
 * @property {function} getAbilities - Returns abilities object
 * @property {function} getRequirements - Returns job requirements
 */
export { JobInterface } from './JobInterface.js';

export const JOBS = {
    // Base Jobs
    Squire: 'Squire',
    Chemist: 'Chemist',

    // Tier 2 Jobs
    Knight: 'Knight',
    Archer: 'Archer',
    WhiteMage: 'WhiteMage',
    BlackMage: 'BlackMage',

    // Tier 3 Jobs
    Monk: 'Monk',
    Thief: 'Thief',
    Oracle: 'Oracle',
    TimeMage: 'TimeMage',

    // Tier 4 Jobs
    Geomancer: 'Geomancer',
    Dragoon: 'Dragoon',
    Summoner: 'Summoner',
    Orator: 'Orator',

    // Advanced Jobs
    Samurai: 'Samurai',
    Ninja: 'Ninja',
    Calculator: 'Calculator',
    Dancer: 'Dancer',
    Bard: 'Bard',

    // Special Job
    Mime: 'Mime'
};

// Base Jobs
export { Squire } from './Squire.js';
export { Chemist } from './Chemist.js';

// Tier 2 Jobs
export { Knight } from './Knight.js';
export { Archer } from './Archer.js';
export { WhiteMage } from './WhiteMage.js';
export { BlackMage } from './BlackMage.js';

// Tier 3 Jobs
export { Monk } from './Monk.js';
export { Thief } from './Thief.js';
export { Oracle } from './Oracle.js';
export { TimeMage } from './TimeMage.js';

// Tier 4 Jobs
export { Geomancer } from './Geomancer.js';
export { Dragoon } from './Dragoon.js';
export { Summoner } from './Summoner.js';
export { Orator } from './Orator.js';

// Advanced Jobs
export { Samurai } from './Samurai.js';
export { Ninja } from './Ninja.js';
export { Calculator } from './Calculator.js';
export { Dancer } from './Dancer.js';
export { Bard } from './Bard.js';

// Special Job
export { Mime } from './Mime.js';
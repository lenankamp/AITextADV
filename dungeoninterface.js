let dungeonExplorer = null;
let currentJobArt = {};

async function initDungeonManager() {
    if (dungeonManager) {
        dungeonManager.cleanup();
    }
    
    dungeonManager = new DungeonManager();

    // Import the Party and Character classes
    const { Party } = await import('./dungeon/combat.js');
    const { Character } = await import('./dungeon/character.js');
    
    // Create a new party
    const party = new Party();
    
    // Create main character from player data
    const mainChar = new Character(settings.player_name);
    mainChar.currentJob = 'Squire'; // Set starting job
    party.addMember(mainChar);
    mainChar.description = settings.player_description;
    mainChar.seed = settings.player_seed;

    // Add followers as party members
    for (const follower of followers) {
        const followerChar = new Character(follower.name);
        followerChar.currentJob = 'Squire';
        party.addMember(followerChar);
        followerChar.description = follower.description;
        followerChar.seed = follower.seed;
    }

    // Set party position and facing
    party.position = { x: 0, y: 0 };
    party.facing = 'north';

    // Initialize dungeon manager with proper party
    dungeonManager.party = party;
    await dungeonManager.initialize();
    
    // Show the dungeon interface
    dungeonManager.show();
}

class DungeonManager {
    constructor() {
        this.party = null;
        this.overlay = null;
        this.currentJob = 'Squire'; // Default starting job
        this.mapZoom = 1;
        this.mapOffset = { x: 0, y: 0 };

        // Add tile type mapping
        this.TILE_CLASSES = {
            0: 'wall',      // WALL
            1: 'floor',     // FLOOR
            2: 'entrance',  // ENTRANCE
            3: 'exit',      // EXIT
            4: 'door',      // DOOR
            5: 'door',      // SECRET_DOOR
            6: 'chest',     // CHEST
            7: 'trap'       // TRAP
        };
    }

    async initialize() {
        // Import required modules dynamically
        const { DungeonExplorer } = await import('./dungeon/DungeonExplorer.js');
        const { Dungeon } = await import('./dungeon/dungeon.js');
        
        // Create a new dungeon
        const dungeon = new Dungeon({
            width: 50,
            height: 50,
            floors: 5,
            minRoomSize: 5,
            maxRoomSize: 10,
            roomAttempts: 50
        });
        dungeon.generate();
        
        // Initialize dungeon explorer with party
        dungeonExplorer = new DungeonExplorer(this.party);
        dungeonExplorer.enterDungeon(dungeon);
        
        // Create and setup the overlay
        this.createOverlay();
        this.setupEventListeners();
        
        // Generate initial job art
        await this.updateJobArt(this.currentJob);

        // Initial view updates
        this.updateView();
        this.updateMap();
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'dungeon-overlay';
        overlay.innerHTML = `
            <div class="dungeon-content">
                <div class="dungeon-left">
                    <div class="dungeon-view">
                        <!-- 3D or 2D representation of current tile -->
                    </div>
                    <div class="party-container">
                        <div class="party-portraits"></div>
                        <div class="party-stats"></div>
                    </div>
                </div>
                <div class="dungeon-right">
                    <div class="dungeon-menu" style="display: none;">
                        <button class="menu-btn" data-action="resume">Resume</button>
                        <button class="menu-btn" data-action="save">Save</button>
                        <button class="menu-btn" data-action="load">Load</button>
                        <button class="menu-btn" data-action="quit">Exit Dungeon</button>
                    </div>
                    <div class="dungeon-actions">
                        <button class="action-btn" data-action="move-forward">Forward</button>
                        <button class="action-btn" data-action="turn-left">Turn Left</button>
                        <button class="action-btn" data-action="turn-right">Turn Right</button>
                        <button class="action-btn" data-action="move-back">Back</button>
                        <button class="action-btn" data-action="open-menu">Menu</button>
                    </div>
                    <div class="dungeon-map-container">
                        <canvas id="dungeonMap" width="400" height="400"></canvas>
                        <div class="map-controls">
                            <button class="map-btn" data-action="zoom-in">+</button>
                            <button class="map-btn" data-action="zoom-out">-</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('.content').appendChild(overlay);
        this.overlay = overlay;
    }

    setupEventListeners() {
        // Movement controls - handle relative to facing direction
        const getDirectionBasedOnFacing = (action, facing) => {
            const directions = {
                'north': { forward: 'north', back: 'south', left: 'west', right: 'east' },
                'south': { forward: 'south', back: 'north', left: 'east', right: 'west' },
                'east': { forward: 'east', back: 'west', left: 'north', right: 'south' },
                'west': { forward: 'west', back: 'east', left: 'south', right: 'north' }
            };
            return directions[facing][action];
        };

        this.overlay.querySelector('[data-action="move-forward"]').addEventListener('click', () => {
            const facing = this.party.facing;
            this.move(getDirectionBasedOnFacing('forward', facing));
        });

        this.overlay.querySelector('[data-action="move-back"]').addEventListener('click', () => {
            const facing = this.party.facing;
            this.move(getDirectionBasedOnFacing('back', facing));
        });

        this.overlay.querySelector('[data-action="turn-left"]').addEventListener('click', () => {
            const facing = this.party.facing;
            this.rotate(getDirectionBasedOnFacing('left', facing));
        });

        this.overlay.querySelector('[data-action="turn-right"]').addEventListener('click', () => {
            const facing = this.party.facing;
            this.rotate(getDirectionBasedOnFacing('right', facing));
        });

        // Menu button
        this.overlay.querySelector('[data-action="open-menu"]').addEventListener('click', () => {
            const menu = this.overlay.querySelector('.dungeon-menu');
            menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
        });

        // Menu actions
        this.overlay.querySelector('[data-action="resume"]').addEventListener('click', () => {
            this.overlay.querySelector('.dungeon-menu').style.display = 'none';
        });

        this.overlay.querySelector('[data-action="quit"]').addEventListener('click', () => {
            this.cleanup();
            this.hide();
        });

        // Map controls
        const mapContainer = this.overlay.querySelector('.dungeon-map-container');
        const canvas = mapContainer.querySelector('#dungeonMap');

        // Zoom controls
        mapContainer.querySelector('[data-action="zoom-in"]').addEventListener('click', () => this.zoomMap(1.2));
        mapContainer.querySelector('[data-action="zoom-out"]').addEventListener('click', () => this.zoomMap(0.8));

        // Pan controls
        let isDragging = false;
        let lastPosition = { x: 0, y: 0 };

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastPosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - lastPosition.x;
            const deltaY = e.clientY - lastPosition.y;
            this.panMap(deltaX, deltaY);
            lastPosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mouseup', () => isDragging = false);
        canvas.addEventListener('mouseleave', () => isDragging = false);

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        canvas.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - lastPosition.x;
            const deltaY = e.touches[0].clientY - lastPosition.y;
            this.panMap(deltaX, deltaY);
            lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });

        canvas.addEventListener('touchend', () => isDragging = false);

        // Character portrait event listeners
        const portraitContainer = this.overlay.querySelector('.party-portraits');
        portraitContainer.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            const portrait = e.target.closest('.main-character-portrait, .follower-portrait');
            if (!portrait) {
                console.log('No portrait element found');
                return;
            }

            console.log('Portrait clicked:', portrait);
            console.log('Portrait dataset:', portrait.dataset);
            
            const charName = portrait.dataset.name;
            console.log('Looking for character with name:', charName);

            const character = this.party.members.find(m => m.name === charName);
            console.log('Found character:', character);

            if (character) {
                const rect = portrait.getBoundingClientRect();
                console.log('Showing submenu at position:', rect.right, rect.top);
                this.showCharacterSubmenu(character, rect.right, rect.top);
            } else {
                console.log('No character found with name:', charName);
            }
        });

        // Close submenu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.character-submenu') && 
                !e.target.closest('.party-portraits')) {
                const submenu = document.querySelector('.character-submenu');
                if (submenu) {
                    submenu.remove();
                }
            }
        });
    }

    async updateJobArt() {
        const portraitContainer = this.overlay.querySelector('.party-portraits');
        portraitContainer.innerHTML = ''; // Clear existing portraits
    
        // Create main character portrait
        const mainChar = this.party.members[0];
        const mainCharKey = `${mainChar.name}_${mainChar.currentJob}`;
        
        if (!currentJobArt[mainCharKey]) {
            const artPrompt = `${settings.person_prompt}, (final fantasy tactics costume, (${this.jobPrompt(mainChar.currentJob.toLowerCase())})), clothes, black background, standing, facing viewer, ${mainChar.description || ''}`;
            const artBlob = await generateArt(artPrompt, "", mainChar.seed);
            if (artBlob instanceof Blob) {
                currentJobArt[mainCharKey] = URL.createObjectURL(artBlob);
            }
        }
    
        const mainPortrait = document.createElement('div');
        mainPortrait.className = 'main-character-portrait';
        mainPortrait.style.backgroundImage = `url(${currentJobArt[mainCharKey]})`;
        mainPortrait.dataset.name = mainChar.name;
        portraitContainer.appendChild(mainPortrait);
    
        // Add follower portraits
        for (let i = 1; i < this.party.members.length; i++) {
            const member = this.party.members[i];
            const followerKey = `${member.name}_${member.currentJob}`;
            
            if (!currentJobArt[followerKey]) {
                const artPrompt = `${settings.person_prompt}, (final fantasy tactics costume, (${this.jobPrompt(member.currentJob.toLowerCase())})), clothes, black background, standing, facing viewer, ${member.description || ''}`;
                const artBlob = await generateArt(artPrompt, "", member.seed);
                if (artBlob instanceof Blob) {
                    currentJobArt[followerKey] = URL.createObjectURL(artBlob);
                }
            }
    
            const followerPortrait = document.createElement('div');
            followerPortrait.className = 'follower-portrait';
            followerPortrait.style.backgroundImage = `url(${currentJobArt[followerKey]})`;
            followerPortrait.dataset.name = member.name;
            portraitContainer.appendChild(followerPortrait);
        }
    }

    jobPrompt(job) {
        switch(job) {
            case 'squire': return 'squire, sword, leather armor';
            case 'chemist': return 'chemist, potions, medic';
            case 'knight': return 'knight, heavy armor, sword';
            case 'archer': return 'archer, bow and quiver';
            case 'white mage': return 'white mage, hood, hooded white robe, wooden staff';
            case 'black mage': return 'black mage, rod, wizard hat and black robe';
            case 'monk': return 'martial artist, pugilist, fists';
            case 'thief': return 'Thief, bandanna, dagger, leather shorts';
            case 'oracle': return 'Oracle, prophet, yellow robe, fancy jewelery';
            case 'time mage': return 'Time Mage, silly hat, purple robe';
            case 'geomancer': return 'Geomancer, brown poncho';
            case 'dragoon': return 'purple dragon armor, spear, lancer, helmet';
            case 'summoner': return 'Summoner, pointy hat, green robe';
            case 'orator': return 'diplomat, goofy hat, long pink dress';
            case 'samurai': return 'red samurai armor, banded genji, katana';
            case 'ninja': return 'Ninja, scarf, blades';
            case 'calculator': return 'glasses, scientist, blue robe, abacus';
            case 'dancer': return 'Dancer, scarf, ruffled dress';
            case 'bard': return 'bard, musical instrument';
            case 'mime': return 'Mime, mask, face paint, vibrant colors';
            default: return 'fantasy character portrait, squire class, rpg game style';
        }
    }
    

    move(direction) {
        if (!dungeonExplorer) return;
        const result = dungeonExplorer.move(direction);
        if (result.success) {
            this.updateView();
            this.updateMap();
        }
    }

    rotate(direction) {
        if (!dungeonExplorer) return;
        const result = dungeonExplorer.rotate(direction);
        if (result.success) {
            this.updateView();
        }
    }

    zoomMap(factor) {
        this.mapZoom = Math.max(0.5, Math.min(3, this.mapZoom * factor));
        this.updateMap();
    }

    panMap(deltaX, deltaY) {
        this.mapOffset.x += deltaX;
        this.mapOffset.y += deltaY;
        this.updateMap();
    }

    updateView() {
        if (!dungeonExplorer) return;
        const floorInfo = dungeonExplorer.getFloorInfo();
        const visibleTiles = dungeonExplorer.getVisibleTiles();
        const viewContainer = this.overlay.querySelector('.dungeon-view');
        
        // Create a visual representation of the visible tiles
        viewContainer.innerHTML = '';
        const tileDisplay = document.createElement('div');
        tileDisplay.className = 'tile-display';
        
        // Create a grid of visible tiles
        visibleTiles.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = `dungeon-tile ${this.TILE_CLASSES[tile.type] || 'floor'}`;
            tileDisplay.appendChild(tileElement);
        });
        
        viewContainer.appendChild(tileDisplay);
    }

    updateMap() {
        if (!dungeonExplorer) return;
        const canvas = this.overlay.querySelector('#dungeonMap');
        const ctx = canvas.getContext('2d');
        const mapInfo = dungeonExplorer.getRevealedMap();
        
        if (!mapInfo) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan transformations
        ctx.save();
        ctx.translate(this.mapOffset.x, this.mapOffset.y);
        ctx.scale(this.mapZoom, this.mapZoom);
        
        // Calculate tile size based on map dimensions
        const tileSize = Math.min(
            canvas.width / mapInfo.width,
            canvas.height / mapInfo.height
        );

        // Draw revealed tiles
        mapInfo.tiles.forEach(tile => {
            ctx.fillStyle = this.getTileColor(tile.type);
            ctx.fillRect(
                tile.x * tileSize,
                tile.y * tileSize,
                tileSize,
                tileSize
            );
        });

        // Draw revealed rooms
        mapInfo.revealedRooms.forEach(room => {
            ctx.strokeStyle = '#666';
            ctx.strokeRect(
                room.x * tileSize,
                room.y * tileSize,
                room.width * tileSize,
                room.height * tileSize
            );
        });

        // Draw player position
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(
            mapInfo.playerPosition.x * tileSize + tileSize/2,
            mapInfo.playerPosition.y * tileSize + tileSize/2,
            tileSize/3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw player facing direction
        ctx.strokeStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(
            mapInfo.playerPosition.x * tileSize + tileSize/2,
            mapInfo.playerPosition.y * tileSize + tileSize/2
        );
        let endX = mapInfo.playerPosition.x * tileSize + tileSize/2;
        let endY = mapInfo.playerPosition.y * tileSize + tileSize/2;
        switch(mapInfo.playerFacing) {
            case 'north': endY -= tileSize/2; break;
            case 'south': endY += tileSize/2; break;
            case 'east': endX += tileSize/2; break;
            case 'west': endX -= tileSize/2; break;
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.restore();
    }

    getTileColor(tileType) {
        // Map numeric tile types to colors
        const tileColors = {
            0: '#333', // WALL
            1: '#666', // FLOOR
            2: '#4a9eff', // ENTRANCE 
            3: '#3c3', // EXIT
            4: '#963', // DOOR
            5: '#963', // SECRET_DOOR
            6: '#fc0', // CHEST
            7: '#c33'  // TRAP
        };
        return tileColors[tileType] || '#000';
    }

    // Helper method to clean up resources when leaving dungeon mode
    cleanup() {
        // Clean up any existing character submenu
        const existingMenu = document.querySelector('.character-submenu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Revoke object URLs for job art
        Object.values(currentJobArt).forEach(url => {
            URL.revokeObjectURL(url);
        });
        currentJobArt = {};
        
        // Remove the overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        dungeonExplorer = null;
    }

    showCharacterSubmenu(character, x, y) {
        // Remove any existing submenus
        const existingSubmenu = document.querySelector('.character-submenu');
        if (existingSubmenu) {
            console.log('Removing existing submenu');
            existingSubmenu.remove();
        }

        console.log('Creating new submenu for character:', character);
        const submenu = document.createElement('div');
        submenu.className = 'character-submenu';
        
        // Get character stats and abilities
        const stats = character.getStats();
        const abilities = character.getAvailableAbilities();
        const status = character.status;
        const currentJob = character.currentJob;
        
        // Calculate health and mana percentages using proper max values
        const hpPercent = (status.hp / stats.hp) * 100;
        const mpPercent = (status.mp / stats.hp) * 100;

        submenu.innerHTML = `
            <div class="stats-section">
                <div class="stat-row">
                    <div class="stat-label">HP:</div>
                    <div class="health-bar">
                        <div style="width: ${hpPercent}%"></div>
                    </div>
                    <div class="stat-value">${status.hp}/${stats.hp}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">MP:</div>
                    <div class="mana-bar">
                        <div style="width: ${mpPercent}%"></div>
                    </div>
                    <div class="stat-value">${status.mp}/${stats.mp}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">PA:</div>
                    <div class="stat-value">${stats.pa}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">MA:</div>
                    <div class="stat-value">${stats.ma}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">SP:</div>
                    <div class="stat-value">${stats.sp}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">EV:</div>
                    <div class="stat-value">${stats.ev}</div>
                </div>
                <div class="status-effects">
                    ${this.renderStatusEffects(status.effects)}
                </div>
            </div>

            <div class="job-section">
                <div class="job-title">Current Job: ${currentJob}</div>
                <div class="job-list">
                    ${this.renderJobOptions(character)}
                </div>
            </div>

            <div class="abilities-section">
                <div class="ability-list">
                    ${this.renderAbilities(abilities)}
                </div>
            </div>`;


        document.body.appendChild(submenu);
        
        // Force reflow then add visible class for animation
        submenu.classList.add('visible');

        // Position the submenu
        submenu.style.position = 'fixed';
        submenu.style.left = `${x}px`;
        submenu.style.top = `${y}px`;

        // Add job change event listeners
        submenu.querySelectorAll('.job-option').forEach(option => {
            option.addEventListener('click', async () => {
                const newJob = option.dataset.job;
                const result = await dungeonExplorer.changeJob(character, newJob);
                if (result.success) {
                    await this.updateJobArt(newJob);
                    this.showCharacterSubmenu(character, x, y); // Refresh submenu
                }
            });
        });
    
        // Add ability use event listeners
        submenu.querySelectorAll('.ability-item').forEach(item => {
            item.addEventListener('click', () => {
                const ability = abilities.active[item.dataset.index];
                if (ability && (!ability.mp || ability.mp <= status.mp)) {
                    this.useAbility(character, ability);
                    this.showCharacterSubmenu(character, x, y); // Refresh submenu
                }
            });
        });
    
        // Adjust position if submenu goes off screen
        const rect = submenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            submenu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            submenu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    
        // Add click outside handler to close submenu
        const closeHandler = (e) => {
            if (!submenu.contains(e.target) && !e.target.closest('.party-portraits')) {
                submenu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }

    renderJobOptions(character) {
        const availableJobs = Object.values({
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
        }).filter(jobId => character.canChangeToJob(jobId));

        return availableJobs.map(jobId => {
            const JobClass = character.getJobClass(jobId);
            const jobData = character.jobs[jobId];
            const jobLevel = jobData ? jobData.level : 0;
            const jobJp = jobData ? jobData.jp : 0;
            
            return `
                <div class="job-option ${jobId === character.currentJob ? 'current' : ''}" 
                     data-job="${jobId}">
                    <div class="job-name">${jobId}</div>
                    ${jobLevel > 0 ? `
                        <div class="job-stats">
                            <span>Level ${jobLevel}</span>
                            <span>JP: ${jobJp}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderCharacterStats(character) {
        const stats = character.getStats();
        const maxHp = character.getMaxHP();
        const maxMp = character.getMaxMP();

        return `
            <div class="character-stats">
                <div class="stat">HP: ${character.status.hp}/${maxHp}</div>
                <div class="stat">MP: ${character.status.mp}/${maxMp}</div>
                <div class="stat">PA: ${stats.pa}</div>
                <div class="stat">MA: ${stats.ma}</div>
                <div class="stat">SP: ${stats.sp}</div>
                <div class="stat">EV: ${stats.ev}</div>
            </div>
        `;
    }

    renderStatusEffects(effects) {
        if (!effects || effects.length === 0) {
            return '<div class="no-effects">No active effects</div>';
        }
        return effects.map(effect => `
            <div class="status-effect">
                <span class="effect-name">${effect.name}</span>
                ${effect.duration ? `<span class="effect-duration">${effect.duration} turns</span>` : ''}
            </div>
        `).join('');
    }

    renderAbilities(abilities) {
        if (!abilities || Object.keys(abilities).length === 0) {
            return '<div class="no-abilities">No abilities available</div>';
        }
    
        let html = '';
    
        // Active abilities
        if (abilities.active && Object.keys(abilities.active).length > 0) {
            html += '<div class="ability-section"><h4>Active</h4>';
            html += Object.entries(abilities.active).map(([id, ability]) => `
                <div class="ability-item" data-index="${id}">
                    <div class="ability-name">${ability.name}</div>
                    <div class="ability-cost">MP: ${ability.mp || 0}</div>
                    ${ability.description ? `<div class="ability-desc">${ability.description}</div>` : ''}
                </div>
            `).join('');
            html += '</div>';
        }
    
        // Reaction abilities
        if (abilities.reaction && Object.keys(abilities.reaction).length > 0) {
            html += '<div class="ability-section"><h4>Reaction</h4>';
            html += Object.entries(abilities.reaction).map(([id, ability]) => `
                <div class="ability-item" data-index="${id}">
                    <div class="ability-name">${ability.name}</div>
                    ${ability.description ? `<div class="ability-desc">${ability.description}</div>` : ''}
                </div>
            `).join('');
            html += '</div>';
        }
    
        // Support abilities
        if (abilities.support && abilities.support.length > 0) {
            html += '<div class="ability-section"><h4>Support</h4>';
            html += abilities.support.map((ability, index) => `
                <div class="ability-item" data-index="support_${index}">
                    <div class="ability-name">${ability.name}</div>
                    ${ability.description ? `<div class="ability-desc">${ability.description}</div>` : ''}
                </div>
            `).join('');
            html += '</div>';
        }
    
        return html || '<div class="no-abilities">No abilities available</div>';
    }
    

    useAbility(character, ability) {
        if (!dungeonExplorer) return;
        // This will be expanded based on ability types and effects
        const result = dungeonExplorer.processAction({
            type: 'ability',
            actor: character,
            ability: ability
        });
        return result;
    }

    show() {
        if (this.overlay) {
            this.overlay.classList.add('active');
            // Re-render map when showing overlay
            requestAnimationFrame(() => this.updateMap());
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
}

// Make DungeonManager available globally instead of exporting it
window.DungeonManager = DungeonManager;
const resizerCol = document.getElementById('resizer-col');
const resizerRow1 = document.getElementById('resizer-row1');
const resizerRow2 = document.getElementById('resizer-row2');
const resizerMap = document.getElementById('resizer-map');
const content = document.querySelector('.content');
const mapContainer = document.querySelector('.map-container');
const sceneartContainer = document.querySelector('.sceneart-container');
const mobileNav = document.getElementById('mobile-nav');
const mobileMenu = document.getElementById('mobile-menu');
const sidebar = document.getElementById('sidebar');
const left = document.getElementById('left');
const right = document.getElementById('right');

let dungeonManager = null;

// Function to check if we're in mobile view
function isMobileView() {
    return window.matchMedia('(max-width: 768px)').matches;
}

// Function to handle view changes
function handleViewChange() {
    const isMobile = isMobileView();
    
    // Show/hide mobile navigation
    mobileNav.style.display = isMobile ? 'flex' : 'none';
    
    // Handle sidebar visibility
    sidebar.style.display = isMobile ? 'none' : 'flex';
    
    if (isMobile) {
        // Mobile view setup
        // Make sure only one view is active
        const activeView = document.querySelector('[data-view].active');
        const view = activeView?.dataset.view || 'right';
        left.classList.toggle('active', view === 'left');
        right.classList.toggle('active', view === 'right');
        
        // Update button states in mobile nav
        mobileNav.querySelectorAll('button[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Hide mobile menu if it's shown
        mobileMenu.classList.remove('show');
    } else {
        // Desktop view setup
        left.classList.remove('active');
        right.classList.remove('active');
        left.style.display = '';
        right.style.display = '';
        mobileMenu.style.display = 'none';
    }
}

// Add window resize listener with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleViewChange, 100);
});

// Handle mobile view toggling
mobileNav.addEventListener('click', (e) => {
    if (e.target.matches('[data-view]')) {
        const view = e.target.dataset.view;
        // Update active states
        mobileNav.querySelectorAll('button[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show selected view
        left.classList.toggle('active', view === 'left');
        right.classList.toggle('active', view === 'right');
    } else if (e.target.matches('[data-action="toggleMobileMenu"]')) {
        mobileMenu.classList.toggle('show');
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (isMobileView() && 
        mobileMenu.classList.contains('show') && 
        !mobileMenu.contains(e.target) && 
        !e.target.matches('[data-action="toggleMobileMenu"]')) {
        mobileMenu.classList.remove('show');
    }
});

// Initial view setup
handleViewChange();

const isMobile = window.matchMedia('(max-width: 768px)').matches;

let startX, startY, startWidth, startHeight;

// Add data-action event handler
document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'toggleMenu':
            toggleSidebar();
            break;
        case 'saveGame':
            saveGame(true);
            break;
        case 'loadGame':
            const fileInput = document.getElementById('fileInput');
            fileInput.click();
            break;
        case 'openSettings':
            openSettings();
            break;
        case 'editCharacter':
            openCharacterEditor();
            break;
        case 'editWorld':
            openWorldGeneration();
            break;
        case 'newGame':
            startNewGame();
            break;
        case 'editOutput':
            openOutputEditor();
            break;
        case 'undoAction':
            undoLastAction();
            break;
        case 'sendMessage':
            sendMessage();
            break;
        case 'enterDungeon':
            initDungeonManager();
            break;
        }
});

// Add input handler for file input
document.getElementById('fileInput').addEventListener('change', (e) => {
    loadFromFile(e);
});

// Add input handler for text input
document.getElementById('input').addEventListener('keydown', handleKeyDown);

resizerCol.addEventListener('mousedown', initDragCol);
resizerRow1.addEventListener('mousedown', initDragRow);
resizerRow2.addEventListener('mousedown', initDragRow);
resizerMap.addEventListener('mousedown', initDragMap);

// Add touch event listeners
resizerCol.addEventListener('touchstart', handleTouchStart, { passive: false });
resizerRow1.addEventListener('touchstart', handleTouchStart, { passive: false });
resizerRow2.addEventListener('touchstart', handleTouchStart, { passive: false });
resizerMap.addEventListener('touchstart', handleTouchStart, { passive: false });

if (window.matchMedia('(max-width: 768px)').matches) {
    mobileNav.style.display = 'flex';
    document.getElementById('left').classList.add('active');
    
    // Handle mobile view switching
    mobileNav.addEventListener('click', (e) => {
        if (e.target.matches('[data-view]')) {
            const view = e.target.dataset.view;
            // Update active states
            mobileNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show selected view
            document.getElementById('left').classList.toggle('active', view === 'left');
            document.getElementById('right').classList.toggle('active', view === 'right');
        }
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;

    // Store the initial sizes
    if (e.target === resizerCol) {
        const leftSide = document.getElementById('left');
        startWidth = leftSide.offsetWidth;
    } else if (e.target === resizerMap) {
        startWidth = parseInt(document.defaultView.getComputedStyle(mapContainer).getPropertyValue('width'));
    } else {
        const quadrant = e.target.previousElementSibling;
        startHeight = parseInt(document.defaultView.getComputedStyle(quadrant).getPropertyValue('height'));
        document.quadrant = quadrant;
    }

    // Add the appropriate touch move handler
    if (e.target === resizerCol) {
        document.addEventListener('touchmove', handleTouchMoveCol, { passive: false });
        document.addEventListener('touchend', handleTouchEndCol);
    } else if (e.target === resizerMap) {
        document.addEventListener('touchmove', handleTouchMoveMap, { passive: false });
        document.addEventListener('touchend', handleTouchEndMap);
    } else {
        document.addEventListener('touchmove', handleTouchMoveRow, { passive: false });
        document.addEventListener('touchend', handleTouchEndRow);
    }
}

function handleTouchMoveCol(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const leftSide = document.getElementById('left');
    const rightSide = document.getElementById('right');
    const containerWidth = content.offsetWidth;
    const newWidth = Math.max(300, Math.min(containerWidth - 300, startWidth + (touch.clientX - startX)));
    const leftPercentage = (newWidth / containerWidth) * 100;
    
    leftSide.style.flex = `0 0 ${newWidth}px`;
    rightSide.style.flex = '1';
}

function handleTouchMoveRow(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const quadrant = document.quadrant;
    const newHeight = startHeight + (touch.clientY - startY);
    quadrant.style.height = `${newHeight}px`;

    // Adjust the height of the quadrant below
    const nextQuadrant = quadrant.nextElementSibling.nextElementSibling;
    if (nextQuadrant && nextQuadrant.classList.contains('quadrant')) {
        nextQuadrant.style.height = `calc(100vh - ${newHeight}px - .5vh)`;
    }
}

function handleTouchMoveMap(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const newWidth = startWidth + (touch.clientX - startX);
    mapContainer.style.width = `${newWidth}px`;
    sceneartContainer.style.width = `calc(100% - ${newWidth}px - .5vh)`;
}

function handleTouchEndCol() {
    document.removeEventListener('touchmove', handleTouchMoveCol);
    document.removeEventListener('touchend', handleTouchEndCol);
}

function handleTouchEndRow() {
    document.removeEventListener('touchmove', handleTouchMoveRow);
    document.removeEventListener('touchend', handleTouchEndRow);
    document.quadrant = null;
}

function handleTouchEndMap() {
    document.removeEventListener('touchmove', handleTouchMoveMap);
    document.removeEventListener('touchend', handleTouchEndMap);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.matchMedia('(max-width: 768px)').matches) {
        // For mobile
        if (sidebar.classList.contains('expanded')) {
            sidebar.classList.remove('expanded');
            if (mobileNav) mobileNav.style.display = 'flex';
        } else {
            sidebar.classList.add('expanded');
            if (mobileNav) mobileNav.style.display = 'none';
        }
    } else {
        // For desktop
        sidebar.classList.toggle('collapsed');
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        sendMessage(input.value);
    } else if (event.ctrlKey && event.key === 'z') {
        undoLastAction();
    }
}

function initDragCol(e) {
    e.preventDefault();
    startX = e.clientX;
    const leftSide = document.getElementById('left');
    startWidth = leftSide.offsetWidth;
    document.addEventListener('mousemove', doDragCol, false);
    document.addEventListener('mouseup', stopDragCol, false);
}

function doDragCol(e) {
    e.preventDefault();
    const leftSide = document.getElementById('left');
    const rightSide = document.getElementById('right');
    const containerWidth = content.offsetWidth;
    const newWidth = Math.max(300, Math.min(containerWidth - 300, startWidth + (e.clientX - startX)));
    const leftPercentage = (newWidth / containerWidth) * 100;
    const rightPercentage = 100 - leftPercentage;
    
    leftSide.style.flex = `0 0 ${newWidth}px`;
    rightSide.style.flex = '1';
}

function stopDragCol() {
    document.removeEventListener('mousemove', doDragCol, false);
    document.removeEventListener('mouseup', stopDragCol, false);
}

function initDragRow(e) {
    startY = e.clientY;
    const quadrant = e.target.previousElementSibling;
    startHeight = parseInt(document.defaultView.getComputedStyle(quadrant).getPropertyValue('height'));
    document.addEventListener('mousemove', doDragRow, false);
    document.addEventListener('mouseup', stopDragRow, false);
    document.quadrant = quadrant; // Store the quadrant in the document object
}

function doDragRow(e) {
    const quadrant = document.quadrant; // Retrieve the quadrant from the document object
    const newHeight = startHeight + (e.clientY - startY);
    quadrant.style.height = `${newHeight}px`;

    // Adjust the height of the quadrant below
    const nextQuadrant = quadrant.nextElementSibling.nextElementSibling;
    if (nextQuadrant && nextQuadrant.classList.contains('quadrant')) {
        nextQuadrant.style.height = `calc(100vh - ${newHeight}px - .5vh)`; // 5px for the resizer
    }
}

function stopDragRow() {
    document.removeEventListener('mousemove', doDragRow, false);
    document.removeEventListener('mouseup', stopDragRow, false);
    document.quadrant = null; // Clear the stored quadrant
}

function initDragMap(e) {
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(mapContainer).getPropertyValue('width'));
    document.addEventListener('mousemove', doDragMap, false);
    document.addEventListener('mouseup', stopDragMap, false);
}

function doDragMap(e) {
    const newWidth = startWidth + (e.clientX - startX);
    mapContainer.style.width = `${newWidth}px`;
    sceneartContainer.style.width = `calc(100% - ${newWidth}px - .5vh)`; // 5px for the resizer
}

function stopDragMap() {
    document.removeEventListener('mousemove', doDragMap, false);
    document.removeEventListener('mouseup', stopDragMap, false);
}

function updateImageGrid(areaName) {
    const imageGrid = document.getElementById('image-grid');
    const tooltip = document.getElementById('tooltip');
    
    // Track current images to determine changes
    const existingContainers = new Map();
    imageGrid.querySelectorAll('.image-container').forEach(container => {
        const img = container.querySelector('img');
        existingContainers.set(container.dataset.entityName, container);
    });

    // Handle the scene art
    const sceneArt = document.getElementById('sceneart');
    const area = areas[areaName];
    if (!area) return;

    if (sceneArt.src.startsWith('blob:')) {
        URL.revokeObjectURL(sceneArt.src);
    }
    if (area.image instanceof Blob) {
        const objectUrl = URL.createObjectURL(area.image);
        sceneArt.src = objectUrl;
        sceneArt.onload = () => {
            if (sceneArt.dataset.previousUrl) {
                URL.revokeObjectURL(sceneArt.dataset.previousUrl);
            }
            sceneArt.dataset.previousUrl = objectUrl;
        };
    } else {
        sceneArt.src = 'placeholder.png';
    }

    // Create or update image rows for each category
    const categories = ['people', 'things', 'creatures'];
    const updatedContainers = new Set();
    
    categories.forEach(category => {
        // Skip if category array doesn't exist
        if (!area[category] || !Array.isArray(area[category])) return;

        let row = imageGrid.querySelector(`.image-row[data-category="${category}"]`);
        const hasItems = area[category] && area[category].length > 0;
        
        if (hasItems) {
            if (!row) {
                row = document.createElement('div');
                row.classList.add('image-row');
                row.dataset.category = category;
                imageGrid.appendChild(row);
            }
            
            area[category].forEach(item => {
                // Skip invalid items
                if (!item || !item.name) return;

                let container = existingContainers.get(item.name);
                
                if (!container) {
                    // Create new container if it doesn't exist
                    container = document.createElement('div');
                    container.classList.add('image-container');
                    container.dataset.entityName = item.name;
                    
                    const img = document.createElement('img');
                    if (item.image instanceof Blob) {
                        img.src = URL.createObjectURL(item.image);
                    } else if (item.image === 'placeholder') {
                        img.src = 'placeholder.png';
                        setTimeout(async () => {
                            let negprompt = "";
                            let posprompt = "";
                            if (category === "people") {
                                posprompt = settings.person_prompt;
                                negprompt = settings.person_negprompt;
                            } else if (category === "creatures") {
                                posprompt = settings.creature_prompt;
                                negprompt = settings.creature_negprompt;
                            } else if (category === "things") {
                                posprompt = settings.thing_prompt;
                                negprompt = settings.thing_negprompt;
                            }
                            const artBlob = await generateArt(posprompt + item.visual, negprompt, item.seed);
                            if (artBlob instanceof Blob) {
                                item.image = artBlob;
                                img.src = URL.createObjectURL(artBlob);
                            }
                        }, 0);
                    }
                    img.alt = item.name;
                    
                    const nameOverlay = document.createElement('div');
                    nameOverlay.classList.add('image-name-overlay');
                    nameOverlay.textContent = item.name;
                    
                    container.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEntitySubmenu(item, category, e.clientX, e.clientY);
                    });

                    container.addEventListener('mouseover', () => {
                        tooltip.classList.add('tooltip-visible');
                        tooltip.innerHTML = `<strong>${item.name}</strong><br>${item.description}<br><img src="${img.src}" alt="${item.name}" style="width: 100px; height: auto;">`;
                    });

                    container.addEventListener('mousemove', (e) => {
                        tooltip.style.left = `${e.pageX + 10}px`;
                        tooltip.style.top = `${e.pageY + 10}px`;
                    });

                    container.addEventListener('mouseout', () => {
                        tooltip.classList.remove('tooltip-visible');
                    });

                    container.appendChild(img);
                    container.appendChild(nameOverlay);
                }
                
                updatedContainers.add(item.name);
                if (container.parentElement !== row) {
                    row.appendChild(container);
                }
            });
        } else if (row) {
            row.remove();
        }
    });

    // Remove any containers that are no longer present
    existingContainers.forEach((container, name) => {
        if (!updatedContainers.has(name)) {
            const img = container.querySelector('img');
            if (img && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
            container.remove();
        }
    });
}

function updateTime() {
    const timeElement = document.getElementById('currentTime');
    const season = settings.climate !='' ? (settings.climate != 'temperate' ? settings.climate : getSeason()) : '';
    
    const dateSeasonSpan = timeElement.querySelector('.date-season');
    const timeSpan = timeElement.querySelector('.time');
    
    const [date] = settings.current_time.split(' ');
    const [time] = getPreciseTime();
    
    dateSeasonSpan.textContent = `${season} ${date} ` + getDayOfWeek();
    timeSpan.textContent = time;
}

function updateFollowerArt() {
    const followersContainer = document.getElementById('followers-container');
    
    // Update followers container display
    if (followers.length > 0) {
        followersContainer.classList.add('followers-visible');
        const width = `${100 / followers.length}%`;
        
        // Track which images we've updated to determine removals
        const updatedFollowers = new Set();
        
        // Add/update followers
        followers.forEach((follower) => {
            let img = followersContainer.querySelector(`img[data-follower-name="${follower.name}"]`);
            updatedFollowers.add(follower.name);
            
            if (!img) {
                img = document.createElement('img');
                img.classList.add('follower-image');
                img.dataset.followerName = follower.name;
                img.style.width = width;
                
                if (follower.image instanceof Blob) {
                    img.src = URL.createObjectURL(follower.image);
                } else if (follower.image === 'placeholder') {
                    img.src = 'placeholder.png';
                    setTimeout(async () => {
                        let negprompt = "";
                        let posprompt = "";
                        if (follower.type === "people") {
                            posprompt = settings.person_prompt;
                            negprompt = settings.person_negprompt;
                        } else if (follower.type === "creatures") {
                            posprompt = settings.creature_prompt;
                            negprompt = settings.creature_negprompt;
                        }
                        const artBlob = await generateArt(posprompt + follower.visual, negprompt, follower.seed);
                        if (artBlob instanceof Blob) {
                            follower.image = artBlob;
                            img.src = URL.createObjectURL(artBlob);
                        }
                    }, 0);
                }
                
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const submenu = document.getElementById('entitySubmenu');
                    if (submenu) {
                        if (submenu.closeHandler) {
                            document.removeEventListener('click', submenu.closeHandler);
                        }
                        submenu.remove();
                    }
                    openEntitySubmenu(follower, follower.type, e.clientX, e.clientY);
                });
                
                followersContainer.appendChild(img);
                // Add show class after a frame to trigger the transition
                requestAnimationFrame(() => img.classList.add('show'));
            } else {
                img.style.width = width;
            }
        });

        // Remove followers that are no longer in the list
        const toRemove = [];
        Array.from(followersContainer.children).forEach(img => {
            const followerName = img.dataset.followerName;
            if (!updatedFollowers.has(followerName)) {
                img.classList.remove('show');
                // Store the image for removal after transition
                toRemove.push(img);
            }
        });

        // Remove elements after transition
        toRemove.forEach(img => {
            img.addEventListener('transitionend', () => {
                if (img.parentNode === followersContainer) {
                    if (img.src && img.src.startsWith('blob:')) {
                        URL.revokeObjectURL(img.src);
                    }
                    followersContainer.removeChild(img);
                }
            }, { once: true }); // Ensure handler runs only once
        });
    } else {
        followersContainer.classList.remove('followers-visible');
        
        // Clean up any existing follower images and blob URLs
        while (followersContainer.firstChild) {
            const img = followersContainer.firstChild;
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
            followersContainer.removeChild(img);
        }
    }
}

// Add player art click handler
const playerArt = document.getElementById('playerart');
playerArt.addEventListener('click', (e) => {
    e.stopPropagation();
    // Create player object with current state
    const player = {
        name: settings.player_name,
        description: settings.player_description,
        visual: settings.player_visual,
        seed: settings.player_seed,
        // Just pass through the current image blob if it exists
        image: playerArt.src.startsWith('blob:') ? 'current' : 'placeholder'
    };
    openEntitySubmenu(player, 'player', e.clientX, e.clientY);
});

function updateConsequences() {
    const consequencesDiv = document.getElementById('consequences');
    if (settings.charsheet_fae && settings.charsheet_fae.consequences) {
        let html = [];
        if (settings.charsheet_fae.consequences.mild) {
            html.push(...settings.charsheet_fae.consequences.mild.map(c => 
                `<div class="Mild">${c}</div>`
            ));
        }
        if (settings.charsheet_fae.consequences.moderate) {
            html.push(...settings.charsheet_fae.consequences.moderate.map(c => 
                `<div class="Moderate">${c}</div>`
            ));
        }
        if (settings.charsheet_fae.consequences.severe) {
            html.push(...settings.charsheet_fae.consequences.severe.map(c => 
                `<div class="Severe">${c}</div>`
            ));
        }
        consequencesDiv.innerHTML = html.join('');
    } else {
        consequencesDiv.innerHTML = '';
    }
}

function initMobileLayout() {
    if (!isMobile) return;
    
    // Set initial view state to Adventure
    document.getElementById('left').classList.remove('active');
    document.getElementById('right').classList.add('active');
    mobileNav.style.display = 'flex';
    
    // Set Adventure button as active by default
    const adventureBtn = mobileNav.querySelector('[data-view="right"]');
    adventureBtn.classList.add('active');
    
    const mobileMenu = document.getElementById('mobile-menu');
    const mobilemenuBtn = document.getElementById('mobilemenuBtn');

    // Mobile menu toggle handler
    mobilemenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('show');
        mobilemenuBtn.classList.toggle('active');
    });

    // Handle mobile menu actions
    mobileMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action) {
            // Prevent event from bubbling up to document handler
            e.stopPropagation();
            
            // Close menu
            mobileMenu.classList.remove('show');
            mobilemenuBtn.classList.remove('active');
            
            // Handle file input separately since it needs direct click
            if (action === 'handleFileInput') {
                document.getElementById('fileInput').click();
                return;
            }
            
            // Find and click the original button to trigger the action
            const originalBtn = document.querySelector(`#sidebar button[data-action="${action}"]`);
            if (originalBtn) {
                originalBtn.click();
            }
        }
    });

    // Add touch event handlers for swipe detection
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Only handle horizontal swipes that are greater than vertical movement
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const buttons = mobileNav.querySelectorAll('button');
            if (deltaX > 0) {
                // Swipe right - show left panel
                buttons[0].click();
            } else {
                // Swipe left - show right panel
                buttons[2].click();
            }
        }
    }, { passive: true });
}

// Initialize mobile layout
initMobileLayout();
const resizerCol = document.getElementById('resizer-col');
const resizerRow1 = document.getElementById('resizer-row1');
const resizerRow2 = document.getElementById('resizer-row2');
const resizerMap = document.getElementById('resizer-map');
const content = document.querySelector('.content');
const mapContainer = document.querySelector('.map-container');
const sceneartContainer = document.querySelector('.sceneart-container');

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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
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
        let row = imageGrid.querySelector(`.image-row[data-category="${category}"]`);
        const hasItems = areas[areaName][category] && areas[areaName][category].length > 0;
        
        if (hasItems) {
            if (!row) {
                row = document.createElement('div');
                row.classList.add('image-row');
                row.dataset.category = category;
                imageGrid.appendChild(row);
            }
            
            areas[areaName][category].forEach(item => {
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

function openEntitySubmenu(entity, category, x, y) {
    let submenu = document.getElementById('entitySubmenu');
    if (submenu) {
        if (submenu.closeHandler) {
            document.removeEventListener('click', submenu.closeHandler);
        }
        submenu.remove();
    }

    submenu = document.createElement('div');
    submenu.id = 'entitySubmenu';
    submenu.classList.add('submenu');
    submenu.style.display = 'block';
    submenu.style.position = 'fixed';
    submenu.style.zIndex = '1000';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openUnifiedEditor(entity, category);
        submenu.remove();
        if (submenu.closeHandler) {
            document.removeEventListener('click', submenu.closeHandler);
        }
    };

    submenu.appendChild(editBtn);

    // Only show remove/follower options for non-player entities
    if (category !== 'player') {
        // Special handling for followers
        const isFollower = followers.some(f => f.name === entity.name);
        
        if (isFollower) {
            const dismissBtn = document.createElement('button');
            dismissBtn.textContent = 'Dismiss';
            dismissBtn.onclick = (e) => {
                e.stopPropagation();
                dismissFollower(entity);
                updateFollowerArt();
                submenu.remove();
                if (submenu.closeHandler) {
                    document.removeEventListener('click', submenu.closeHandler);
                }
            };
            submenu.appendChild(dismissBtn);
        } else {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to remove ${entity.name}?`)) {
                    const index = areas[currentArea][category].findIndex(item => item.name === entity.name);
                    if (index > -1) {
                        areas[currentArea][category].splice(index, 1);
                        updateImageGrid(currentArea);
                    }
                }
                submenu.remove();
                if (submenu.closeHandler) {
                    document.removeEventListener('click', submenu.closeHandler);
                }
            };
            submenu.appendChild(removeBtn);

            // Add Follower option for people and creatures
            if (category === 'people' || category === 'creatures') {
                const followBtn = document.createElement('button');
                followBtn.textContent = 'Add Follower';
                followBtn.onclick = (e) => {
                    e.stopPropagation();
                    addFollower(entity);
                    updateFollowerArt();
                    submenu.remove();
                    if (submenu.closeHandler) {
                        document.removeEventListener('click', submenu.closeHandler);
                    }
                };
                submenu.appendChild(followBtn);
            }
        }
    }

    // Ensure menu is positioned within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let posX = x;
    let posY = y;

    document.body.appendChild(submenu);
    
    // Adjust position if menu would overflow viewport
    const menuRect = submenu.getBoundingClientRect();
    if (posX + menuRect.width > viewportWidth) {
        posX = viewportWidth - menuRect.width - 10;
    }
    if (posY + menuRect.height > viewportHeight) {
        posY = viewportHeight - menuRect.height - 10;
    }

    submenu.style.left = posX + 'px';
    submenu.style.top = posY + 'px';

    submenu.closeHandler = (e) => {
        if (!submenu.contains(e.target)) {
            submenu.remove();
            document.removeEventListener('click', submenu.closeHandler);
        }
    };
    
    // Delay adding the click handler to prevent immediate closure
    requestAnimationFrame(() => {
        document.addEventListener('click', submenu.closeHandler);
    });
}

function openNewLocationPrompt(x, y) {
    // Create a temporary location object with coordinates adjusted for centering
    const tempLocation = {
        name: '',
        description: '',
        x: x + 25/scale, // Add half the location width to center the click point
        y: y + 25/scale, // Add half the location height to center the click point
        visual: '',
        seed: Math.floor(Math.random() * 4294967295) + 1,
        image: 'placeholder.png',
        people: [],
        things: [],
        creatures: [],
        sublocations: {}
    };

    // Open the unified editor with the temporary location
    openUnifiedEditor(tempLocation, 'location', null);
}

function openUnifiedEditor(item, type, path = null) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.classList.add('editor-container');
    editor.style.display = 'grid';
    editor.style.gridTemplateRows = 'auto 1fr auto';
    editor.style.gap = '10px';
    editor.style.maxHeight = '90vh';
    editor.style.width = '90vw';
    editor.style.maxWidth = '800px';

    // Main content area with grid layout
    const content = document.createElement('div');
    content.className = 'editor-content';
    content.style.display = 'grid';
    content.style.gridTemplateColumns = '1fr 1fr';
    content.style.gap = '10px';
    content.style.height = '100%';
    content.style.overflow = 'hidden';

    // Left side - Preview and Name
    const leftColumn = document.createElement('div');
    leftColumn.className = 'editor-column';
    leftColumn.style.display = 'grid';
    leftColumn.style.gridTemplateRows = 'auto auto 1fr';
    leftColumn.style.gap = '10px';
    leftColumn.style.height = '100%';

    // Preview section with corner refresh button
    const previewSection = document.createElement('div');
    previewSection.className = 'editor-section preview-section';
    previewSection.style.position = 'relative';
    previewSection.style.aspectRatio = '1';

    const previewImage = document.createElement('img');
    previewImage.className = 'editor-preview-image';
    previewImage.style.width = '100%';
    previewImage.style.height = '100%';
    previewImage.style.objectFit = 'cover';
    
    // Special handling for player image
    if (type === 'player') {
        const currentPlayerArt = document.getElementById('playerart');
        previewImage.src = currentPlayerArt.src;
    } else if (item.image instanceof Blob) {
        previewImage.src = URL.createObjectURL(item.image);
    } else {
        previewImage.src = 'placeholder.png';
    }
    previewSection.appendChild(previewImage);

    if (item.visual !== undefined) {
        const refreshImageBtn = document.createElement('button');
        refreshImageBtn.className = 'refresh-button top-right';
        refreshImageBtn.innerHTML = '🔄';
        refreshImageBtn.title = 'Regenerate Image';
        refreshImageBtn.onclick = async () => {
            let negprompt = "";
            let posprompt = "";
            if (type === "people") {
                posprompt = settings.person_prompt;
                negprompt = settings.person_negprompt;
            } else if (type === "creatures") {
                posprompt = settings.creature_prompt;
                negprompt = settings.creature_negprompt;
            } else if (type === "things") {
                posprompt = settings.thing_prompt;
                negprompt = settings.thing_negprompt;
            }
            const visualInput = editor.querySelector('textarea[style*="calc(100% - 35px)"]');
            const seedInput = editor.querySelector('input[type="number"].seed-input');
            if (visualInput && seedInput) {
                const visualPrompt = type === 'player' ? visualInput.value : posprompt + visualInput.value;
                const negativePrompt = type === 'player' ? "" : negprompt;
                const artBlob = await generateArt(visualPrompt, negativePrompt, parseInt(seedInput.value));
                if (artBlob instanceof Blob) {
                    item.image = artBlob;
                    previewImage.src = URL.createObjectURL(artBlob);
                }
            }
        };
        previewSection.appendChild(refreshImageBtn);
    }

    // Name input
    const nameSection = document.createElement('div');
    nameSection.className = 'editor-section';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name:';
    const nameInput = document.createElement('input');
    nameInput.value = path ? path.split('/').pop() : item.name;
    nameInput.type = 'text';
    nameInput.style.width = '100%';
    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);
    
    leftColumn.appendChild(previewSection);
    leftColumn.appendChild(nameSection);

    // Right side - Description and Visual
    const rightColumn = document.createElement('div');
    rightColumn.className = 'editor-column';
    rightColumn.style.display = 'grid';
    rightColumn.style.gridTemplateRows = item.visual !== undefined ? '1fr 1fr' : '1fr';
    rightColumn.style.gap = '10px';
    rightColumn.style.height = '100%';

    // Description section with refresh button
    const descSection = document.createElement('div');
    descSection.className = 'editor-section';
    descSection.style.position = 'relative';
    
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description:';
    const descInput = document.createElement('textarea');
    descInput.value = item.description;
    descInput.style.width = '100%';
    descInput.style.height = 'calc(100% - 25px)';
    descInput.style.resize = 'none';

    const refreshDescBtn = document.createElement('button');
    refreshDescBtn.className = 'refresh-button top-right';
    refreshDescBtn.innerHTML = '🔄';
    refreshDescBtn.title = 'Regenerate Description';
    refreshDescBtn.onclick = async () => {
        const newDesc = await generateNewDescription(nameInput.value, type);
        descInput.value = newDesc;
        item.description = newDesc;
    };

    descSection.appendChild(descLabel);
    descSection.appendChild(descInput);
    descSection.appendChild(refreshDescBtn);
    
    rightColumn.appendChild(descSection);

    // Visual section with refresh button
    if (item.visual !== undefined) {
        const visualSection = document.createElement('div');
        visualSection.className = 'editor-section';
        visualSection.style.position = 'relative';
        
        const visualLabel = document.createElement('div');
        visualLabel.className = 'prompt-header';
        visualLabel.style.display = 'flex';
        visualLabel.style.justifyContent = 'space-between';
        visualLabel.style.alignItems = 'center';
        
        const visualLabelText = document.createElement('label');
        visualLabelText.textContent = 'Visual Prompt:';
        
        const seedInput = document.createElement('input');
        seedInput.type = 'number';
        seedInput.value = item.seed || Math.floor(Math.random() * 4294967295) + 1;
        seedInput.title = 'Seed';
        seedInput.className = 'seed-input';
        
        visualLabel.appendChild(visualLabelText);
        visualLabel.appendChild(seedInput);
        
        const visualInput = document.createElement('textarea');
        visualInput.value = item.visual || '';
        visualInput.style.width = '100%';
        visualInput.style.height = 'calc(100% - 35px)';
        visualInput.style.resize = 'none';

        const refreshVisualBtn = document.createElement('button');
        refreshVisualBtn.className = 'refresh-button top-right';
        refreshVisualBtn.innerHTML = '🔄';
        refreshVisualBtn.title = 'Regenerate Visual Prompt';
        refreshVisualBtn.onclick = async () => {
            const newVisual = await generateVisualPrompt(nameInput.value, descInput.value);
            visualInput.value = type === 'things' ? `(${nameInput.value}), ${newVisual}` : newVisual;
            item.visual = visualInput.value;
        };

        visualSection.appendChild(visualLabel);
        visualSection.appendChild(visualInput);
        visualSection.appendChild(refreshVisualBtn);
        
        rightColumn.appendChild(visualSection);
    }

    content.appendChild(leftColumn);
    content.appendChild(rightColumn);

    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';
    actionButtons.style.padding = '10px';

    const saveBtn = document.createElement('button');
    if (!path && type === 'location' && item.x !== undefined && item.y !== undefined)
        saveBtn.textContent = 'Save';
    else saveBtn.textContent = 'Close';

    saveBtn.className = 'btn-primary';
    saveBtn.onclick = async () => {
        const newName = nameInput.value.trim();
        if (type === 'player') {
            // Update player settings
            settings.player_name = newName;
            settings.player_description = descInput.value;
            if (item.visual !== undefined) {
                const visualInput = editor.querySelector('textarea[style*="calc(100% - 35px)"]');
                const seedInput = editor.querySelector('input[type="number"].seed-input');
                if (visualInput && seedInput) {
                    settings.player_visual = visualInput.value;
                    settings.player_seed = parseInt(seedInput.value);
                    // Only update player art if it was regenerated in the editor
                    if (item.image instanceof Blob) {
                        const currentPlayerArt = document.getElementById('playerart');
                        currentPlayerArt.src = URL.createObjectURL(item.image);
                    }
                }
            }
            updateCharacterInfo();
        } else {
            if (newName && ((path && newName !== path.split('/').pop()) || (!path && newName !== item.name))) {
                if (path) {
                    console.log('Location name changed to:', newName);
                } else {
                    renameEntity(newName, item.name);
                }
            }
            item.description = descInput.value;
            
            // Only update visual and seed if the item has visual properties and the inputs exist
            if (item.visual !== undefined) {
                const visualInput = editor.querySelector('textarea[style*="calc(100% - 35px)"]');
                const seedInput = editor.querySelector('input[type="number"].seed-input');
                if (visualInput && seedInput) {
                    item.visual = visualInput.value;
                    item.seed = parseInt(seedInput.value);
                    
                    // Force image refresh if preview was updated
                    if (previewImage.src !== 'placeholder.png' && previewImage.src.startsWith('blob:')) {
                        const blobUrl = previewImage.src;
                        item.image = await (await fetch(blobUrl)).blob();
                    }
                }
            }

            if (!path && type === 'location' && item.x !== undefined && item.y !== undefined) {
                await generateArea(newName, item.description, item.x, item.y);
            }

            if (path) {
                updateSublocationRow(currentArea);
            } else {
                // Find the container and update its image
                const container = document.querySelector(`.image-container[data-entity-name="${item.name}"]`);
                if (container) {
                    const img = container.querySelector('img');
                    if (img && item.image instanceof Blob) {
                        // Revoke old blob URL if it exists
                        if (img.src.startsWith('blob:')) {
                            URL.revokeObjectURL(img.src);
                        }
                        // Set new image
                        img.src = URL.createObjectURL(item.image);
                    }
                } else {
                    // If container not found, do full grid update
                    updateImageGrid(currentArea);
                }
                updateFollowerArt();
            }
        }
        overlay.remove();
    };
    if (!path && type === 'location' && item.x !== undefined && item.y !== undefined) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.onclick = () => overlay.remove();
        actionButtons.appendChild(cancelBtn);
    }
    actionButtons.appendChild(saveBtn);

    editor.appendChild(content);
    editor.appendChild(actionButtons);
    overlay.appendChild(editor);
    document.body.appendChild(overlay);

    setTimeout(() => nameInput.focus(), 100);
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

function openWorldGeneration(isNewGame = false, onNext = null) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.classList.add('settings-container');
    container.style.maxWidth = '800px';

    // Main editor section
    const editorSection = document.createElement('div');
    editorSection.className = 'editor-section';
    editorSection.style.display = 'flex';
    editorSection.style.flexDirection = 'column';
    editorSection.style.gap = '15px';
    editorSection.style.padding = '20px';
    editorSection.style.flex = '1';
    editorSection.style.minHeight = '0';

    // Theme input with generate button
    const themeGroup = document.createElement('div');
    themeGroup.style.position = 'relative';
    const themeLabel = document.createElement('label');
    themeLabel.textContent = 'World Theme:';
    const themeInput = document.createElement('input');
    themeInput.type = 'text';
    themeInput.value = '';
    themeInput.style.width = '100%';
    themeInput.placeholder = 'Enter a theme like "medieval fantasy" or "cyberpunk future"';

    const refreshThemeBtn = document.createElement('button');
    refreshThemeBtn.className = 'refresh-button top-right';
    refreshThemeBtn.innerHTML = '🔄';
    refreshThemeBtn.title = 'Generate World Description';
    refreshThemeBtn.onclick = async () => {
        const theme = themeInput.value.trim();
        if (theme) {
            const desc = await generateText(settings.creative_question_param, 
                `Generate a rich, detailed world description for a ${theme} setting in 3-4 sentences.`);
            worldDescInput.value = desc;
        }
    };

    themeGroup.appendChild(themeLabel);
    themeGroup.appendChild(themeInput);

    // World description
    const worldGroup = document.createElement('div');
    worldGroup.style.flex = '1';
    worldGroup.style.position = 'relative';
    const worldLabel = document.createElement('label');
    worldLabel.textContent = 'World Description:';
    const worldDescInput = document.createElement('textarea');
    worldDescInput.value = settings.world_description;
    worldDescInput.style.height = '200px';

    worldGroup.appendChild(worldLabel);
    worldGroup.appendChild(refreshThemeBtn);
    worldGroup.appendChild(worldDescInput);

    // Starting area with generate button
    const areaGroup = document.createElement('div');
    areaGroup.style.position = 'relative';
    const areaLabel = document.createElement('label');
    areaLabel.textContent = 'Starting Area:';
    const areaInput = document.createElement('input');
    areaInput.type = 'text';
    areaInput.value = settings.starting_area;
    areaInput.style.width = '100%';

    const refreshAreaBtn = document.createElement('button');
    refreshAreaBtn.className = 'refresh-button top-right';
    refreshAreaBtn.innerHTML = '🔄';
    refreshAreaBtn.title = 'Generate Starting Area';
    refreshAreaBtn.onclick = async () => {
        const response = await generateText(settings.creative_question_param, 
            `Based on this world: ${worldDescInput.value}\nGenerate a name for an interesting starting location, if it would be within another larger place answer from largest to smallest with each location separated by a '/', eg. City/College/Dormitory/Bedroom.`);
            const desc = response.trim().replaceAll(' / ', '/');
        areaInput.value = desc;
        // Also generate its description
        const areaDesc = await generateText(settings.creative_question_param, 
            `Generate a detailed description in 2-3 sentences of this location: ${desc.includes('/') ? desc.split('/').pop() : desc} that exists in this world: ${worldDescInput.value}`);
        areaDescInput.value = areaDesc;
    };

    areaGroup.appendChild(areaLabel);
    areaGroup.appendChild(areaInput);
    areaGroup.appendChild(refreshAreaBtn);

    // Area description with generate button
    const areaDescGroup = document.createElement('div');
    areaDescGroup.style.flex = '1';
    areaDescGroup.style.position = 'relative';
    const areaDescLabel = document.createElement('label');
    areaDescLabel.textContent = 'Starting Area Description:';
    const areaDescInput = document.createElement('textarea');
    areaDescInput.value = settings.starting_area_description;
    areaDescInput.style.height = '200px';

    const refreshAreaDescBtn = document.createElement('button');
    refreshAreaDescBtn.className = 'refresh-button top-right';
    refreshAreaDescBtn.innerHTML = '🔄';
    refreshAreaDescBtn.title = 'Regenerate Area Description';
    refreshAreaDescBtn.onclick = async () => {
        const areaDesc = await generateText(settings.creative_question_param, 
            `Generate a detailed description in 2-3 sentences of this location: ${areaInput.value.includes('/') ? areaInput.value.split('/').pop() : areaInput.value} that exists in this world: ${worldDescInput.value}`);
        areaDescInput.value = areaDesc;
    };

    areaDescGroup.appendChild(areaDescLabel);
    areaDescGroup.appendChild(areaDescInput);
    areaDescGroup.appendChild(refreshAreaDescBtn);

    // Date input
    const dateGroup = document.createElement('div');
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Starting Date/Time:';
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.value = settings.current_time;
    dateInput.style.width = '100%';
    dateInput.placeholder = 'YYYY-MM-DD HH:MM:SS';

    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);

    // Add all inputs to editor section
    editorSection.appendChild(themeGroup);
    editorSection.appendChild(worldGroup);
    editorSection.appendChild(areaGroup);
    editorSection.appendChild(areaDescGroup);
    editorSection.appendChild(dateGroup);

    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.onclick = () => overlay.remove();

    const primaryBtn = document.createElement('button');
    if (isNewGame && onNext) {
        primaryBtn.textContent = 'Next: Create Character';
        primaryBtn.onclick = () => {
            const worldSettings = {
                world_description: worldDescInput.value,
                starting_area: areaInput.value,
                starting_area_description: areaDescInput.value,
                current_time: dateInput.value
            };
            // Save world settings
            Object.assign(settings, worldSettings);
            overlay.remove();
            onNext(worldSettings);
        };
    } else {
        primaryBtn.textContent = 'Save';
        primaryBtn.onclick = () => {
            settings.world_description = worldDescInput.value;
            settings.starting_area = areaInput.value;
            settings.starting_area_description = areaDescInput.value;
            settings.current_time = dateInput.value;
            overlay.remove();
        };
    }
    primaryBtn.className = 'btn-primary';

    actionButtons.appendChild(cancelBtn);
    actionButtons.appendChild(primaryBtn);

    container.appendChild(editorSection);
    container.appendChild(actionButtons);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function openCharacterEditor(isNewGame = false) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.classList.add('settings-container');
    container.style.maxWidth = '800px';
    container.style.maxHeight = '90vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflowY = 'hidden';
    container.style.padding = '20px';
    container.style.gap = '15px';

    // Preview section with adjusted height
    const previewSection = document.createElement('div');
    previewSection.className = 'editor-section preview-section';
    previewSection.style.position = 'relative';
    previewSection.style.height = '30vh';
    previewSection.style.margin = '0 auto';
    previewSection.style.flexShrink = '0'; // Prevent image from shrinking

    const previewImage = document.createElement('img');
    previewImage.className = 'editor-preview-image';
    previewImage.style.width = '100%';
    previewImage.style.height = '100%';
    previewImage.style.objectFit = 'cover';
    
    const currentPlayerArt = document.getElementById('playerart');
    previewImage.src = currentPlayerArt.src;

    // Create temporary item object for handling the image
    const item = {
        image: currentPlayerArt.src.startsWith('blob:') ? 'current' : 'placeholder'
    };

    previewSection.appendChild(previewImage);

    // Add refresh button here, but it will use visualInput which we'll create later
    let visualInput; // Declare this so we can reference it in the refresh button
    const refreshImageBtn = document.createElement('button');
    refreshImageBtn.className = 'refresh-button top-right';
    refreshImageBtn.innerHTML = '🔄';
    refreshImageBtn.title = 'Regenerate Character Image';
    refreshImageBtn.onclick = async () => {
        if (visualInput && visualInput.value) {
            const artBlob = await generateArt(visualInput.value, "", Math.floor(Math.random() * 4294967295) + 1);
            if (artBlob instanceof Blob) {
                previewImage.src = URL.createObjectURL(artBlob);
                item.image = artBlob;
            }
        }
    };
    previewSection.appendChild(refreshImageBtn);

    container.appendChild(previewSection);

    // Main editor section with scroll
    const editorSection = document.createElement('div');
    editorSection.className = 'editor-section';
    editorSection.style.display = 'flex';
    editorSection.style.flexDirection = 'column';
    editorSection.style.gap = '15px';
    editorSection.style.overflowY = 'auto';
    editorSection.style.flex = '1';
    editorSection.style.minHeight = '0'; // Allow flex container to shrink

    // Character name input
    const nameGroup = document.createElement('div');
    nameGroup.style.position = 'relative';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Character Name:';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = settings.player_name || '';
    nameInput.style.width = '100%';

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // High concept with generate button
    const conceptGroup = document.createElement('div');
    conceptGroup.style.position = 'relative';
    const conceptLabel = document.createElement('label');
    conceptLabel.textContent = 'High Concept:';
    const conceptInput = document.createElement('input');
    conceptInput.type = 'text';
    conceptInput.value = settings.charsheet_fae?.high_concept || '';
    conceptInput.style.width = '100%';
    conceptInput.placeholder = 'A defining trait or role that describes your character';

    const refreshConceptBtn = document.createElement('button');
    refreshConceptBtn.className = 'refresh-button top-right';
    refreshConceptBtn.innerHTML = '🔄';
    refreshConceptBtn.title = 'Generate High Concept';
    refreshConceptBtn.onclick = async () => {
        const concepts = await generateText(settings.creative_question_param, 
            `Generate 5 creative and unique high concepts for a character that would exist in this world: ${settings.world_description}. 
            Each high concept should be a short phrase three to six word phrase that captures their primary role or defining characteristic.
            Format as 5 distinct phrases, one per line, without explanations or numbers.`);
            console.log(concepts);
        const conceptList = concepts.trim().replaceAll('\n\n', '\n').split('\n').map(c => c.trim());
        const selectedConcept = conceptList[Math.floor(Math.random() * conceptList.length)];
        conceptInput.value = selectedConcept;
    };

    conceptGroup.appendChild(conceptLabel);
    conceptGroup.appendChild(conceptInput);
    conceptGroup.appendChild(refreshConceptBtn);

    // Character description with generate button
    const descGroup = document.createElement('div');
    descGroup.style.position = 'relative';
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description:';
    const descInput = document.createElement('textarea');
    descInput.value = settings.player_description || '';
    descInput.style.height = '100px';

    const refreshDescBtn = document.createElement('button');
    refreshDescBtn.className = 'refresh-button top-right';
    refreshDescBtn.innerHTML = '🔄';
    refreshDescBtn.title = 'Generate Description';
    refreshDescBtn.onclick = async () => {
        const desc = await generateText(settings.creative_question_param, 
            `Set in a world described as ${settings.world_description}\n[Write a description of ${nameInput.value} described simply as ${conceptInput.value}. Without referencing their name and using clear gendered pronouns, write a single paragraph with 1-2 sentence physical description and 1-2 sentence description of attidue dispositon or apparrent motivation. If there is not enough information in the context, be creative.]`);
        descInput.value = desc.trim();
    };

    descGroup.appendChild(descLabel);
    descGroup.appendChild(descInput);
    descGroup.appendChild(refreshDescBtn);

    // Visual prompt moved here (after description) and made visible
    const visualGroup = document.createElement('div');
    visualGroup.style.position = 'relative';
    const visualLabel = document.createElement('label');
    visualLabel.textContent = 'Visual Prompt:';
    visualInput = document.createElement('textarea');
    visualInput.value = settings.player_visual || '';
    visualInput.style.height = '100px';
    visualInput.style.width = '100%';

    const refreshVisualBtn = document.createElement('button');
    refreshVisualBtn.className = 'refresh-button top-right';
    refreshVisualBtn.innerHTML = '🔄';
    refreshVisualBtn.title = 'Generate Visual Description & Image';
    refreshVisualBtn.onclick = async () => {
        const visual = await generateText(settings.creative_question_param, 
            settings.generateVisualPrompt, '', {
                name: nameInput.value,
                description: descInput.value,
                season: settings.climate !='' ? (settings.climate != 'temperate' ? "Current Season: " + settings.climate : "Current Season: " + getSeason()) : '',
                time: ''
            });
        visualInput.value = visual.trim();
        
        // Generate new image
        const artBlob = await generateArt(visualInput.value, "", Math.floor(Math.random() * 4294967295) + 1);
        if (artBlob instanceof Blob) {
            previewImage.src = URL.createObjectURL(artBlob);
        }
    };

    visualGroup.appendChild(visualLabel);
    visualGroup.appendChild(visualInput);
    visualGroup.appendChild(refreshVisualBtn);

    // Aspects section
    const aspectsGroup = document.createElement('div');
    aspectsGroup.style.position = 'relative';
    const aspectsLabel = document.createElement('label');
    aspectsLabel.textContent = 'Character Aspects:';
    
    // Create aspect inputs with improved generation
    const aspectInputs = [];
    for (let i = 0; i < 3; i++) {
        const aspectGroup = document.createElement('div');
        aspectGroup.style.position = 'relative';
        aspectGroup.style.marginTop = '10px';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = settings.charsheet_fae?.aspects?.[i] || '';
        input.style.width = '100%';
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-button top-right';
        refreshBtn.innerHTML = '🔄';
        refreshBtn.title = 'Generate Aspect';
        refreshBtn.onclick = async () => {
            // Gather existing aspects for context
            const existingAspects = [conceptInput.value];
            aspectInputs.forEach(inp => {
                if (inp.value && inp !== input) {
                    existingAspects.push(inp.value);
                }
            });
            if (troubleInput.value) {
                existingAspects.push(troubleInput.value);
            }
            
            const aspects = await generateText(settings.creative_question_param, 
                `Generate 5 unique and creative character aspects for a character who is described as ${descInput.value}. 
                These aspects should be completely different from their existing aspects: ${existingAspects.join(', ')}.
                Each should represent their talents, abilities, personality, background, or beliefs that hasn't been covered by other aspects.
                Format as 5 distinct compelling phrases, one per line, without explanations or numbers. Each must be between two to six words without punctuation.`);
            const aspectList = aspects.trim().replaceAll('\n\n', '\n').split('\n').map(a => a.trim());
            const selectedAspect = aspectList[Math.floor(Math.random() * aspectList.length)];
            input.value = selectedAspect;
        };
        
        aspectGroup.appendChild(input);
        aspectGroup.appendChild(refreshBtn);
        aspectInputs.push(input);
        aspectsGroup.appendChild(aspectGroup);
    }

    // Trouble aspect with improved generation
    const troubleGroup = document.createElement('div');
    troubleGroup.style.position = 'relative';
    troubleGroup.style.marginTop = '20px';
    const troubleLabel = document.createElement('label');
    troubleLabel.textContent = 'Trouble Aspect:';
    const troubleInput = document.createElement('input');
    troubleInput.type = 'text';
    troubleInput.value = settings.charsheet_fae?.trouble || '';
    troubleInput.style.width = '100%';

    const refreshTroubleBtn = document.createElement('button');
    refreshTroubleBtn.className = 'refresh-button top-right';
    refreshTroubleBtn.innerHTML = '🔄';
    refreshTroubleBtn.title = 'Generate Trouble';
    refreshTroubleBtn.onclick = async () => {
        // Gather existing aspects for context
        const existingAspects = [conceptInput.value];
        aspectInputs.forEach(inp => {
            if (inp.value) {
                existingAspects.push(inp.value);
            }
        });
        
        const troubles = await generateText(settings.creative_question_param, 
            `Generate 5 trouble aspects for a character who is described as ${descInput.value}.
            Their existing aspects are: ${existingAspects.join(', ')}.
            Each trouble should be a compelling flaw, weakness, or recurring problem that causes complications in their life.
            Make them distinct from their other aspects but connected to their character.
            Format as 5 distinct compelling phrases, one per line, without explanations or numbers. Each must be between two to six words without punctuation.`);
        const troubleList = troubles.trim().replaceAll('\n\n', '\n').split('\n').map(t => t.trim());
        const selectedTrouble = troubleList[Math.floor(Math.random() * troubleList.length)];
        troubleInput.value = selectedTrouble;
    };

    troubleGroup.appendChild(troubleLabel);
    troubleGroup.appendChild(troubleInput);
    troubleGroup.appendChild(refreshTroubleBtn);

    // Add sections to container in the correct order
    container.appendChild(previewSection);
    container.appendChild(editorSection);

    // Add name, concept, description, visual prompt, aspects, and trouble sections to editorSection
    editorSection.appendChild(nameGroup);
    editorSection.appendChild(conceptGroup);
    editorSection.appendChild(descGroup);
    editorSection.appendChild(visualGroup);
    editorSection.appendChild(aspectsLabel);
    editorSection.appendChild(aspectsGroup);
    editorSection.appendChild(troubleGroup);

    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';
    actionButtons.style.marginTop = '15px';
    actionButtons.style.flexShrink = '0'; // Prevent buttons from shrinking

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.onclick = () => overlay.remove();

    const primaryBtn = document.createElement('button');
    primaryBtn.textContent = isNewGame ? 'Start Game' : 'Save';
    primaryBtn.className = 'btn-primary';
    primaryBtn.onclick = () => {
        saveCharacterSettings();
        overlay.remove();
        if (isNewGame) {
            restartGame();
        }
    };

    function saveCharacterSettings() {
        settings.player_name = nameInput.value;
        settings.player_description = descInput.value;
        settings.player_visual = visualInput.value;
        
        if (!settings.charsheet_fae) settings.charsheet_fae = {};
        settings.charsheet_fae.high_concept = conceptInput.value;
        settings.charsheet_fae.aspects = aspectInputs.map(input => input.value);
        settings.charsheet_fae.trouble = troubleInput.value;

        updateCharacterInfo();
        
        if (previewImage.src !== currentPlayerArt.src) {
            currentPlayerArt.src = previewImage.src;
        }
    }

    actionButtons.appendChild(cancelBtn);
    actionButtons.appendChild(primaryBtn);

    // Add sections to container
    container.appendChild(actionButtons);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function startNewGame() {
    openWorldGeneration(true, (worldSettings) => {
        openCharacterEditor(true);
    });
}


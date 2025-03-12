const resizerCol = document.getElementById('resizer-col');
const resizerRow1 = document.getElementById('resizer-row1');
const resizerRow2 = document.getElementById('resizer-row2');
const resizerMap = document.getElementById('resizer-map');
const content = document.querySelector('.content');
const mapContainer = document.querySelector('.map-container');
const sceneartContainer = document.querySelector('.sceneart-container');

let startX, startY, startWidth, startHeight;

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
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(content).getPropertyValue('grid-template-columns').split(' ')[0]);
    document.addEventListener('mousemove', doDragCol, false);
    document.addEventListener('mouseup', stopDragCol, false);
}

function doDragCol(e) {
    const newWidth = startWidth + (e.clientX - startX);
    content.style.gridTemplateColumns = `${newWidth}px 5px 1fr`;
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
        nextQuadrant.style.height = `calc(100vh - ${newHeight}px - 5px)`; // 5px for the resizer
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
    sceneartContainer.style.width = `calc(100% - ${newWidth}px - 5px)`; // 5px for the resizer
}

function stopDragMap() {
    document.removeEventListener('mousemove', doDragMap, false);
    document.removeEventListener('mouseup', stopDragMap, false);
}

function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    const form = document.getElementById('settingsForm');
    form.innerHTML = '';

    const sections = {
        'UI': ['column_width', 'q1_height', 'q2_height'],
        'World Generation': [
            'world_description', 'starting_area', 'starting_area_description', 
            'current_time'
        ],
        'Player Details': [
            'player_name', 'player_description', 'player_visual', 'player_seed',
            'rule_set'
        ],
        'Generation Settings': [
            'sdAPI', 'default_prompt', 'default_negative_prompt',
            'person_prompt', 'person_negprompt',
            'creature_prompt', 'creature_negprompt',
            'thing_prompt', 'thing_negprompt',
            'sd_width', 'sd_height', 'steps', 'cfg_scale',
            'save_images', 'sampler_name', 'seed_variation'
        ],
        'Text Generation': [
            'story_param', 'question_param', 'creative_question_param',
            'output_length', 'full_context'
        ],
        'Text Prompts': [
            'generateAreaDescriptionPrompt', 'areaContext', 'areaPeopleContext',
            'areaThingsContext', 'areaCreaturesContext', 'areaPathsContext',
            'areaTimeContext', 'subLocationFormat', 'entityFormat',
            'action_string', 'generateSublocationsPrompt', 'generateEntitiesPrompt',
            'generateVisualPrompt', 'addPersonDescriptionPrompt',
            'addThingDescriptionPrompt', 'addCreatureDescriptionPrompt',
            'addSubLocationDescriptionPrompt', 'outputCheckPrompt',
            'outputAutoCheckPrompt', 'consequencePrompt',
            'moveToAreaProximityPrompt', 'moveToAreaPeoplePrompt',
            'entityLeavesAreaPrompt', 'generateNewDescription'
        ],
        'Rule System': ['ruleprompt_fae_action1', 'charsheet_fae'],
        'Sample Data': ['sampleSublocations', 'sampleEntities', 'sampleQuestions']
    };

    // Create search filter
    const searchContainer = document.createElement('div');
    searchContainer.className = 'settings-search';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search settings...';
    searchInput.className = 'settings-search-input';
    
    searchContainer.appendChild(searchInput);
    form.appendChild(searchContainer);

    // Create sections container
    const sectionsContainer = document.createElement('div');
    sectionsContainer.className = 'settings-sections';

    // Helper function for tooltips
    const createTooltip = (key) => {
        const tooltips = {
            'column_width': 'Width of the left side panel in pixels',
            'q1_height': 'Height of the top quadrant in pixels',
            'q2_height': 'Height of the middle quadrant in pixels',
            'person_prompt': 'Base prompt used when generating character images. Will be combined with specific character details.',
            'person_negprompt': 'Negative prompt to avoid unwanted elements in character images',
            'creature_prompt': 'Base prompt for generating creature images. Will be combined with specific creature details.',
            'creature_negprompt': 'Negative prompt to avoid unwanted elements in creature images',
            'thing_prompt': 'Base prompt for generating object and item images. Will be combined with specific item details.',
            'thing_negprompt': 'Negative prompt to avoid unwanted elements in object images'
        };
        return tooltips[key] || 'Configure this setting';
    };

    // Process settings and create sections
    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            const value = settings[key];
            
            // Determine section
            let sectionName = 'Other';
            for (const [section, keys] of Object.entries(sections)) {
                if (keys.includes(key)) {
                    sectionName = section;
                    break;
                }
            }

            // Get or create section
            let section = sectionsContainer.querySelector(`.settings-section[data-section="${sectionName}"]`);
            if (!section) {
                section = document.createElement('div');
                section.className = 'settings-section';
                section.dataset.section = sectionName;
                
                const header = document.createElement('div');
                header.className = 'settings-section-header';
                header.innerHTML = `<span>${sectionName}</span><span class="section-toggle">▼</span>`;
                header.onclick = (e) => {
                    const isCollapsed = section.classList.toggle('collapsed');
                    const toggle = header.querySelector('.section-toggle');
                    toggle.style.transform = isCollapsed ? 'rotate(-90deg)' : '';
                    e.stopPropagation();
                };
                
                const content = document.createElement('div');
                content.className = 'settings-section-content';
                
                section.appendChild(header);
                section.appendChild(content);
                sectionsContainer.appendChild(section);
            }

            const sectionContent = section.querySelector('.settings-section-content');

            // Create setting container
            const settingContainer = document.createElement('div');
            settingContainer.className = 'setting-item';
            settingContainer.dataset.settingName = key.toLowerCase();
            settingContainer.dataset.searchTerms = `${key.toLowerCase()} ${sectionName.toLowerCase()}`;

            // Create label with tooltip
            const label = document.createElement('label');
            label.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            label.title = createTooltip(key);
            label.htmlFor = key;
            settingContainer.appendChild(label);

            // Create input based on value type
            if (typeof value === 'object') {
                const textarea = document.createElement('textarea');
                textarea.id = key;
                textarea.name = key;
                textarea.value = JSON.stringify(value, null, 2);
                textarea.spellcheck = false;
                settingContainer.appendChild(textarea);
            } else {
                const input = document.createElement('input');
                input.id = key;
                input.name = key;
                
                if (typeof value === 'boolean') {
                    input.type = 'checkbox';
                    input.checked = value;
                    settingContainer.classList.add('setting-checkbox');
                } else if (typeof value === 'number') {
                    input.type = 'number';
                    input.value = value;
                    input.min = 0; // Prevent negative values for dimensions
                } else {
                    input.type = 'text';
                    input.value = typeof value === 'string' ? value.replace(/\n/g, '\\n') : value;
                }
                
                settingContainer.appendChild(input);
            }

            sectionContent.appendChild(settingContainer);
        }
    }

    form.appendChild(sectionsContainer);

    // Add action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.className = 'btn-primary';
    saveButton.type = 'button'; // Explicitly set type to button
    saveButton.onclick = saveSettings;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn-secondary';
    cancelButton.onclick = closeSettings;
    
    actionButtons.appendChild(saveButton);
    actionButtons.appendChild(cancelButton);
    form.appendChild(actionButtons);

    // Update search functionality for collapsible sections
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const sections = form.querySelectorAll('.settings-section');
        
        sections.forEach(section => {
            let hasVisibleItems = false;
            const items = section.querySelectorAll('.setting-item');
            
            items.forEach(item => {
                const searchTerms = item.dataset.searchTerms || '';
                const matches = searchTerms.includes(searchTerm) || 
                              item.textContent.toLowerCase().includes(searchTerm);
                item.style.display = matches ? '' : 'none';
                if (matches) hasVisibleItems = true;
            });
            
            section.style.display = hasVisibleItems ? '' : 'none';
            if (hasVisibleItems && searchTerm) {
                section.classList.remove('collapsed');
                const toggle = section.querySelector('.section-toggle');
                if (toggle) toggle.style.transform = '';
            }
        });
    });

    overlay.style.display = 'flex';
    setTimeout(() => searchInput.focus(), 100);
}

function closeSettings() {
    document.getElementById('settingsOverlay').style.display = 'none';
}

function saveSettings() {
    const form = document.getElementById('settingsForm');

    // Prevent form submission if this was triggered by a submit event
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    const newSettings = {...settings}; // Create a copy of current settings

    // Update settings with form values
    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            const input = form.elements[key];
            if (!input) continue;

            try {
                if (typeof settings[key] === 'boolean') {
                    newSettings[key] = input.checked;
                } else if (typeof settings[key] === 'object') {
                    newSettings[key] = JSON.parse(input.value);
                } else {
                    newSettings[key] = input.value;
                }
            } catch (e) {
                console.error(`Error parsing value for ${key}:`, e);
            }
        }
    }

    // Update the settings object
    settings = newSettings;

    // Save settings to storage
    try {
        localStorage.setItem('settings', JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving settings to localStorage:', e);
    }

    // Apply visual settings
    try {
        document.getElementById('q1').style.height = settings.q1_height;
        document.getElementById('q2').style.height = settings.q2_height;
        document.getElementById('q3').style.height = `calc(100vh - ${settings.q1_height} - 5px)`;
        document.getElementById('q4').style.height = `calc(100vh - ${settings.q2_height} - 5px)`;
        document.querySelector('.content').style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;
    } catch (e) {
        console.error('Error applying visual settings:', e);
    }

    closeSettings();
    return false; // Prevent form submission
}

function updateImageGrid(areaName) {
    const imageGrid = document.getElementById('imageGrid');
    const tooltip = document.getElementById('tooltip');
    imageGrid.innerHTML = '';

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
        // Clean up old object URL after image loads
        sceneArt.onload = () => {
            if (sceneArt.dataset.previousUrl) {
                URL.revokeObjectURL(sceneArt.dataset.previousUrl);
            }
            sceneArt.dataset.previousUrl = objectUrl;
        };
    } else {
        sceneArt.src = 'placeholder.png';
    }

    // Rest of the image grid update logic...
    const categories = ['people', 'things', 'creatures'];
    categories.forEach(category => {
        if (areas[areaName][category]) {
            const row = document.createElement('div');
            row.classList.add('image-row');
            areas[areaName][category].forEach(item => {
                const container = document.createElement('div');
                container.classList.add('image-container');
                
                const nameOverlay = document.createElement('div');
                nameOverlay.classList.add('image-name-overlay');
                nameOverlay.textContent = item.name;
                
                const img = document.createElement('img');
                if (item.image instanceof Blob) {
                    img.src = URL.createObjectURL(item.image);
                } else if(item.image == 'placeholder') {
                    img.src = 'placeholder.png';
                    setTimeout(async () => {
                        let negprompt = "";
                        let posprompt = "";
                        if (category == "people") {
                            posprompt = settings.person_prompt;
                            negprompt = settings.person_negprompt;
                        } else if (category == "creatures") {
                            posprompt = settings.creature_prompt;
                            negprompt = settings.creature_negprompt;
                        } else if (category == "things") {
                            posprompt = settings.thing_prompt;
                            negprompt = settings.thing_negprompt;
                        }
                        const artBlob = await generateArt(posprompt + item.visual, negprompt, item.seed);
                        if (artBlob instanceof Blob) {
                            item.image = artBlob;
                            img.src = URL.createObjectURL(artBlob);
                        }
                    }, 0);
                } else {
                    console.error('Invalid image Blob:', areaName, category, item.name, item.image);
                }
                img.alt = item.name;

                // Add click handler for entity submenu
                container.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEntitySubmenu(item, category, e.clientX, e.clientY);
                });

                // Existing hover handlers
                container.addEventListener('mouseover', () => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<strong>${item.name}</strong><br>${item.description}<br><img src="${img.src}" alt="${item.name}" style="width: 100px; height: auto;">`;
                });

                container.addEventListener('mousemove', (e) => {
                    tooltip.style.left = e.pageX + 10 + 'px';
                    tooltip.style.top = e.pageY + 10 + 'px';
                });

                container.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });

                container.appendChild(img);
                container.appendChild(nameOverlay);
                row.appendChild(container);
            });
            imageGrid.appendChild(row);
        }
    });
}

function openEntitySubmenu(entity, category, x, y) {
    console.log('Opening entity submenu for:', entity, 'category:', category);
    // Remove any existing submenu and its handler
    let submenu = document.getElementById('entitySubmenu');
    if (submenu) {
        console.log('Removing existing submenu');
        // Remove the old click handler if it exists
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
        console.log('Edit button clicked');
        openUnifiedEditor(entity, category);
        submenu.remove();
        if (submenu.closeHandler) {
            document.removeEventListener('click', submenu.closeHandler);
        }
    };

    // Special handling for followers
    const isFollower = followers.some(f => f.name === entity.name);
    console.log('Is follower check:', isFollower, 'for entity:', entity.name);
    console.log('Current followers:', followers.map(f => f.name));
    
    if (isFollower) {
        console.log('Creating dismiss button for follower');
        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.onclick = (e) => {
            e.stopPropagation();
            console.log('Dismiss button clicked for:', entity.name);
            dismissFollower(entity);
            updateFollowerArt();
            submenu.remove();
            if (submenu.closeHandler) {
                document.removeEventListener('click', submenu.closeHandler);
            }
        };
        submenu.appendChild(editBtn);
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

        submenu.appendChild(editBtn);
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

    console.log('Submenu added to document body at:', posX, posY);
    console.log('Submenu dimensions:', menuRect.width, menuRect.height);

    // Create the close handler and store it on the submenu element
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
    // Create a temporary location object
    const tempLocation = {
        name: '',
        description: '',
        x: x,
        y: y,
        visual: '',
        seed: Math.floor(Math.random() * 4294967295) + 1,
        image: 'placeholder.png',
        people: [],
        things: [],
        creatures: [],
        sublocations: {}
    };

    // Open the unified editor with the temporary location
    // The path is null since this is a new location
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

    if (item.image) {
        const previewImage = document.createElement('img');
        previewImage.className = 'editor-preview-image';
        previewImage.style.width = '100%';
        previewImage.style.height = '100%';
        previewImage.style.objectFit = 'cover';
        if (item.image instanceof Blob) {
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
                const artBlob = await generateArt(posprompt + item.visual, negprompt, item.seed);
                if (artBlob instanceof Blob) {
                    item.image = artBlob;
                    previewImage.src = URL.createObjectURL(artBlob);
                    if (path === currentArea) {
                        document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
                    }
                    if (path) {
                        const locationElement = document.getElementById(`location-${path}`);
                        if (locationElement) {
                            locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
                        }
                    }
                    updateImageGrid(currentArea);
                }
            };
            previewSection.appendChild(refreshImageBtn);
        }
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
            }
        }

        if (!path && type === 'location' && item.x !== undefined && item.y !== undefined) {
            await generateArea(newName, item.description, item.x, item.y);
        }

        overlay.remove();
        if (path) {
            updateSublocationRow(currentArea);
        } else {
            updateImageGrid(currentArea);
            updateFollowerArt();
        }
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
    const season = getSeason();
    
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
        followersContainer.style.width = '30%';
        const width = `${100 / followers.length}%`;
        
        // Update existing images' widths first
        Array.from(followersContainer.children).forEach(img => {
            img.style.width = width;
        });

        // Add/update followers
        followers.forEach((follower) => {
            let img = followersContainer.querySelector(`img[data-follower-name="${follower.name}"]`);
            
            if (!img) {
                img = document.createElement('img');
                img.classList.add('follower-image', 'show');
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
            }
        });

        // Remove any followers that are no longer in the list
        Array.from(followersContainer.children).forEach(img => {
            const followerName = img.dataset.followerName;
            if (!followers.some(f => f.name === followerName)) {
                if (img.src && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
                followersContainer.removeChild(img);
            }
        });
    } else {
        followersContainer.style.width = '0';
        
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

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

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('fileInput').addEventListener('change', loadFromFile);
});

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
    const overlay = document.getElementById('settingsOverlay');
    overlay.style.display = 'none';
}

function saveSettings() {
    const form = document.getElementById('settingsForm');
    // Update settings with form values
    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            const input = form.elements[key];
            if (input) {
                if (input.type === 'checkbox') {
                    settings[key] = input.checked;
                } else if (input.tagName === 'TEXTAREA') {
                    settings[key] = JSON.parse(input.value);
                } else {
                    if (!isNaN(input.value) && input.value.trim() !== '') {
                        settings[key] = parseInt(input.value);
                    } else {
                        settings[key] = input.value.replace(/\\n/g, '\n');
                    }
                }
            }
        }
    }
    document.getElementById('q1').style.height = settings.q1_height;
    document.getElementById('q2').style.height = settings.q2_height;
    content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;
    closeSettings();
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
    // Remove any existing submenu
    let submenu = document.getElementById('entitySubmenu');
    if (submenu) {
        submenu.remove();
    }

    submenu = document.createElement('div');
    submenu.id = 'entitySubmenu';
    submenu.classList.add('submenu');
    submenu.style.display = 'block'; // Set display to block to make it visible

    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.onclick = () => {
        const newName = prompt('Enter new name:', entity.name);
        if (newName && newName !== entity.name) {
            renameEntity(newName, entity.name);
            submenu.remove();
        }
    };

    const editDescBtn = document.createElement('button');
    editDescBtn.textContent = 'Edit Description';
    editDescBtn.onclick = () => {
        openDescriptionEditor(entity, category);
        submenu.remove();
    };

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => {
        if (confirm(`Are you sure you want to remove ${entity.name}?`)) {
            const index = areas[currentArea][category].findIndex(item => item.name === entity.name);
            if (index > -1) {
                areas[currentArea][category].splice(index, 1);
                updateImageGrid(currentArea);
            }
        }
        submenu.remove();
    };

    const editVisualBtn = document.createElement('button');
    editVisualBtn.textContent = 'Edit Visual';
    editVisualBtn.onclick = () => {
        openVisualEditor(entity, category);
        submenu.remove();
    };

    submenu.appendChild(renameBtn);
    submenu.appendChild(editDescBtn);
    submenu.appendChild(editVisualBtn);
    submenu.appendChild(removeBtn);

    submenu.style.left = x + 'px';
    submenu.style.top = y + 'px';
    submenu.style.position = 'fixed'; // Ensure it's positioned relative to viewport

    document.body.appendChild(submenu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeSubmenu(e) {
        if (!submenu.contains(e.target)) {
            submenu.remove();
            document.removeEventListener('click', closeSubmenu);
        }
    });
}

function openDescriptionEditor(entity, category) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.classList.add('editor-container');

    const content = document.createElement('div');
    content.className = 'editor-content';

    const textarea = document.createElement('textarea');
    textarea.value = entity.description;
    textarea.className = 'setting-item textarea';
    textarea.style.minHeight = '300px';
    content.appendChild(textarea);

    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Changes';
    saveBtn.className = 'btn-primary';
    saveBtn.onclick = async () => {
        entity.description = textarea.value;
        overlay.remove();
        updateImageGrid(currentArea);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.onclick = () => {
        overlay.remove();
    };

    actionButtons.appendChild(saveBtn);
    actionButtons.appendChild(cancelBtn);

    editor.appendChild(content);
    editor.appendChild(actionButtons);
    overlay.appendChild(editor);
    document.body.appendChild(overlay);

    setTimeout(() => textarea.focus(), 100);
}

function openVisualEditor(entity, category) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.classList.add('editor-container');

    const content = document.createElement('div');
    content.className = 'editor-content';

    // Image Preview Section
    const previewSection = document.createElement('div');
    previewSection.className = 'editor-section';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(entity.image);
    img.className = 'editor-preview-image';
    previewSection.appendChild(img);
    
    // Prompt Section
    const promptSection = document.createElement('div');
    promptSection.className = 'editor-section';
    
    const promptContainer = document.createElement('div');
    promptContainer.className = 'setting-item';
    
    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'Visual Prompt';
    promptContainer.appendChild(promptLabel);
    
    const visualPrompt = document.createElement('textarea');
    visualPrompt.value = entity.visual;
    visualPrompt.style.minHeight = '100px';
    promptContainer.appendChild(visualPrompt);
    
    promptSection.appendChild(promptContainer);

    // Seed Section
    const seedContainer = document.createElement('div');
    seedContainer.className = 'setting-item';
    
    const seedLabel = document.createElement('label');
    seedLabel.textContent = 'Seed';
    seedContainer.appendChild(seedLabel);
    
    const seedInput = document.createElement('input');
    seedInput.type = 'number';
    seedInput.value = entity.seed;
    seedContainer.appendChild(seedInput);
    
    promptSection.appendChild(seedContainer);

    content.appendChild(previewSection);
    content.appendChild(promptSection);

    const actionButtons = document.createElement('div');
    actionButtons.className = 'settings-actions';

    const regeneratePromptBtn = document.createElement('button');
    regeneratePromptBtn.textContent = 'Regenerate Prompt';
    regeneratePromptBtn.className = 'btn-secondary';
    regeneratePromptBtn.onclick = async () => {
        const newPrompt = await generateVisualPrompt(entity.name, entity.description);
        visualPrompt.value = category === 'things' ? `(${entity.name}), ${newPrompt}` : newPrompt;
        entity.visual = visualPrompt.value;
    };

    const regenerateBtn = document.createElement('button');
    regenerateBtn.textContent = 'Regenerate Image';
    regenerateBtn.className = 'btn-secondary';
    regenerateBtn.onclick = async () => {
        entity.visual = visualPrompt.value;
        entity.seed = parseInt(seedInput.value);
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
        const artBlob = await generateArt(posprompt + entity.visual, negprompt, entity.seed);
        if (artBlob instanceof Blob) {
            entity.image = artBlob;
            img.src = URL.createObjectURL(artBlob);
        }
    };

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Changes';
    saveBtn.className = 'btn-primary';
    saveBtn.onclick = () => {
        entity.visual = visualPrompt.value;
        entity.seed = parseInt(seedInput.value);
        overlay.remove();
        updateImageGrid(currentArea);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.onclick = () => {
        overlay.remove();
        updateImageGrid(currentArea);
    };

    actionButtons.appendChild(regeneratePromptBtn);
    actionButtons.appendChild(regenerateBtn);
    actionButtons.appendChild(saveBtn);
    actionButtons.appendChild(cancelBtn);

    editor.appendChild(content);
    editor.appendChild(actionButtons);
    overlay.appendChild(editor);
    document.body.appendChild(overlay);

    setTimeout(() => visualPrompt.focus(), 100);
}

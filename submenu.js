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

    // Main content area with flex layout
    const content = document.createElement('div');
    content.className = 'editor-content';
    content.style.display = 'flex';
    content.style.gap = '10px';
    content.style.height = '100%';
    content.style.overflow = 'hidden';

    // Left side - Preview and Name
    const leftColumn = document.createElement('div');
    leftColumn.className = 'editor-column';
    leftColumn.style.flex = '1';

    // Preview section with corner refresh button
    const previewSection = document.createElement('div');
    previewSection.className = 'editor-section preview-section';
    previewSection.style.position = 'relative';
    previewSection.style.aspectRatio = '1';

    const previewImage = document.createElement('img');
    previewImage.className = 'editor-preview-image';
    previewImage.style.width = '100%';
    previewImage.style.height = '100%';
    
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
    rightColumn.style.flex = '1';
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
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
            const artBlob = await generateArt(visualInput.value, "", Math.floor(Math.random() - 0.5));
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

    const refreshNameBtn = document.createElement('button');
    refreshNameBtn.className = 'refresh-button top-right';
    refreshNameBtn.innerHTML = '🔄';
    refreshNameBtn.title = 'Generate Random Name';
    refreshNameBtn.onclick = async () => {
        const characterContext =  descInput?.value || conceptInput?.value;
        const prompt = `World Description: ${settings.world_description}\n\n [Generate 5 player names. ${characterContext ? `\nFor a character who is described as ${characterContext}` : ''}.
            Format as 5 names, one per line, without explanations, descriptions, or anything but the name on the line. Each name should either be a first and last name or singular name as appropriate for the world and character.]`;
        const names = await generateText(settings.creative_question_param, prompt);
        const nameList = names.trim().replaceAll('\n\n', '\n').split('\n').map(n => n.trim());
        const selectedName = nameList[Math.floor(Math.random() * nameList.length)];
        nameInput.value = selectedName;
    };
    nameGroup.appendChild(refreshNameBtn);

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
            `World Description: ${settings.world_description}\n\n[Write a visual description of "${nameInput.value}, a ${conceptInput.value}" without making direct references to the quoted text or using name. You absolutely must use gendered pronouns. Be creative in adding details and write a single paragraph description. Begin with 2 sentences describing notable physical features and follow with 2 sentences describing attitude, dispositon, or apparrent motivation.]`);
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

    // Movement strings section
    const movementGroup = document.createElement('div');
    movementGroup.className = 'editor-section movement-section';

    const localGroup = document.createElement('div');
    const localLabel = document.createElement('label');
    localLabel.textContent = 'Local Movement:';
    const localInput = document.createElement('input');
    localInput.type = 'text';
    localInput.value = settings.player_local_movement || 'walks';
    localGroup.appendChild(localLabel);
    localGroup.appendChild(localInput);

    const distantGroup = document.createElement('div');
    const distantLabel = document.createElement('label');
    distantLabel.textContent = 'Distant Movement:';
    const distantInput = document.createElement('input');
    distantInput.type = 'text';
    distantInput.value = settings.player_distant_movement || 'walks';
    distantGroup.appendChild(distantLabel);
    distantGroup.appendChild(distantInput);

    movementGroup.appendChild(localGroup);
    movementGroup.appendChild(distantGroup);
    editorSection.appendChild(movementGroup);

    // Approaches section
    const approachesGroup = document.createElement('div');
    approachesGroup.className = 'editor-section approaches-section';

    const approachesHeader = document.createElement('div');
    approachesHeader.className = 'approaches-header';

    const approachesLabel = document.createElement('label');
    approachesLabel.textContent = 'Approaches:';
    
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'refresh-button';
    regenerateBtn.innerHTML = '🔄';
    regenerateBtn.title = 'Randomly Assign Approaches';
    regenerateBtn.onclick = () => {
        const values = [0, 1, 1, 2, 2, 3];
        const shuffled = values.sort(() => Math.random() - 0.5);
        Object.keys(approaches).forEach((approach, index) => {
            approaches[approach].value = shuffled[index];
            // Update the corresponding input element's value
            const input = approachesGrid.querySelector(`input[data-approach="${approach}"]`);
            if (input) {
                input.value = shuffled[index];
            }
        });
    };

    approachesHeader.appendChild(approachesLabel);
    approachesHeader.appendChild(regenerateBtn);
    approachesGroup.appendChild(approachesHeader);

    const approachesGrid = document.createElement('div');
    approachesGrid.className = 'approaches-grid';

    const approaches = {
        careful: { value: settings.charsheet_fae?.approaches?.careful || 1, label: 'Careful' },
        clever: { value: settings.charsheet_fae?.approaches?.clever || 2, label: 'Clever' },
        flashy: { value: settings.charsheet_fae?.approaches?.flashy || 3, label: 'Flashy' },
        forceful: { value: settings.charsheet_fae?.approaches?.forceful || 1, label: 'Forceful' },
        quick: { value: settings.charsheet_fae?.approaches?.quick || 2, label: 'Quick' },
        sneaky: { value: settings.charsheet_fae?.approaches?.sneaky || 0, label: 'Sneaky' }
    };

    Object.entries(approaches).forEach(([key, data]) => {
        const approachGroup = document.createElement('div');
        
        const label = document.createElement('label');
        label.textContent = data.label;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '8';
        input.value = data.value;
        input.dataset.approach = key; // Add data attribute to identify the approach
        
        approachGroup.appendChild(label);
        approachGroup.appendChild(input);
        approachesGrid.appendChild(approachGroup);
    });

    approachesGroup.appendChild(approachesGrid);
    editorSection.appendChild(approachesGroup);

    // Aspects section
    const aspectsGroup = document.createElement('div');
    aspectsGroup.style.position = 'relative';
    const aspectsLabel = document.createElement('label');
    aspectsLabel.textContent = 'Character Aspects:';
    
    // Create aspect inputs with improved generation
    const aspectInputs = [];
    for (let i = 0; i < 3; i++) {
        const aspectGroup = document.createElement('div');
        aspectGroup.style.display = 'flex';
        aspectGroup.style.alignItems = 'center';
        aspectGroup.style.gap = '8px';
        aspectGroup.style.position = 'relative';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = settings.charsheet_fae?.aspects?.[i] || '';
        input.style.flex = '1';
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-button';
        refreshBtn.innerHTML = '🔄';
        refreshBtn.title = 'Generate Aspect';
        refreshBtn.style.position = 'static';
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

    // Trouble aspect with improved alignment
    const troubleGroup = document.createElement('div');
    troubleGroup.style.display = 'flex';
    troubleGroup.style.alignItems = 'center';
    troubleGroup.style.gap = '8px';
    troubleGroup.style.marginTop = '20px';

    const troubleInput = document.createElement('input');
    troubleInput.type = 'text';
    troubleInput.value = settings.charsheet_fae?.trouble || '';
    troubleInput.style.flex = '1';

    const refreshTroubleBtn = document.createElement('button');
    refreshTroubleBtn.className = 'refresh-button';
    refreshTroubleBtn.innerHTML = '🔄';
    refreshTroubleBtn.title = 'Generate Trouble';
    refreshTroubleBtn.style.position = 'static';
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
    editorSection.appendChild(movementGroup);
    editorSection.appendChild(approachesGroup);
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
        settings.player_local_movement = localInput.value;
        settings.player_distant_movement = distantInput.value;
        
        if (!settings.charsheet_fae) settings.charsheet_fae = {};
        settings.charsheet_fae.high_concept = conceptInput.value;
        settings.charsheet_fae.aspects = aspectInputs.map(input => input.value);
        settings.charsheet_fae.trouble = troubleInput.value;

        // Save approaches
        settings.charsheet_fae.approaches = {};
        Object.entries(approaches).forEach(([key, data]) => {
            const input = approachesGrid.querySelector(`input[data-approach="${key}"]`);
            settings.charsheet_fae.approaches[key] = parseInt(input.value);
        });

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

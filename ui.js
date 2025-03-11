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
    form.innerHTML = ''; // Clear the form

    // Dynamically populate the form with current settings
    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            const value = settings[key];
            const label = document.createElement('label');
            label.textContent = key;
            form.appendChild(label);

            if (typeof value === 'object') {
                const textarea = document.createElement('textarea');
                textarea.id = key;
                textarea.name = key;
                textarea.value = JSON.stringify(value, null, 2);
                form.appendChild(textarea);
            } else {
                const input = document.createElement('input');
                input.type = typeof value === 'boolean' ? 'checkbox' : 'text';
                input.id = key;
                input.name = key;
                if (typeof value === 'boolean') {
                    input.checked = value;
                } else {
                    if (typeof value === 'string') {
                        input.value = value.replace(/\n/g, '\\n');
                    } else {
                        input.value = value;
                    }
                }
                form.appendChild(input);
            }
        }
    }

    overlay.style.display = 'flex';
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
    editor.classList.add('settings-container');

    const textarea = document.createElement('textarea');
    textarea.value = entity.description;
    textarea.style.height = '200px';
    textarea.style.marginBottom = '10px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.onclick = async () => {
        entity.description = textarea.value;
        overlay.remove();
        updateImageGrid(currentArea);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
        overlay.remove();
    };

    editor.appendChild(textarea);
    editor.appendChild(saveBtn);
    editor.appendChild(cancelBtn);
    overlay.appendChild(editor);
    document.body.appendChild(overlay);
}

function openVisualEditor(entity, category) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.classList.add('settings-container');
    editor.style.width = '80%';
    editor.style.maxWidth = '800px';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(entity.image);
    img.style.width = '100%';
    img.style.maxHeight = '300px';
    img.style.objectFit = 'contain';
    img.style.marginBottom = '10px';

    const visualPrompt = document.createElement('textarea');
    visualPrompt.value = entity.visual;
    visualPrompt.style.height = '100px';
    visualPrompt.style.marginBottom = '10px';

    const seedInput = document.createElement('input');
    seedInput.type = 'number';
    seedInput.value = entity.seed;
    seedInput.style.marginBottom = '10px';

    const regenerateBtn = document.createElement('button');
    regenerateBtn.textContent = 'Regenerate Image';
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

    const regeneratePromptBtn = document.createElement('button');
    regeneratePromptBtn.textContent = 'Regenerate Prompt';
    regeneratePromptBtn.onclick = async () => {
        const newPrompt = await generateVisualPrompt(entity.name, entity.description);
        visualPrompt.value = category === 'things' ? `(${entity.name}), ${newPrompt}` : newPrompt;
        entity.visual = visualPrompt.value;
    };

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save & Close';
    saveBtn.onclick = () => {
        overlay.remove();
        updateImageGrid(currentArea);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
        overlay.remove();
        updateImageGrid(currentArea);
    };

    editor.appendChild(img);
    editor.appendChild(document.createElement('br'));
    editor.appendChild(document.createTextNode('Visual Prompt:'));
    editor.appendChild(visualPrompt);
    editor.appendChild(document.createTextNode('Seed:'));
    editor.appendChild(seedInput);
    editor.appendChild(regeneratePromptBtn);
    editor.appendChild(regenerateBtn);
    editor.appendChild(saveBtn);
    editor.appendChild(cancelBtn);

    overlay.appendChild(editor);
    document.body.appendChild(overlay);
}

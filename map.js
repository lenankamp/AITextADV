// Map dragging functionality
let isDragging = false;
let dragStartX, dragStartY;
let scale = 1; // Initial scale
const minScale = 0.05; // Minimum zoom level
const maxScale = 5; // Maximum zoom level
let longPressTimer = null;
let longPressX, longPressY;
const LONG_PRESS_DURATION = 500; // milliseconds

const map = document.getElementById('map');
const submenu = document.createElement('div');
submenu.classList.add('submenu');
document.body.appendChild(submenu);

map.addEventListener('mousedown', (e) => {
    isDragging = false; // Start as not dragging
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    map.style.cursor = 'grabbing';
    
    // Start long press timer
    longPressX = e.clientX - map.getBoundingClientRect().left;
    longPressY = e.clientY - map.getBoundingClientRect().top;
    longPressTimer = setTimeout(() => {
        if (!isDragging) {
            openNewLocationPrompt(longPressX / scale, longPressY / scale);
        }
    }, LONG_PRESS_DURATION);
});

map.addEventListener('mousemove', (e) => {
    // Only check for drag if mouse button is down (which sets dragStartX/Y)
    if (dragStartX !== undefined && dragStartY !== undefined) {
        if (Math.abs(e.clientX - dragStartX) > 5 || Math.abs(e.clientY - dragStartY) > 5) {
            isDragging = true;
            clearTimeout(longPressTimer);
        }
        if (isDragging) {
            const x = e.clientX - dragStartX + parseInt(map.style.left || '0');
            const y = e.clientY - dragStartY + parseInt(map.style.top || '0');
            map.style.left = `${x}px`;
            map.style.top = `${y}px`;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        }
    }
});

map.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
    isDragging = false;
    dragStartX = undefined;
    dragStartY = undefined;
    map.style.cursor = 'grab';
});

map.addEventListener('mouseleave', () => {
    clearTimeout(longPressTimer);
    isDragging = false;
    dragStartX = undefined;
    dragStartY = undefined;
    map.style.cursor = 'grab';
});

// Add mouse wheel listener for zooming
map.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.2;
    const mouseX = e.clientX - map.getBoundingClientRect().left;
    const mouseY = e.clientY - map.getBoundingClientRect().top;
    const wheel = e.deltaY < 0 ? 1 : -1;

    const zoom = Math.exp(wheel * zoomIntensity);
    const newScale = scale * zoom;

    // Ensure the new scale is within the allowed range
    if (newScale < minScale || newScale > maxScale) return;

    scale = newScale;

    const newWidth = map.offsetWidth * zoom;
    const newHeight = map.offsetHeight * zoom;

    const dx = mouseX * (zoom - 1);
    const dy = mouseY * (zoom - 1);

    map.style.width = `${newWidth}px`;
    map.style.height = `${newHeight}px`;
    map.style.left = `${map.offsetLeft - dx}px`;
    map.style.top = `${map.offsetTop - dy}px`;

    // Adjust locations
    document.querySelectorAll('.location').forEach(location => {
        const name = location.id.replace('location-', '');
        location.style.left = `${areas[name].x * scale}px`;
        location.style.top = `${areas[name].y * scale}px`;
    });
});

// Add locations to the map
function addLocation(name) {
    const tooltip = document.getElementById('tooltip');
    const location = document.createElement('div');
    location.classList.add('location');
    location.id = `location-${name}`;
    location.style.left = `${areas[name].x * scale}px`;
    location.style.top = `${areas[name].y * scale}px`;
    location.style.width = '50px'; // Set the width of the square
    location.style.height = '50px'; // Set the height of the square
    if (areas[name].image instanceof Blob)
        location.style.backgroundImage = `url(${URL.createObjectURL(areas[name].image)}`; // Set the background image
    else
        location.style.backgroundImage = `url(placeholder.png)`; // Set the background image
    location.style.backgroundSize = 'cover'; // Ensure the image covers the square
    location.style.border = '1px solid #ccc'; // Optional: Add a border to the square
    location.addEventListener('click', (e) => {
        e.stopPropagation();
        openSubmenu(name, e.clientX, e.clientY);
    });
    location.addEventListener('mouseover', () => {
        tooltip.style.display = 'block';
        let tooltipContent = `<strong>${name}</strong><br>${areas[name].description}`;
        if (areas[name].image instanceof Blob) {
            tooltipContent += `<br><img src="${URL.createObjectURL(areas[name].image)}" alt="${name}" style="width: 100px; height: auto;">`;
        }
        // Add sublocation information to tooltip
        if (Object.keys(areas[name].sublocations).length > 0) {
            tooltipContent += '<br><br>Sublocations:<br>';
            for (const [subName, subloc] of Object.entries(areas[name].sublocations)) {
                tooltipContent += `- ${subName}: ${subloc.description}<br>`;
            }
        }
        tooltip.innerHTML = tooltipContent;
    });
    location.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
    });
    location.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
    map.appendChild(location);
}

// Open submenu for a location
function openSubmenu(name, x, y) {
    let menuContent = `<strong>${name}</strong><br>`;
    menuContent += `<button onclick="goToLocation('${name}')">Enter Area</button><br>`;
    
    // Add buttons for sublocations if they exist
    if (Object.keys(areas[name].sublocations).length > 0) {
        menuContent += '<br>Sublocations:<br>';
        for (const subName of Object.keys(areas[name].sublocations)) {
            menuContent += `<button onclick="goToLocation('${name}/${subName}')">Enter ${subName}</button><br>`;
        }
    }
    
    submenu.innerHTML = menuContent;
    submenu.style.left = `${x}px`;
    submenu.style.top = `${y}px`;
    submenu.style.display = 'block';
    updateSublocationRow(currentArea);
}

// Close submenu when clicking outside
document.addEventListener('click', () => {
    submenu.style.display = 'none';
});

// Go to a location
function goToLocation(name) {
    moveToArea(name, currentArea).then(() => {
        updateSublocationRow(name);
    });
}

function openNewLocationPrompt(x, y) {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('newLocationOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'newLocationOverlay';
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.classList.add('settings-container');

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Location Name:';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.required = true;

    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description (optional):';
    const descInput = document.createElement('textarea');
    descInput.style.height = '100px';

    const createBtn = document.createElement('button');
    createBtn.textContent = 'Create';
    createBtn.onclick = async () => {
        if (nameInput.value.trim()) {
            await generateArea(x, y, nameInput.value.trim(), descInput.value.trim());
            overlay.remove();
        }
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => overlay.remove();

    container.appendChild(nameLabel);
    container.appendChild(nameInput);
    container.appendChild(descLabel);
    container.appendChild(descInput);
    container.appendChild(createBtn);
    container.appendChild(cancelBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Focus the name input
    nameInput.focus();
}

function updateSublocationRow(currentAreaPath) {
    // Remove existing row if it exists
    const existingRow = document.querySelector('.sublocation-row');
    if (existingRow) {
        existingRow.remove();
    }

    const row = document.createElement('div');
    row.classList.add('sublocation-row');

    // Add parent location if we're in a sublocation
    if (currentAreaPath.includes('/')) {
        const parentPath = currentAreaPath.split('/').slice(0, -1).join('/');
        const parentArea = areas[parentPath];
        addSublocationImage(row, parentArea, parentPath, true);
    }

    // Add current area and its sublocations
    const currentArea = areas[currentAreaPath];
    for (const [subName, subloc] of Object.entries(currentArea.sublocations)) {
        const path = subloc.path;
        const area = areas[path] || subloc;
        addSublocationImage(row, area, path, false);
    }

    document.querySelector('.map-container').appendChild(row);
}

function addSublocationImage(container, area, path, isParent) {
    const img = document.createElement('img');
    img.classList.add('sublocation-image');
    if (area.image instanceof Blob) {
        img.src = URL.createObjectURL(area.image);
    } else {
        img.src = 'placeholder.png';
    }
    img.title = isParent ? `Parent: ${path}` : path.split('/').pop();
    
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        openSublocationMenu(area, path, e.clientX, e.clientY);
    });
    
    container.appendChild(img);
}

function openSublocationMenu(area, path, x, y) {
    // Remove any existing submenu
    const existingSubmenu = document.querySelector('.submenu');
    if (existingSubmenu) {
        existingSubmenu.remove();
    }

    const menu = document.createElement('div');
    menu.classList.add('submenu');

    // Add enter button
    const enterBtn = document.createElement('button');
    enterBtn.textContent = `Enter ${path.split('/').pop()}`;
    enterBtn.onclick = () => {
        goToLocation(path);
        menu.remove();
    };
    menu.appendChild(enterBtn);

    // Add edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Location';
    editBtn.onclick = () => {
        openLocationEditor(area, path);
        menu.remove();
    };
    menu.appendChild(editBtn);

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeSubMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeSubMenu);
        }
    });
}

function openLocationEditor(area, path) {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.style.display = 'flex';

    const editor = document.createElement('div');
    editor.classList.add('settings-container');
    editor.style.width = '80%';

    let previewImage;
    if (areas[path]) {
        // Full location editor for generated areas
        previewImage = document.createElement('img');
        if (area.image instanceof Blob) {
            previewImage.src = URL.createObjectURL(area.image);
        } else {
            previewImage.src = 'placeholder.png';
        }
        previewImage.style.width = '100%';
        previewImage.style.maxHeight = '300px';
        previewImage.style.objectFit = 'contain';
        previewImage.style.marginBottom = '10px';
        editor.appendChild(previewImage);
    }

    // Name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Location Name:';
    const nameInput = document.createElement('input');
    nameInput.value = path.split('/').pop();
    editor.appendChild(nameLabel);
    editor.appendChild(nameInput);

    // Description input
    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description:';
    const descInput = document.createElement('textarea');
    descInput.value = area.description;
    descInput.style.height = '100px';
    editor.appendChild(descLabel);
    editor.appendChild(descInput);

    let visualInput;
    if (areas[path]) {
        // Visual prompt input for generated areas
        const visualLabel = document.createElement('label');
        visualLabel.textContent = 'Visual Prompt:';
        visualInput = document.createElement('textarea');
        visualInput.value = area.visual || '';
        visualInput.style.height = '100px';
        editor.appendChild(visualLabel);
        editor.appendChild(visualInput);

        // Seed input
        const seedLabel = document.createElement('label');
        seedLabel.textContent = 'Seed:';
        const seedInput = document.createElement('input');
        seedInput.type = 'number';
        seedInput.value = area.seed || Math.floor(Math.random() * 4294967295) + 1;
        editor.appendChild(seedLabel);
        editor.appendChild(seedInput);

        // Create button container for all action buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.flexWrap = 'wrap';

        // Regenerate visual prompt button
        const regenPromptBtn = document.createElement('button');
        regenPromptBtn.textContent = 'Regenerate Visual Prompt';
        regenPromptBtn.onclick = async () => {
            const newVisual = await generateVisualPrompt(area.name, descInput.value);
            area.visual = newVisual;
            visualInput.value = newVisual;
        };
        buttonContainer.appendChild(regenPromptBtn);

        // Regenerate image button
        const regenBtn = document.createElement('button');
        regenBtn.textContent = 'Regenerate Image';
        regenBtn.onclick = async () => {
            area.visual = visualInput.value;
            area.seed = parseInt(seedInput.value);
            const artBlob = await generateArt(area.visual, "", area.seed);
            if (artBlob instanceof Blob) {
                area.image = artBlob;
                previewImage.src = URL.createObjectURL(artBlob);
                if (path === currentArea) {
                    document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
                }
                const locationElement = document.getElementById(`location-${path}`);
                if (locationElement) {
                    locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
                }
                updateImageGrid(currentArea);
            }
        };
        buttonContainer.appendChild(regenBtn);

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Changes';
        saveBtn.onclick = () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== path.split('/').pop()) {
                // Update name in parent's sublocations
                const parentPath = path.split('/').slice(0, -1).join('/');
                const oldName = path.split('/').pop();
                const subloc = areas[parentPath].sublocations[oldName];
                delete areas[parentPath].sublocations[oldName];
                areas[parentPath].sublocations[newName] = subloc;
                subloc.name = newName;
                subloc.path = parentPath + '/' + newName;
                if (areas[path]) {
                    areas[subloc.path] = areas[path];
                    delete areas[path];
                }
            }
            area.description = descInput.value;
            if (areas[path]) {
                area.visual = visualInput.value;
                area.seed = parseInt(seedInput.value);
            }
            overlay.remove();
            updateSublocationRow(currentArea);
        };
        buttonContainer.appendChild(saveBtn);

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => overlay.remove();
        buttonContainer.appendChild(cancelBtn);

        editor.appendChild(buttonContainer);
    } else {
        // Simple save/cancel for non-generated areas
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';
        buttonContainer.style.justifyContent = 'center';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Changes';
        saveBtn.onclick = () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== path.split('/').pop()) {
                // Update name in parent's sublocations
                const parentPath = path.split('/').slice(0, -1).join('/');
                const oldName = path.split('/').pop();
                const subloc = areas[parentPath].sublocations[oldName];
                delete areas[parentPath].sublocations[oldName];
                areas[parentPath].sublocations[newName] = subloc;
                subloc.name = newName;
                subloc.path = parentPath + '/' + newName;
            }
            area.description = descInput.value;
            overlay.remove();
            updateSublocationRow(currentArea);
        };
        buttonContainer.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => overlay.remove();
        buttonContainer.appendChild(cancelBtn);

        editor.appendChild(buttonContainer);
    }

    overlay.appendChild(editor);
    document.body.appendChild(overlay);
}
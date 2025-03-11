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
}

// Close submenu when clicking outside
document.addEventListener('click', () => {
    submenu.style.display = 'none';
});

// Go to a location
function goToLocation(name) {
    moveToArea(name, currentArea);
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
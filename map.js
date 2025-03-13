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
        e.preventDefault();
        e.stopPropagation();
        const existingSubmenu = document.querySelector('.submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }
        openSubmenu(name, e.clientX, e.clientY);
    });
    location.addEventListener('mouseover', () => {
        tooltip.style.display = 'block';
        let tooltipContent = `<strong>${name}</strong><br>${areas[name].description}`;
        if (areas[name].image instanceof Blob) {
            tooltipContent += `<br><img src="${URL.createObjectURL(areas[name].image)}" alt="${name}" style="width: 60%; height: auto;">`;
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
    const menu = document.createElement('div');
    menu.classList.add('submenu');

    // Add enter button
    const enterBtn = document.createElement('button');
    enterBtn.textContent = `Enter ${name}`;
    enterBtn.onclick = () => {
        goToLocation(name, true);
        menu.remove();
    };
    menu.appendChild(enterBtn);

    // Add edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Location';
    editBtn.onclick = () => {
        openUnifiedEditor(areas[name], 'location', name);
        menu.remove();
    };
    menu.appendChild(editBtn);

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

// Update the global click handler
document.addEventListener('click', (e) => {
    const submenu = document.querySelector('.submenu');
    if (!submenu) return;

    const clickedOnSubmenu = e.target.closest('.submenu');
    const clickedOnLocation = e.target.closest('.location');
    const clickedOnSublocation = e.target.closest('.sublocation-image');

    if (!clickedOnSubmenu && !clickedOnLocation && !clickedOnSublocation) {
        submenu.remove();
    }
});

// Go to a location
function goToLocation(name, distant = false) {
    moveToArea(name, distant ? 2 : 1).then(() => {
        updateSublocationRow(name);
    });
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
        e.preventDefault();
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
    menu.setAttribute('data-source', 'sublocation');

    // Add enter button
    const enterBtn = document.createElement('button');
    enterBtn.textContent = `Enter ${path.split('/').pop()}`;
    enterBtn.onclick = () => {
        goToLocation(path, false);
        menu.remove();
    };
    menu.appendChild(enterBtn);

    // Add edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit Location';
    editBtn.onclick = () => {
        openUnifiedEditor(area, 'location', path);
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

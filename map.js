// Map dragging functionality
let isDragging = false;
let dragStartX, dragStartY;
let scale = 1; // Initial scale
const minScale = 0.05; // Minimum zoom level
const maxScale = 5; // Maximum zoom level
let longPressTimer = null;
let longPressX, longPressY;
const LONG_PRESS_DURATION = 500; // milliseconds
let lastTouchDistance = 0;

const map = document.getElementById('map');
const submenu = document.createElement('div');
submenu.classList.add('submenu');
document.body.appendChild(submenu);

// Create a shared tooltip
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
tooltip.style.display = 'none';
tooltip.style.position = 'fixed';
tooltip.style.zIndex = '1000';
tooltip.classList.add('tooltip');
document.body.appendChild(tooltip);

// Prevent default touch behaviors
map.addEventListener('touchstart', (e) => {
    if (e.target.closest('.sublocation-row')) return; // Allow touch events on sublocation row
    e.preventDefault();
}, { passive: false });

map.addEventListener('touchmove', (e) => {
    if (e.target.closest('.sublocation-row')) return; // Allow touch events on sublocation row
    e.preventDefault();
}, { passive: false });

// Handle both mouse click and touch tap events on the map
map.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.location')) {
        e.preventDefault();
        e.stopPropagation();
        const name = target.id.replace('location-', '');
        openSubmenu(name, e.clientX, e.clientY);
    }
});

// Touch start handler
map.addEventListener('touchstart', (e) => {
    if (e.target.closest('.sublocation-row')) return;
    
    isDragging = false;
    const touch = e.touches[0];
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    
    if (e.touches.length === 1) {
        // Start long press timer for single touch
        longPressX = touch.clientX - map.getBoundingClientRect().left;
        longPressY = touch.clientY - map.getBoundingClientRect().top;
        longPressTimer = setTimeout(() => {
            if (!isDragging) {
                openNewLocationPrompt(longPressX / scale, longPressY / scale);
            }
        }, LONG_PRESS_DURATION);
    } else if (e.touches.length === 2) {
        // Initialize pinch-zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    }
});

// Touch move handler
map.addEventListener('touchmove', (e) => {
    if (e.target.closest('.sublocation-row')) return;
    
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (dragStartX !== undefined && dragStartY !== undefined) {
            if (Math.abs(touch.clientX - dragStartX) > 5 || Math.abs(touch.clientY - dragStartY) > 5) {
                isDragging = true;
                clearTimeout(longPressTimer);
            }
            if (isDragging) {
                const x = touch.clientX - dragStartX + parseInt(map.style.left || '0');
                const y = touch.clientY - dragStartY + parseInt(map.style.top || '0');
                map.style.left = `${x}px`;
                map.style.top = `${y}px`;
                dragStartX = touch.clientX;
                dragStartY = touch.clientY;
            }
        }
    } else if (e.touches.length === 2) {
        // Handle pinch-zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (lastTouchDistance) {
            const zoomIntensity = 0.01;
            const zoom = currentDistance / lastTouchDistance;
            const newScale = scale * zoom;
            
            if (newScale >= minScale && newScale <= maxScale) {
                scale = newScale;
                
                const centerX = (touch1.clientX + touch2.clientX) / 2 - map.getBoundingClientRect().left;
                const centerY = (touch1.clientY + touch2.clientY) / 2 - map.getBoundingClientRect().top;
                
                const newWidth = map.offsetWidth * zoom;
                const newHeight = map.offsetHeight * zoom;
                
                const dx = centerX * (zoom - 1);
                const dy = centerY * (zoom - 1);
                
                map.style.width = `${newWidth}px`;
                map.style.height = `${newHeight}px`;
                map.style.left = `${map.offsetLeft - dx}px`;
                map.style.top = `${map.offsetTop - dy}px`;
                
                // Adjust locations with centering offset
                document.querySelectorAll('.location').forEach(location => {
                    const name = location.id.replace('location-', '');
                    location.style.left = `${(areas[name].x * scale) - 25}px`;
                    location.style.top = `${(areas[name].y * scale) - 25}px`;
                });
            }
        }
        lastTouchDistance = currentDistance;
    }
});

// Touch end handler
map.addEventListener('touchend', (e) => {
    if (!isDragging && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        handleLocationInteraction(e, touch.clientX, touch.clientY);
    }
    clearTimeout(longPressTimer);
    isDragging = false;
    dragStartX = undefined;
    dragStartY = undefined;
    lastTouchDistance = 0;
});

// Handle click events on the map with event delegation
map.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.location')) {
        e.preventDefault();
        e.stopPropagation();
        const name = target.id.replace('location-', '');
        openSubmenu(name, e.clientX, e.clientY);
    }
});

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

    // Adjust locations with centering offset
    document.querySelectorAll('.location').forEach(location => {
        const name = location.id.replace('location-', '');
        location.style.left = `${(areas[name].x * scale) - 25}px`;
        location.style.top = `${(areas[name].y * scale) - 25}px`;
    });
}, { passive: true });

// Add locations to the map
function addLocation(name) {
    const location = document.createElement('div');
    location.classList.add('location');
    location.id = `location-${name}`;
    
    // Set dimensions first so we can use them for centering
    location.style.width = '50px';
    location.style.height = '50px';
    
    // Center the location by offsetting by half its width and height
    location.style.left = `${(areas[name].x * scale) - 25}px`;
    location.style.top = `${(areas[name].y * scale) - 25}px`;
    
    if (areas[name].image instanceof Blob)
        location.style.backgroundImage = `url(${URL.createObjectURL(areas[name].image)})`; // Set the background image
    else
        location.style.backgroundImage = `url(placeholder.png)`; // Set the background image
    location.style.backgroundSize = 'cover'; // Ensure the image covers the square
    location.style.border = '1px solid #ccc';
    
    location.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const existingSubmenu = document.querySelector('.submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }
        openSubmenu(name, e.clientX, e.clientY);
    });

    const tooltip = document.getElementById('tooltip');
    location.addEventListener('mouseover', () => {
        tooltip.classList.add('tooltip-visible');
        let tooltipContent = `<strong>${name}</strong><br>${areas[name].description}`;
        if (areas[name].image instanceof Blob) {
            tooltipContent += `<br><img src="${URL.createObjectURL(areas[name].image)}" alt="${name}" style="width: 60%; height: auto;">`;
        }
        tooltip.innerHTML = tooltipContent;
    });

    location.addEventListener('mousemove', (e) => {
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
    });

    location.addEventListener('mouseout', () => {
        tooltip.classList.remove('tooltip-visible');
    });

    map.appendChild(location);
}

// Handle both mouse click and touch events for locations
function handleLocationInteraction(e, x, y) {
    const target = e.target;
    if (target.matches('.location')) {
        e.preventDefault();
        e.stopPropagation();
        const name = target.id.replace('location-', '');
        openSubmenu(name, x, y);
    }
}

// Open submenu for a location
function openSubmenu(name, x, y) {
    const menu = document.createElement('div');
    menu.classList.add('submenu');

    // Add enter button
    const enterBtn = document.createElement('button');
    enterBtn.textContent = `Enter ${name}`;
    enterBtn.onclick = () => {
        const distance = !currentArea.includes(name) ? Math.abs(areas[currentArea.split('/')[0]].y - areas[name.split('/')[0]].y) : 1;
        goToLocation(name, distance);
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

    // Ensure menu is positioned within viewport bounds
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let posX = x;
    let posY = y;
    
    // Adjust position if menu would overflow viewport
    if (posX + menuRect.width > viewportWidth) {
        posX = viewportWidth - menuRect.width - 10;
    }
    if (posY + menuRect.height > viewportHeight) {
        posY = viewportHeight - menuRect.height - 10;
    }
    
    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';

    // Add touch-friendly close handler
    const closeHandler = (e) => {
        if (!menu.contains(e.target) && !e.target.matches('.location')) {
            menu.remove();
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('touchstart', closeHandler);
        }
    };
    
    // Delay adding the handlers to prevent immediate closure
    requestAnimationFrame(() => {
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
    });
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
function goToLocation(name, distant = 0) {
    moveToArea(name, distant).then(() => {
        updateSublocationRow(name);
        centerMapOnLocation(name);
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
    const currentLocation = areas[currentAreaPath];
    for (const [subName, subloc] of Object.entries(currentLocation.sublocations)) {
        const path = subloc.path;
        const area = areas[path] || subloc;
        addSublocationImage(row, area, path, false);
    }

    document.querySelector('.map-container').appendChild(row);

    // Check if art queue is empty to process sublocation images
    if (isArtQueueEmpty()) {
        generateSublocationImages(currentAreaPath);
    } else {
        // Listen for queue empty event
        document.addEventListener('artQueueEmpty', () => generateSublocationImages(currentAreaPath), { once: true });
    }
}

async function generateSublocationImages(areaPath) {
    const currentLocation = areas[areaPath];
    if (!currentLocation || !currentLocation.sublocations) return;

    for (const [subName, subloc] of Object.entries(currentLocation.sublocations)) {
        // Skip if there's already a permanent image in areas
        if (areas[subloc.path]?.image) continue;
        
        // Skip if sublocation already has a temporary image
        if (subloc.tempImage) continue;

        // Generate a visual prompt from the sublocation description
        const visual = settings.autogenerate_prompts ? await generateVisualPrompt(subName, subloc.description) : subloc.description;
        const seed = Math.floor(Math.random() * 4294967295) + 1;
        
        // Generate temporary art for the sublocation
        const artBlob = await generateArt(visual, "", seed);
        if (artBlob instanceof Blob) {
            subloc.tempImage = artBlob;
            // Update the image in the sublocation row
            const img = document.querySelector(`.sublocation-image[title="${subName}"]`);
            if (img) {
                img.src = URL.createObjectURL(artBlob);
            }
        }
    }
}

function addSublocationImage(container, area, path, isParent) {
    const img = document.createElement('img');
    img.classList.add('sublocation-image');
    
    if (areas[path]?.image instanceof Blob) {
        // Use permanent image if available
        img.src = URL.createObjectURL(areas[path].image);
    } else if (!isParent && area.tempImage instanceof Blob) {
        // Use temporary image for sublocations if available
        img.src = URL.createObjectURL(area.tempImage);
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
        goToLocation(path, 1);
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

    // Ensure menu is positioned within viewport bounds
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let posX = x;
    let posY = y;
    
    // Adjust position if menu would overflow viewport
    if (posX + menuRect.width > viewportWidth) {
        posX = viewportWidth - menuRect.width - 10;
    }
    if (posY + menuRect.height > viewportHeight) {
        posY = viewportHeight - menuRect.height - 10;
    }
    
    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';

    // Add touch-friendly close handler
    const closeHandler = (e) => {
        if (!menu.contains(e.target) && !e.target.closest('.sublocation-image')) {
            menu.remove();
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('touchstart', closeHandler);
        }
    };
    
    // Delay adding the handlers to prevent immediate closure
    requestAnimationFrame(() => {
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
    });
}

// Center map view on a location
function centerMapOnLocation(locationPath) {
    const topLevelPath = locationPath.split('/')[0];
    const area = areas[topLevelPath];
    if (!area) return;

    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;

    // Calculate the center position
    const centerX = (mapContainer.clientWidth / 2) - (area.x * scale);
    const centerY = (mapContainer.clientHeight / 2) - (area.y * scale);

    // Smoothly animate to the new position
    map.style.transition = 'left 0.5s, top 0.5s';
    map.style.left = `${centerX}px`;
    map.style.top = `${centerY}px`;

    // Remove transition after animation
    setTimeout(() => {
        map.style.transition = '';
    }, 500);
}

// Call centerMapOnLocation when moving to a new area
document.addEventListener('DOMContentLoaded', () => {
    if (currentArea) {
        centerMapOnLocation(currentArea);
    }
});

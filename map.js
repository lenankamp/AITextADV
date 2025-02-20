// Map dragging functionality
let isDragging = false;
let dragStartX, dragStartY;

const map = document.getElementById('map');
const submenu = document.createElement('div');
submenu.classList.add('submenu');
document.body.appendChild(submenu);

map.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    document.addEventListener('mousemove', doDragMap, false);
    document.addEventListener('mouseup', stopDragMap, false);
});

function doDragMap(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    map.style.transform = `translate(${dx}px, ${dy}px)`;
}

function stopDragMap() {
    document.removeEventListener('mousemove', doDragMap, false);
    document.removeEventListener('mouseup', stopDragMap, false);
}

map.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX - map.offsetLeft;
    dragStartY = e.clientY - map.offsetTop;
    map.style.cursor = 'grabbing';
});

map.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const x = e.clientX - dragStartX;
        const y = e.clientY - dragStartY;
        map.style.left = `${x}px`;
        map.style.top = `${y}px`;
    }
});

map.addEventListener('mouseup', () => {
    isDragging = false;
    map.style.cursor = 'grab';
});

map.addEventListener('mouseleave', () => {
    isDragging = false;
    map.style.cursor = 'grab';
});

// Add locations to the map
function addLocation(name) {
    const tooltip = document.getElementById('tooltip');
    const location = document.createElement('div');
    location.classList.add('location');
    location.style.left = `${areas[name].x}px`;
    location.style.top = `${areas[name].y}px`;
    location.style.width = '50px'; // Set the width of the square
    location.style.height = '50px'; // Set the height of the square
    if (areas[name].image instanceof Blob)
        location.style.backgroundImage = `url(${URL.createObjectURL(areas[name].image)}`; // Set the background image
    location.style.backgroundSize = 'cover'; // Ensure the image covers the square
    location.style.border = '1px solid #ccc'; // Optional: Add a border to the square
    location.addEventListener('click', (e) => {
        e.stopPropagation();
        openSubmenu(name, e.clientX, e.clientY);
    });
    location.addEventListener('mouseover', () => {
        tooltip.style.display = 'block';
        tooltip.innerHTML = `<strong>${name}</strong><br>${areas[name].description}<br><img src="${URL.createObjectURL(areas[name].image)}" alt="${name}" style="width: 100px; height: auto;">`;
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
    submenu.innerHTML = `<strong>${name}</strong><br><button onclick="goToLocation('${name}')">Go</button>`;
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
    currentArea = name;
    updateImageGrid(name);
    document.getElementById('sceneart').src = URL.createObjectURL(areas[name].image);
    document.getElementById('sceneart').alt = areas[name].description;
    submenu.style.display = 'none';
}

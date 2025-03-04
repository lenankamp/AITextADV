// Map dragging functionality
let isDragging = false;
let dragStartX, dragStartY;
let scale = 1; // Initial scale
const minScale = 0.05; // Minimum zoom level
const maxScale = 5; // Maximum zoom level

const map = document.getElementById('map');
const submenu = document.createElement('div');
submenu.classList.add('submenu');
document.body.appendChild(submenu);

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
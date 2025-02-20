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

    const categories = ['people', 'things', 'hostiles'];
    categories.forEach(category => {
        if (areas[areaName][category]) {
            const row = document.createElement('div');
            row.classList.add('image-row');
            areas[areaName][category].forEach(item => {
                const img = document.createElement('img');
                if (item.image instanceof Blob) {
                    img.src = URL.createObjectURL(item.image);
                } else if(item.image == 'placeholder') {
                    img.src = 'placeholder.png';
                    setTimeout(async () => {
                        const artBlob = await generateArt(item.visual, "", item.seed);
                        if (artBlob instanceof Blob) {
                            item.image = artBlob;
                            img.src = URL.createObjectURL(artBlob);
                        }
                    }, 0);
                } else {
                    console.error('Invalid image Blob:', areaName, category, item.name, item.image);
                }
                img.alt = item.name;
                img.addEventListener('mouseover', () => {
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<strong>${item.name}</strong><br>${item.description}<br><img src="${img.src}" alt="${item.name}" style="width: 100px; height: auto;">`;
                });
                img.addEventListener('mousemove', (e) => {
                    tooltip.style.left = e.pageX + 10 + 'px';
                    tooltip.style.top = e.pageY + 10 + 'px';
                });
                img.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });
                row.appendChild(img);
            });
            imageGrid.appendChild(row);
        }
    });
}

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

function undoLastAction() {
    const output = document.getElementById('output');
    if (output.lastChild) {
        output.removeChild(output.lastChild);
    }
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

let db;
const request = indexedDB.open('gameData', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('data', { keyPath: 'id' });
};

request.onsuccess = function(event) {
    db = event.target.result;
    // Load last saved game state if it exists
    const transaction = db.transaction(['data'], 'readonly');
    const objectStore = transaction.objectStore('data');
    const getRequest = objectStore.get('gameState');
    getRequest.onsuccess = function(event) {
        if (event.target.result) {
            const data = event.target.result;
            areas = data.state.areas;
            currentArea = data.state.currentArea;
            document.getElementById('output').innerHTML = data.state.outputLog;
            updateImageGrid(currentArea);
            updateSublocationRow(currentArea);
        }
    };
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

async function saveGame() {
    const transaction = db.transaction(['data'], 'readwrite');
    const objectStore = transaction.objectStore('data');
    const data = {
        id: 'gameState',
        state: {
            areas: areas,
            currentArea: currentArea,
            outputLog: document.getElementById('output').innerHTML,
            settings: settings
        }
    };
    objectStore.put(data);
    await saveToFile(data);
}

async function saveToFile(data) {
    const images = {};

    // Function to process images in an area or sublocation
    const processAreaImages = (area, path) => {
        if (area.image instanceof Blob) {
            images[path] = area.image;
            area.image = null;
        }
        ['people', 'things', 'creatures'].forEach(category => {
            if (area[category]) {
                area[category].forEach(item => {
                    if (item.image instanceof Blob) {
                        images[item.name] = item.image;
                        item.image = null;
                    }
                });
            }
        });
    };

    // Process all areas and their sublocations
    for (const [areaName, area] of Object.entries(areas)) {
        processAreaImages(area, areaName);
    }

    const imagePromises = Object.keys(images).map(async key => {
        const imageBlob = images[key];
        const reader = new FileReader();
        return new Promise(resolve => {
            reader.onloadend = () => {
                images[key] = reader.result;
                resolve();
            };
            reader.readAsDataURL(imageBlob);
        });
    });

    await Promise.all(imagePromises);

    const playerImageBlob = await fetch(document.getElementById('playerart').src).then(res => res.blob());
    const playerImageReader = new FileReader();
    const playerImagePromise = new Promise(resolve => {
        playerImageReader.onloadend = () => {
            images['player'] = playerImageReader.result;
            resolve();
        };
        playerImageReader.readAsDataURL(playerImageBlob);
    });

    await playerImagePromise;

    const blob = new Blob([JSON.stringify({ data, images })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gameState.json';
    a.click();

    // Function to restore images in an area or sublocation
    const restoreAreaImages = async (area, path) => {
        if (images[path]) {
            area.image = await fetchImage(images[path]);
        }
        const categoryPromises = ['people', 'things', 'creatures'].map(async category => {
            if (area[category]) {
                const itemPromises = area[category].map(async item => {
                    if (images[item.name]) {
                        item.image = await fetchImage(images[item.name]);
                    }
                });
                await Promise.all(itemPromises);
            }
        });
        await Promise.all(categoryPromises);

    };

    // Restore all areas and their sublocations
    const areaPromises = Object.keys(areas).map(async area => {
        await restoreAreaImages(areas[area], area);
    });
    await Promise.all(areaPromises);
}

async function loadFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const { data, images } = JSON.parse(e.target.result);
            const output = document.getElementById('output');
            areas = data.state.areas;
            currentArea = data.state.currentArea;
            output.innerHTML = data.state.outputLog;
            settings = data.state.settings;
            output.scrollTop = output.scrollHeight;
        
            // Function to load images for an area and its sublocations
            const loadAreaImages = async (area, path) => {
                if (images[path]) {
                    area.image = await fetchImage(images[path]);
                }
                for (const category of ['people', 'things', 'creatures']) {
                    if (area[category]) {
                        const itemPromises = area[category].map(async item => {
                            if (images[item.name]) {
                                item.image = await fetchImage(images[item.name]);
                            }
                        });
                        await Promise.all(itemPromises);
                    }
                }
            };

            // Load images for all areas and their sublocations
            for (const [areaName, area] of Object.entries(areas)) {
                await loadAreaImages(area, areaName);
            }

            document.getElementById('q1').style.height = settings.q1_height;
            document.getElementById('q2').style.height = settings.q2_height;
            content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;

            updateImageGrid(currentArea);

            const currentAreaObj = areas[currentArea];
            if (currentAreaObj && currentAreaObj.image) {
                document.getElementById('sceneart').src = URL.createObjectURL(currentAreaObj.image);
                document.getElementById('sceneart').alt = currentAreaObj.description;
            }

            if (images['player']) {
                const playerImageBlob = await fetchImage(images['player']);
                document.getElementById('playerart').src = URL.createObjectURL(playerImageBlob);
            }

            // Clear and re-add locations from the map
            document.querySelectorAll('.location').forEach(location => {
                location.remove();
            });
            // Only add top-level areas to the map
            for (const area in areas) {
                addLocation(area);
            }

            // Update the sublocation row for the current area
            updateSublocationRow(currentArea);
        };
        reader.readAsText(file);
    }
}

async function loadImages(images) {
    for (const area in areas) {
        if (images[area]) {
            areas[area].image = await fetchImage(images[area]);
        }
        for (const category of ['people', 'things', 'creatures']) {
            if (areas[area][category]) {
                const itemPromises = areas[area][category].map(async item => {
                    if (images[item.name]) {
                        item.image = await fetchImage(images[item.name]);
                    }
                });
                await Promise.all(itemPromises);
            }
        }
    }
}

async function fetchImage(imageData) {
    const response = await fetch(imageData);
    const blob = await response.blob();
    return blob;
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('fileInput').addEventListener('change', loadFromFile);
});

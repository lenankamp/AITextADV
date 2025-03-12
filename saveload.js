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
    getRequest.onsuccess = async function(event) {
        if (event.target.result) {
            const data = event.target.result;
            await restoreGameState(data);
        }
    };
};

request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode);
};

async function saveGame(saveFile = false) {
    // First convert any blob URLs to data URLs
    const playerArt = document.getElementById('playerart');
    let playerImageDataUrl = playerArt.src;
    if (playerArt.src.startsWith('blob:')) {
        try {
            const response = await fetch(playerArt.src);
            const blob = await response.blob();
            playerImageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting player image:', error);
            playerImageDataUrl = null;
        }
    }

    const transaction = db.transaction(['data'], 'readwrite');
    const objectStore = transaction.objectStore('data');
    const data = {
        id: 'gameState',
        state: {
            areas: areas,
            currentArea: currentArea,
            outputLog: document.getElementById('output').innerHTML,
            settings: settings,
            playerImage: playerImageDataUrl
        }
    };
    objectStore.put(data);
    if (saveFile) {
        await saveToFile(data);
    }
}

async function saveToFile(data) {
    const images = {};

    // Save player image if it exists and isn't a placeholder
    const playerArt = document.getElementById('playerart');
    if (playerArt.src && !playerArt.src.includes('placeholder.png')) {
        // Check if it's already a data URL
        if (playerArt.src.startsWith('data:')) {
            images['player'] = playerArt.src;
        } else {
            try {
                const playerImageBlob = await fetch(playerArt.src).then(res => res.blob());
                const playerImageReader = new FileReader();
                await new Promise(resolve => {
                    playerImageReader.onloadend = () => {
                        images['player'] = playerImageReader.result;
                        resolve();
                    };
                    playerImageReader.readAsDataURL(playerImageBlob);
                });
            } catch (error) {
                console.error('Error processing player image:', error);
            }
        }
    }

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
        
        // If it's already a data URL, keep it as is
        if (typeof imageBlob === 'string' && imageBlob.startsWith('data:')) {
            return Promise.resolve();
        }
        
        // If it's not a Blob, try to convert it
        if (!(imageBlob instanceof Blob)) {
            if (typeof imageBlob === 'string' && imageBlob.startsWith('blob:')) {
                try {
                    const response = await fetch(imageBlob);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    return new Promise((resolve, reject) => {
                        reader.onloadend = () => {
                            images[key] = reader.result;
                            resolve();
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error(`Error converting blob URL for ${key}:`, error);
                    return Promise.resolve();
                }
            }
            console.warn(`Image for ${key} is not a Blob or valid URL, skipping...`);
            return Promise.resolve();
        }
        
        // Handle regular Blobs
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                images[key] = reader.result;
                resolve();
            };
            reader.onerror = () => {
                console.error(`Error reading image data for ${key}`);
                reject(reader.error);
            };
            reader.readAsDataURL(imageBlob);
        });
    });

    await Promise.all(imagePromises);

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
            await restoreGameState(data, images);
        };
        reader.readAsText(file);
    }
}

async function fetchImage(imageData) {
    // If it's already a data URL, convert it directly to blob
    if (imageData.startsWith('data:')) {
        const response = await fetch(imageData);
        return response.blob();
    }
    
    // Otherwise fetch from URL
    const response = await fetch(imageData);
    return response.blob();
}

function updateConsequences() {
    const consequencesDiv = document.getElementById('consequences');
    if (settings.charsheet_fae && settings.charsheet_fae.consequences) {
        let html = [];
        if (settings.charsheet_fae.consequences.mild) {
            html.push(...settings.charsheet_fae.consequences.mild.map(c => 
                `<div class="Mild">${c}</div>`
            ));
        }
        if (settings.charsheet_fae.consequences.moderate) {
            html.push(...settings.charsheet_fae.consequences.moderate.map(c => 
                `<div class="Moderate">${c}</div>`
            ));
        }
        if (settings.charsheet_fae.consequences.severe) {
            html.push(...settings.charsheet_fae.consequences.severe.map(c => 
                `<div class="Severe">${c}</div>`
            ));
        }
        consequencesDiv.innerHTML = html.join('');
    } else {
        consequencesDiv.innerHTML = '';
    }
}

function updateImageGrid(areaName) {
    const area = areas[areaName];
    if (!area) return;

    // Clear existing images and revoke any existing object URLs
    const sceneArt = document.getElementById('sceneart');
    if (sceneArt.src.startsWith('blob:')) {
        URL.revokeObjectURL(sceneArt.src);
    }
    sceneArt.src = 'placeholder.png';
    sceneArt.alt = ''; // Clear the alt text when resetting
    
    const imageGrid = document.getElementById('image-grid');
    // Revoke any existing object URLs in the image grid
    Array.from(imageGrid.getElementsByTagName('img')).forEach(img => {
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    });
    imageGrid.innerHTML = '';

    // Set scene art and description if available
    if (area.image) {
        if (area.image instanceof Blob) {
            sceneArt.src = URL.createObjectURL(area.image);
            sceneArt.alt = area.description || '';
        } else if (typeof area.image === 'string' && !area.image.startsWith('blob:')) {
            fetchImage(area.image)
                .then(blob => {
                    area.image = blob;
                    sceneArt.src = URL.createObjectURL(blob);
                    sceneArt.alt = area.description || '';
                })
                .catch(error => console.error('Error loading area image:', error));
        }
    }

    // Add category images
    ['people', 'things', 'creatures'].forEach(category => {
        if (area[category]) {
            area[category].forEach(item => {
                if (item.image) {
                    const img = document.createElement('img');
                    img.alt = item.name;
                    img.title = item.name;
                    if (item.image instanceof Blob) {
                        img.src = URL.createObjectURL(item.image);
                    } else if (typeof item.image === 'string' && !item.image.startsWith('blob:')) {
                        fetchImage(item.image)
                            .then(blob => {
                                item.image = blob;
                                img.src = URL.createObjectURL(blob);
                            })
                            .catch(error => console.error(`Error loading ${category} image:`, error));
                    }
                    imageGrid.appendChild(img);
                }
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('fileInput').addEventListener('change', loadFromFile);
    
    // Load last saved game state if it exists
    if (db) {
        const transaction = db.transaction(['data'], 'readonly');
        const objectStore = transaction.objectStore('data');
        const getRequest = objectStore.get('gameState');
        getRequest.onsuccess = async function(event) {
            if (event.target.result) {
                const data = event.target.result;
                if (data.state.playerImage) {
                    try {
                        const blob = await fetchImage(data.state.playerImage);
                        document.getElementById('playerart').src = URL.createObjectURL(blob);
                    } catch (error) {
                        console.error('Error loading player image:', error);
                    }
                }
            }
        };
    }
});

async function restoreGameState(data, images = null) {
    const output = document.getElementById('output');
    areas = data.state.areas;
    currentArea = data.state.currentArea;
    output.innerHTML = data.state.outputLog;
    settings = data.state.settings;
    output.scrollTop = output.scrollHeight;

    // Update UI elements first
    updateAreaDisplay(currentArea);
    updateApproachDisplay();
    updateCharacterInfo();
    updateConsequences();
    updateTime();

    // Apply settings to UI elements
    document.getElementById('q1').style.height = settings.q1_height;
    document.getElementById('q2').style.height = settings.q2_height;
    content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;

    // Clean up the map
    document.querySelectorAll('.location').forEach(location => {
        location.remove();
    });
    
    // Add top-level areas to the map
    for (const area in areas) {
        addLocation(area);
    }

    // Handle player image
    if (data.state.playerImage) {
        if (data.state.playerImage.startsWith('data:')) {
            document.getElementById('playerart').src = data.state.playerImage;
        } else if (!data.state.playerImage.startsWith('blob:')) {
            try {
                const blob = await fetchImage(data.state.playerImage);
                document.getElementById('playerart').src = URL.createObjectURL(blob);
            } catch (error) {
                console.error('Error loading player image:', error);
            }
        }
    }

    // Handle area images
    if (images) {
        // Handle images from file load
        for (const [path, imageData] of Object.entries(images)) {
            try {
                if (path === 'player') {
                    const blob = await fetchImage(imageData);
                    document.getElementById('playerart').src = URL.createObjectURL(blob);
                    continue;
                }

                // Find the target area/entity and update its image
                if (areas[path]) {
                    areas[path].image = await fetchImage(imageData);
                } else {
                    // Check each area for entities with this name
                    for (const area of Object.values(areas)) {
                        for (const category of ['people', 'things', 'creatures']) {
                            const entity = area[category]?.find(e => e.name === path);
                            if (entity) {
                                entity.image = await fetchImage(imageData);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error loading image for ${path}:`, error);
            }
        }
    } else {
        // Handle images from IndexedDB (already blobs)
        // Just need to update scene art since other images are already in place
        const currentAreaObj = areas[currentArea];
        if (currentAreaObj?.image instanceof Blob) {
            const sceneArt = document.getElementById('sceneart');
            if (sceneArt.src.startsWith('blob:')) {
                URL.revokeObjectURL(sceneArt.src);
            }
            sceneArt.src = URL.createObjectURL(currentAreaObj.image);
        }
    }

    // Refresh UI
    updateImageGrid(currentArea);
    updateSublocationRow(currentArea);
}

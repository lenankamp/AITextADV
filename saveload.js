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
    // Handle world map image
    const mapImage = document.getElementById('mapImage');
    let mapImageDataUrl = mapImage.src;
    if (mapImage.src.startsWith('blob:')) {
        try {
            const response = await fetch(mapImage.src);
            const blob = await response.blob();
            mapImageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting map image:', error);
            mapImageDataUrl = 'map.webp';
        }
    }

    const transaction = db.transaction(['data'], 'readwrite');
    const objectStore = transaction.objectStore('data');
    const data = {
        id: 'gameState',
        state: {
            areas: areas,
            currentArea: currentArea,
            turnsAtCurrentArea: turnsAtCurrentArea,
            followers: followers,
            outputLog: document.getElementById('output').innerHTML,
            settings: settings,
            mapImage: mapImageDataUrl,
            players: players
        }
    };
    objectStore.put(data);
    if (saveFile) {
        await saveToFile(data);
    }
}

async function saveToFile(data) {
    const images = {};
    // --- NEW: Save all player images in the images object ---
    if (Array.isArray(data.state.players)) {
        for (const player of data.state.players) {
            if (player.image && typeof player.image === 'string' && player.image.startsWith('data:')) {
                images[`player_${player.name}`] = player.image;
            } else if (player.image && typeof player.image === 'string' && player.image.startsWith('blob:')) {
                try {
                    const response = await fetch(player.image);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    await new Promise((resolve, reject) => {
                        reader.onloadend = () => {
                            images[`player_${player.name}`] = reader.result;
                            resolve();
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    // ignore
                }
            } else if (player.image instanceof Blob) {
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        images[`player_${player.name}`] = reader.result;
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(player.image);
                });
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

    // Process followers' images
    if (data.state.followers) {
        data.state.followers.forEach(follower => {
            if (follower.image instanceof Blob) {
                images[`follower_${follower.name}`] = follower.image;
                follower.image = null;
            }
        });
    }

    // Process all areas
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

    // Function to restore images in an area
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

    // Restore all areas
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

document.addEventListener('DOMContentLoaded', (event) => {
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
    turnsAtCurrentArea = data.state.turnsAtCurrentArea;
    followers = data.state.followers;
    output.innerHTML = data.state.outputLog;
    settings = Object.assign({}, settings, data.state.settings);

    // --- NEW: Restore players array and their images ---
    if (Array.isArray(data.state.players)) {
        players = data.state.players.map(player => ({ ...player }));
        // Restore player images from images object if present
        if (images) {
            for (const player of players) {
                const key = `player_${player.name}`;
                if (images[key]) {
                    player.image = images[key];
                }
            }
        }
        activePlayer = players[0];
    } else {
        players = [];
    }

    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    output.scrollTop = output.scrollHeight;

    // Update UI elements first
    updateAreaDisplay(currentArea);
    updateApproachDisplay();
    updateCharacterInfo();
    updateConsequences();
    updateTime();

    // Apply settings to UI elements first
    document.getElementById('q1').style.height = settings.topleft_height;
    document.getElementById('q2').style.height = settings.topright_height;
    document.getElementById('q3').style.height = `calc(100vh - ${settings.topleft_height} - .5vh)`;
    document.getElementById('q4').style.height = `calc(100vh - ${settings.topright_height} - .5vh)`;
    
    // Update flex properties instead of grid template columns
    const leftSide = document.getElementById('left');
    const rightSide = document.getElementById('right');
    if (leftSide && rightSide) {
        leftSide.style.flex = `0 0 ${settings.column_width}`;
        rightSide.style.flex = '1';
    }

    // Clean up the map
    document.querySelectorAll('.location').forEach(location => {
        location.remove();
    });
    
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

    // --- NEW: Set the playerart image to the first player's image if available ---
    if (players.length > 0 && players[0].image) {
        if (typeof players[0].image === 'string' && players[0].image.startsWith('data:')) {
            document.getElementById('playerart').src = players[0].image;
        } else if (typeof players[0].image === 'string' && players[0].image.startsWith('blob:')) {
            try {
                const blob = await fetchImage(players[0].image);
                document.getElementById('playerart').src = URL.createObjectURL(blob);
            } catch (error) {
                // fallback to previous logic
            }
        }
    }

    // Handle world map image
    if (data.state.mapImage) {
        const mapImage = document.getElementById('mapImage');
        if (data.state.mapImage.startsWith('data:')) {
            mapImage.src = data.state.mapImage;
        } else if (!data.state.mapImage.startsWith('blob:')) {
            try {
                const blob = await fetchImage(data.state.mapImage);
                mapImage.src = URL.createObjectURL(blob);
            } catch (error) {
                console.error('Error loading map image:', error);
                mapImage.src = 'map.webp';
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

                // Handle follower images
                if (path.startsWith('follower_')) {
                    const followerName = path.replace('follower_', '');
                    const follower = followers.find(f => f.name === followerName);
                    if (follower) {
                        follower.image = await fetchImage(imageData);
                        continue;
                    }
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
    
    // Add top-level areas to the map
    for (const area in areas) {
        if (!area.includes('/')) {
            addLocation(area);
        }
    }

    // Refresh UI
    const map = document.getElementById('map');
    map.style.left = '0px';
    map.style.top = '0px';
    updateImageGrid(currentArea);
    updateFollowerArt();
    updateSublocationRow(currentArea);
    zoomMap(minScale);
    centerMapOnLocation(currentArea);
}

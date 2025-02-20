let db;
const request = indexedDB.open('gameData', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('data', { keyPath: 'id' });
};

request.onsuccess = function(event) {
    db = event.target.result;
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
    for (const area in areas) {
        if (areas[area].image instanceof Blob) {
            images[area] = areas[area].image;
            areas[area].image = null;
        } else console.log('Invalid image Blob:', area, areas[area].image);
        for (const category of ['people', 'things', 'hostiles']) {
            if (areas[area][category]) {
                areas[area][category].forEach(item => {
                    if (item.image instanceof Blob) {
                        images[item.name] = item.image;
                        item.image = null;
                    } else console.log('Invalid image Blob:', area, category, item.name, item.image);
                });
            }
        }
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

    const areaPromises = Object.keys(areas).map(async area => {
        if (images[area]) {
            areas[area].image = await fetchImage(images[area]);
        }
        const categoryPromises = ['people', 'things', 'hostiles'].map(async category => {
            if (areas[area][category]) {
                const itemPromises = areas[area][category].map(async item => {
                    if (images[item.name]) {
                        item.image = await fetchImage(images[item.name]);
                    }
                });
                await Promise.all(itemPromises);
            }
        });
        await Promise.all(categoryPromises);
    });
    await Promise.all(areaPromises);
}

async function loadFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const { data, images } = JSON.parse(e.target.result);
            areas = data.state.areas;
            currentArea = data.state.currentArea;
            document.getElementById('output').innerHTML = data.state.outputLog;
            settings = data.state.settings;

            await loadImages(images);
            document.getElementById('q1').style.height = settings.q1_height;
            document.getElementById('q2').style.height = settings.q2_height;
            content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;

            updateImageGrid(currentArea);
            document.getElementById('sceneart').src = URL.createObjectURL(areas[currentArea].image);
            document.getElementById('sceneart').alt = areas[currentArea].description;

            if (images['player']) {
                const playerImageBlob = await fetchImage(images['player']);
                document.getElementById('playerart').src = URL.createObjectURL(playerImageBlob);
            }
        };
        reader.readAsText(file);
    }
}

async function loadImages(images) {
    for (const area in areas) {
        if (images[area]) {
            areas[area].image = await fetchImage(images[area]);
        }
        for (const category of ['people', 'things', 'hostiles']) {
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

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

async function generateArea(areaName, prompt='') {
    areas[areaName].name = areaName;
    areas[areaName].seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[areaName]['people'] = [];
    areas[areaName]['things'] = [];
    areas[areaName]['hostiles'] = [];

    let response;
    if (prompt == '') {
        response = await generateText(settings.question_param, settings.world_description + "\n[Generate a description of the area named " + areaName + ".]");
        areas[areaName].description = response;
    } else {
        areas[areaName].description = prompt;
    }
    response = await generateText(settings.question_param, settings.world_description + "\n[Be creative and generate a list of people and interesting things that could reasonably be found in the area named " + areaName + " with the following details: " + areas[areaName].description + " \nIf no people or hostiles might be reasonably found in the area, reply with None. Do not generate more than 4 in one category. Things must be non-living solid physical interactable pieces of interest within the area. Descriptions should be 1-2 sentences. Answer in a formatted list as such: \nPeople\n- Name: Description\n...\nThings\n- Name: Description\n...\nHostiles\n- Name: Description\n...\n]");

    // Process response to get people, things, and hostiles into the area object as a subset for each type.
    const lines = response.split('\n');
    let currentSection = null;
    for (const line of lines) {
        const cleanedLine = line.replace(/[^a-zA-Z]/g, '');
        if (cleanedLine.startsWith('People')) {
            currentSection = 'people';
        } else if (cleanedLine.startsWith('Things')) {
            currentSection = 'things';
        } else if (cleanedLine.startsWith('Hostiles')) {
            currentSection = 'hostiles';
        } else if (currentSection && line.trim() && !line.includes('None')) {
            const [namePart, ...descriptionParts] = line.split(': ');
            const name = namePart.replace(/[^a-zA-Z\s]/g, '').trim();
            const description = descriptionParts.join(': ').trim();
            let visual = await generateText(settings.question_param, settings.world_description + "\n[How would you describe '" + name.replace('-', '') + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
            const seed = Math.floor(Math.random() * 4294967295) + 1;
            let negprompt = "";
            if (currentSection == "people") {
                negprompt = "";
            } else if (currentSection == "hostiles") {
                negprompt = "friendly";
            } else if (currentSection == "things") {
                negprompt = "((people, human, person))";
                visual = "((" + name.replace('-', '') + ")),(nopeople)" + visual;
            }
            const section = currentSection; // Capture the current section
            areas[areaName][section].push({ name: name.replace('-', ''), description, visual, seed, image: 'placeholder' });
        }
    }
    areas[areaName].visual = await generateText(settings.question_param, settings.world_description + "\n" + areas[settings.starting_area].description + '\n[How would you describe the visual details of the area described in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]');
    areas[areaName].image = 'placeholder';
}

async function outputCheck(text, context="") {
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A' and no explaination. 1. If a new person is in the scene, what is their name, or a simple two word description if name is not revealed? 2. If a new hostile is in the scene or someone in the scene has become hostile, what is their name, or a simple two word description if name is not revealed? 3. If the scene changed location, where is the scene now?" + "]");
    const lines = response.split('\n');
    for (const line of lines) {
        if (line.startsWith('1.') && !line.includes('N/A')) {
            const names = line.replace("1. ", '').trim().split(',').map(name => name.trim());
            for (const name of names) {
                if (!areas[currentArea]['people'].some(person => person.name === name)) {
                    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context +"\n" + text + "\n\n[Write a description of '" + name + "'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]");
                    const visual = await generateText(settings.question_param, settings.world_description + "\n" + "[How would you describe '" + name + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
                    const seed = Math.floor(Math.random() * 4294967295) + 1;
                    areas[currentArea]['people'].push({ name, description, visual, seed, image: 'placeholder' });
                }
            }
        } else if (line.startsWith('2.') && !line.includes('N/A')) {
            const names = line.replace("2. ", '').trim().split(',').map(name => name.trim());
            for (const name of names) {
                if (!areas[currentArea]['people'].some(person => person.name === name)) {
                    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context +"\n" + text + "\n\n[Write a description of '" + name + "'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]");
                    const visual = await generateText(settings.question_param, settings.world_description + "\n" + "[How would you describe '" + name + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
                    const seed = Math.floor(Math.random() * 4294967295) + 1;
                    areas[currentArea]['people'].push({ name, description, visual, seed, image: 'placeholder' });
                }
            }
        }else if (line.startsWith('3.') && !line.includes('N/A')) {
            const prevArea = currentArea;
            currentArea = line.replace("3. ", '').trim();
            if(!(currentArea in areas)){
                areas[currentArea] = {};
                await generateArea(currentArea);
            }
            if(areas[prevArea].people.length > 0)
            {
                const peopleNames = areas[prevArea].people.map(person => person.name).join(', ');
                const movingPeople = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(prevArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in a list format separate by '\n' in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who moved with the player?" + "]");
                const movers = movingPeople.split('\n');
                for (const mover of movers) {
                    if (line.trim() != "") {
                        const personIndex = areas[prevArea]['people'].findIndex(person => person.name === mover);
                        if (personIndex !== -1) {
                            const person = areas[prevArea]['people'].splice(personIndex, 1)[0];
                            areas[currentArea]['people'].push(person);
                        }
                    }
                }
            }
        }
    }

    updateImageGrid(currentArea);
}

function areaContext(area) {
    let context = " \n" + areas[area].name + " : " + areas[area].description + "\n\n";
    if(areas[area].people.length > 0)
    {
        context += "People nearby\n";
        for(let i = 0; i < areas[area].people.length; i++)
        {
            context += areas[area].people[i].name + ": " + areas[area].people[i].description + "\n";
        }
        context += "\n";
    }
    if(areas[area].things.length > 0)
    {
        context += "Things in area\n";
        for(let i = 0; i < areas[area].things.length; i++)
        {
            context += areas[area].things[i].name + ": " + areas[area].things[i].description + "\n";
        }
        context += "\n";
    }
    if(areas[area].hostiles.length > 0)
    {
        context += "Hostiles nearby\n";
        for(let i = 0; i < areas[area].hostiles.length; i++)
        {
            context += areas[area].hostiles[i].name + ": " + areas[area].hostiles[i].description + "\n";
        }
        context += "\n";
    }
    return context;
}

function fullContext() {
    return settings.full_context
        .replace('$world', settings.world_description)
        .replace('$player', "\nPlayer Name: " + settings.player_name + "\n" + settings.player_description)
        .replace('$locale', areaContext(currentArea))
        .replace('$fullstory', document.getElementById('output').innerHTML);
}

async function sendMessage(message = input.value) {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const messageElement = document.createElement('div');
    if (message.trim()) {
        messageElement.innerHTML = '\n[Generate the next two paragraphs as player attempts to ' + message + ']';
    } else {
        messageElement.innerHTML = '\n[Continue the story for another two paragraphs.]';
    }
    output.appendChild(messageElement);
    input.value = '';
    output.scrollTop = output.scrollHeight;

    const text = await generateText(settings.story_param, fullContext() + messageElement.innerHTML);
    messageElement.innerHTML = "<br>" + text.replace(/\n/g, '<br>');
    output.scrollTop = output.scrollHeight;

    await outputCheck(text, output.textContent);

    const artPrompt = await generateText(settings.question_param, messageElement.innerHTML + '\n[How would you describe the visual details of the previous scene in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]');
    generateArt(artPrompt).then(blob => {
        if (blob instanceof Blob)
            document.getElementById('sceneart').src = URL.createObjectURL(blob);
    });
    document.getElementById('sceneart').alt = artPrompt;
}

async function setupStart() {
    await generateArea(settings.starting_area, settings.starting_area_description);
    document.getElementById('sceneart').src = 'placeholder.png';
    setTimeout(async () => {
        const artBlob = await generateArt(areas[settings.starting_area].visual, "", areas[settings.starting_area].seed);
        if (artBlob instanceof Blob) {
            areas[settings.starting_area].image = artBlob;
            document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
        }
    }, 0);
    document.getElementById('sceneart').alt = areas[settings.starting_area].description;
    const responseElement = document.createElement('div');
    let text = await generateText(settings.story_param, settings.world_description + "\n" + "[Generate the beginning of the story as the player arrives at " + areas[settings.starting_area] + ", an area described as " + areas[settings.starting_area].description + ". Response should be less than 300 words.]");

    // Trim incomplete sentences from the end of the text
    const sentences = text.match(/[^.!?]+[.!?]+["']?/g);
    if (sentences && sentences.length > 1) {
        sentences.pop(); // Remove the last incomplete sentence
        text = sentences.join(' '); // Rejoin the sentences
    }

    responseElement.innerHTML = text.replace(/\n/g, '<br>');
    output.appendChild(responseElement);
    output.scrollTop = output.scrollHeight;
    await outputCheck(text);
    updateImageGrid(settings.starting_area);
    areas[settings.starting_area].x = 100;
    areas[settings.starting_area].y = 100;

    addLocation(settings.starting_area);
    document.getElementById('playerart').src = 'placeholder.png';
    generateArt(settings.player_visual, "", settings.player_seed).then(blob => {
        if (blob instanceof Blob)
            document.getElementById('playerart').src = URL.createObjectURL(blob);
    });
}

// Things are people, monsters, and interactables.
// Should have name, seed, type, visual, description, level, affinity,
// health, attack, defense, speed, magic, magic defense, skills, items, location, status effects

let areas = {};
let currentArea;
loadSettings().then(() => {
    areas[settings.starting_area] = {};
    currentArea = settings.starting_area;
// setup disabled for quicker testing, re-enable for normal use.
//            setupStart();
});

function restartGame() {
    areas = {};
    areas[settings.starting_area] = {};
    currentArea = settings.starting_area;
    document.getElementById('output').innerHTML = '';
    document.getElementById('imageGrid').innerHTML = '';
    setupStart();
}

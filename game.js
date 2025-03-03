async function generateArea(areaName, description='') {
    areas[areaName] = {};
    areas[areaName].name = areaName;
    areas[areaName].seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[areaName]['people'] = [];
    areas[areaName]['things'] = [];
    areas[areaName]['hostiles'] = [];
                                        // should not be using full_context, just some testing
    let response;
    if (description == '') {
        response = await generateText(settings.question_param, fullContext() + "\n[Generate a description of the area named " + areaName + ".]");
        areas[areaName].description = response;
    } else {
        areas[areaName].description = description;
    }
    response = await generateText(settings.question_param, fullContext() + "\n[Be creative and generate a list of people and interesting things that could reasonably be found in the area named " + areaName + " with the following details: " + areas[areaName].description + " \nIf no people or hostiles might be reasonably found in the area, reply with None. Do not generate more than 4 in one category. Things must be non-living solid physical interactable pieces of interest within the area. Descriptions should be 1-2 sentences. Answer in a formatted list as such: \nPeople\n- Name: Description\n...\nThings\n- Name: Description\n...\nHostiles\n- Name: Description\n...\n]");

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
            if(currentSection === 'things')
                visual = "(" + name + "), " + visual;
            const seed = Math.floor(Math.random() * 4294967295) + 1;
            const section = currentSection; // Capture the current section
            areas[areaName][section].push({ name: name.replace('-', ''), description, visual, seed, image: 'placeholder' });
        }
    }
    areas[areaName].visual = await generateText(settings.question_param, settings.world_description + "\n" + areas[areaName].description + '\n[How would you describe the visual details of the area described in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]');
    areas[areaName].image = 'placeholder';
}

async function addPerson(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n[Write a description of '" + name + "'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]");
    const visual = await generateText(settings.question_param, settings.world_description + "\n" + "[How would you describe '" + name + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['people'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addThing(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n[Write a description of '" + name + "'. Write a 1-2 sentence physical description. If there is not enough information in the context, be creative.]");
    const visual = await generateText(settings.question_param, settings.world_description + "\n" + "[How would you describe '" + name + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['things'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addHostile(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n[Write a description of '" + name + "'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description with consideration for why they might be hostile to the player. If there is not enough information in the context, be creative.]");
    const visual = await generateText(settings.question_param, settings.world_description + "\n" + "[How would you describe '" + name + "' described as '" + description + "' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]");
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['hostiles'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function moveToArea(area, prevArea, text="", context="") {
    if (areas[area] == undefined) {
        await generateArea(area);
        setTimeout(async () => {
            const artBlob = await generateArt(areas[area].visual, "", areas[area].seed);
            if (artBlob instanceof Blob) {
                areas[area].image = artBlob;
                document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
                const locationElement = document.getElementById(`location-${area}`);
                if (locationElement) {
                    locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
                }
            }
        }, 0);
    }
    currentArea = area;
    if(areas[prevArea].people.length > 0) {
        const peopleNames = areas[prevArea].people.map(person => person.name).join(', ');
        const movingPeople = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(prevArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in a list format separate by '\n' in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who moved with the player?" + "]");
        const movers = movingPeople.split('\n');
        for (const mover of movers) {
            if (mover.trim() != "") {
                const personIndex = areas[prevArea]['people'].findIndex(person => person.name === mover);
                if (personIndex !== -1) {
                    const person = areas[prevArea]['people'].splice(personIndex, 1)[0];
                    areas[currentArea]['people'].push(person);
                }
            }
        }
    }
    updateImageGrid(currentArea);
}

function addConfirmButton(label, defaultValue, callback) {
    const output = document.getElementById('output');
    let buttonRow = document.getElementById('outputCheckConfirm');

    if (!buttonRow) {
        buttonRow = document.createElement('div');
        buttonRow.id = 'outputCheckConfirm';
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '0px';
        buttonRow.style.marginTop = '5px';
        output.appendChild(buttonRow);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = defaultValue;

    const button = document.createElement('button');
    button.textContent = label;
    button.style.marginRight = '5px';
    button.onclick = () => {
        callback(input.value);
        input.remove();
        button.remove();
    };

    buttonRow.appendChild(input);
    buttonRow.appendChild(button);
    output.scrollTop = output.scrollHeight;
}

function renamePerson(name, prevName) {
    const personIndex = areas[currentArea]['people'].findIndex(person => person.name === prevName);
    if (personIndex !== -1) {
        const person = areas[currentArea]['people'][personIndex];
        person.name = name;
    }
    updateImageGrid(currentArea);
}

function befriendHostile(name) {
    const hostileIndex = areas[currentArea]['hostiles'].findIndex(hostile => hostile.name === name);
    if (hostileIndex !== -1) {
        const hostile = areas[currentArea]['hostiles'].splice(hostileIndex, 1)[0];
        areas[currentArea]['people'].push(hostile);
    }
    updateImageGrid(currentArea);
}

function provokeAlly(name) {
    const personIndex = areas[currentArea]['people'].findIndex(person => person.name === name);
    if (personIndex !== -1) {
        const person = areas[currentArea]['people'].splice(personIndex, 1)[0];
        areas[currentArea]['hostiles'].push(person);
    }
    updateImageGrid(currentArea);
}

async function outputCheck(text, context="") {
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. If a new person is in the scene, what is their name, or a simple two word description if name is not revealed? 2. If a new hostile is in the scene, what is their name, or a simple two word description if name is not revealed? 3. If the scene changed location, where is the scene now? 4. If an unknown person's name is revealed, what is their name? 5. If a person has left the scene, what is their name? 6. If hostile has become an ally, what is their name? 7. If someone not hostile has become hostile, what is their name?]");
    const lines = response.split('\n');

    for (const line of lines) {
        if (line.startsWith('1.') && !line.includes('N/A') && line.trim() !== '1.') {
            const names = line.replace("1. ", '').trim().split(',').map(name => name.replace(/[^a-zA-Z\s.]/g, '').replace(/\.$/, '').trim());
            for (const name of names) {
                if (!areas[currentArea]['people'].some(person => person.name === name)) {
                    addConfirmButton('New Person', name, (inputValue) => addPerson(inputValue || name, currentArea, text, context));
                }
            }
        } else if (line.startsWith('2.') && !line.includes('N/A') && line.trim() !== '2.') {
            const names = line.replace("2. ", '').trim().split(',').map(name => name.replace(/[^a-zA-Z\s.]/g, '').replace(/\.$/, '').trim());
            for (const name of names) {
                if (!areas[currentArea]['hostiles'].some(hostile => hostile.name === name)) {
                    addConfirmButton('New Hostile', name, (inputValue) => addHostile(inputValue || name, currentArea, text, context));
                }
            }
        } else if (line.startsWith('3.') && !line.includes('N/A') && line.trim() !== '3.') {
            const newArea = line.replace("3. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            addConfirmButton('Move to', newArea, (inputValue) => moveToArea(inputValue || newArea, prevArea, text, context));
        } else if (line.startsWith('4.') && !line.includes('N/A') && line.trim() !== '4.') {
            const newName = line.replace("4. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (!areas[currentArea].people.some(person => person.name === newName) && newName != settings.player_name) {
                const peopleNames = areas[currentArea].people.map(person => person.name).join(', ');  // should probably add hostiles to this list
                const prevName = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who is " + newName + "?" + "]");
                if (prevName.trim() != "N/A") {
                    addConfirmButton('Rename ' + prevName, newName, (inputValue) => renamePerson(inputValue || newName, prevName));
                } else addConfirmButton('New Person', newName, (inputValue) => addPerson(inputValue || newName, currentArea, text, context));
            }
        } else if (line.startsWith('5.') && !line.includes('N/A') && line.trim() !== '5.') {
            const prevArea = currentArea;
            const newArea = line.replace("5. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
// nowhere to go yet            addConfirmButton('Move to', newArea, (inputValue) => moveToArea(inputValue || newArea, prevArea, text, context));
        } else if (line.startsWith('6.') && !line.includes('N/A') && line.trim() !== '6.') {
            const name = line.replace("6. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            addConfirmButton('Befriend', name, (inputValue) => befriendHostile(inputValue || name));
        } else if (line.startsWith('7.') && !line.includes('N/A') && line.trim() !== '7.') {
            const name = line.replace("7. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            addConfirmButton('Provoke', name, (inputValue) => provokeAlly(inputValue || name));
        }
    }
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
    messageElement.classList.add('new-message'); // Add distinct style to new message element

    if (message.trim()) {
        messageElement.innerHTML = '\n[Generate the next two paragraphs as player attempts to ' + message + ']';
    } else {
        messageElement.innerHTML = '\n[Continue the story for another two paragraphs.]';
    }
    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    // Remove distinct style from the prior message element
    const priorMessageElement = output.querySelector('.new-message');
    if (priorMessageElement) {
        priorMessageElement.classList.remove('new-message');
    }

    output.appendChild(messageElement);
    input.value = '';
    output.scrollTop = output.scrollHeight;

    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext() + messageElement.innerHTML));
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

function undoLastAction() {
    const output = document.getElementById('output');
    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    if (output.lastChild) {
        output.removeChild(output.lastChild);
    }
}

function trimIncompleteSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+["']?/g);
    if (sentences && sentences.length > 1) {
        sentences.pop(); // Remove the last incomplete sentence
        return sentences.join(' '); // Rejoin the sentences
    }
    return text; // Return the original text if no sentences were found
}

async function setupStart() {
    document.getElementById('sceneart').src = 'placeholder.png';
    await generateArea(settings.starting_area, settings.starting_area_description);
    document.getElementById('sceneart').alt = areas[settings.starting_area].description;
    const responseElement = document.createElement('div');
    responseElement.classList.add('new-message'); // Add distinct style to new message element
    const text = trimIncompleteSentences(await generateText(settings.story_param, settings.world_description + "\n" + "[Generate the beginning of the story as the player arrives at " + areas[settings.starting_area] + ", an area described as " + areas[settings.starting_area].description + ". Response should be less than 300 words.]"));

    areas[settings.starting_area].x = 100;
    areas[settings.starting_area].y = 100;

    addLocation(settings.starting_area);

    setTimeout(async () => {
        const artBlob = await generateArt(areas[settings.starting_area].visual, "", areas[settings.starting_area].seed);
        if (artBlob instanceof Blob) {
            areas[settings.starting_area].image = artBlob;
            document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
            const locationElement = document.getElementById(`location-${settings.starting_area}`);
            if (locationElement) {
                locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
            }
        }
    }, 0);
    responseElement.innerHTML = text.replace(/\n/g, '<br>');
    output.appendChild(responseElement);
    output.scrollTop = output.scrollHeight;
    await outputCheck(text);
    updateImageGrid(settings.starting_area);

    document.getElementById('playerart').src = 'placeholder.png';
    generateArt(settings.player_visual, "", settings.player_seed).then(blob => {
        if (blob instanceof Blob)
            document.getElementById('playerart').src = URL.createObjectURL(blob);
    });
}

let areas = {};
let currentArea;

    loadSettings();
    console.log(settings);
    overrideSettings();
    console.log(settings);
    areas[settings.starting_area] = {};
    currentArea = settings.starting_area;

function restartGame() {
    areas = {};
    currentArea = settings.starting_area;
    document.getElementById('output').innerHTML = '';
    document.getElementById('imageGrid').innerHTML = '';
    setupStart();
}

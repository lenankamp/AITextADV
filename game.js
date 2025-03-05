async function generateArea(x, y, areaName, description='', isSubLocation=false, parentArea=null) {
    console.log('Generating area: ' + areaName);
    let area;
    areas[areaName] = {};
    area = areas[areaName];

    area.name = areaName.split('/').pop();
    area.seed = Math.floor(Math.random() * 4294967295) + 1;
    if (!isSubLocation) {
        area.x = x;
        area.y = y;
    }
    area['people'] = [];
    area['things'] = [];
    area['hostiles'] = [];
    area['sublocations'] = {};

    let response;
    if (description == '') {
        const prompt = settings.generateAreaDescriptionPrompt.replace('{areaName}', areaName);
        response = await generateText(settings.question_param, fullContext() + "\n" + prompt, '', {
            areaName: areaName
        });
        area.description = response;
    } else {
        area.description = description;
    }

    // Generate potential sublocations
    const sublocationsPrompt = settings.generateSublocationsPrompt
        .replace('{areaName}', areaName)
        .replace('{description}', area.description);
    
    response = await generateText(settings.question_param, fullContext() + "\n" + sublocationsPrompt, '', {
        areaName: areaName,
        description: area.description
    });

    const sublocations = response.split('\n');
    for (const line of sublocations) {
        if (line.trim() && !line.includes('None')) {
            const [name, ...descriptionParts] = line.split(': ');
            const sublocationName = name.trim();
            const sublocationDesc = descriptionParts.join(': ').trim();
            if (sublocationName && sublocationDesc) {
                area.sublocations[sublocationName] = {
                    name: sublocationName,
                    description: sublocationDesc
                };
            }
        }
    }

    const entitiesPrompt = settings.generateEntitiesPrompt
        .replace('{areaName}', areaName)
        .replace('{description}', area.description);

    response = await generateText(settings.question_param, fullContext() + "\n" + entitiesPrompt, '', {
        areaName: areaName,
        description: area.description
    });
    console.log(response);

    const lines = response.split('\n');
    let currentSection = null;
    for (const line of lines) {
        const cleanedLine = line.replace(/[^a-zA-Z\s.,-:]/g, '').replace('Name:', '');
        if (cleanedLine.startsWith('People')) {
            currentSection = 'people';
        } else if (cleanedLine.startsWith('Things')) {
            currentSection = 'things';
        } else if (cleanedLine.startsWith('Hostiles')) {
            currentSection = 'hostiles';
        } else if (currentSection && cleanedLine.trim() && !cleanedLine.includes('None') && cleanedLine.includes(':')) {
            const [namePart, ...descriptionParts] = cleanedLine.split(': ');
            const name = namePart.replace(/[^a-zA-Z.-\s]/g, '').trim();
            const description = descriptionParts.join(': ').trim();
            let visualPrompt = settings.generateVisualPrompt
                .replace('{name}', name.replace('-', ''))
                .replace('{description}', description);

            let visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
                name: name.replace('-', ''),
                description: description
            });
            
            if(currentSection === 'things')
                visual = "(" + name + "), " + visual;
            const seed = Math.floor(Math.random() * 4294967295) + 1;
            const section = currentSection;
            area[section].push({ name: name.replace('-', ''), description, visual, seed, image: 'placeholder' });
        }
    }

    let visualPrompt = settings.generateVisualPrompt
        .replace('{name}', areaName)
        .replace('{description}', area.description);

    area.visual = await generateText(settings.question_param, settings.world_description + "\n" + area.description + '\n' + visualPrompt, '', {
        name: areaName,
        description: area.description
    });
    
    area.image = 'placeholder';
    if (!isSubLocation) {
        addLocation(areaName);
    }

    setTimeout(async () => {
        const artBlob = await generateArt(area.visual, "", area.seed);
        if (artBlob instanceof Blob) {
            area.image = artBlob;
            if (areaName === currentArea) {
                document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
            }
            if (!isSubLocation) {
                const locationElement = document.getElementById(`location-${areaName}`);
                if (locationElement) {
                    locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
                }
            }
        }
    }, 0);
}

async function addPerson(name, area=currentArea, context="", text="") {
    const descriptionPrompt = settings.addPersonDescriptionPrompt
        .replace('{name}', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('{name}', name)
        .replace('{description}', description);

    const visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
        name: name,
        description: description
    });
    
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['people'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addThing(name, area=currentArea, context="", text="") {
    const descriptionPrompt = settings.addThingDescriptionPrompt
        .replace('{name}', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('{name}', name)
        .replace('{description}', description);

    const visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
        name: name,
        description: description
    });
    
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['things'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addHostile(name, area=currentArea, context="", text="") {
    const descriptionPrompt = settings.addHostileDescriptionPrompt
        .replace('{name}', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('{name}', name)
        .replace('{description}', description);

    const visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
        name: name,
        description: description
    });
    
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['hostiles'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function moveToArea(area, prevArea, text="", context="") {
    let targetArea;
    let parentArea = null;

    if (area.includes('/')) {
        const [topArea, ...subPaths] = area.split('/');
        if (!areas[topArea]) {
            let newX, newY;
            const maxAttempts = 100;
            let attempts = 0;
            const distance = 30;

            do {
                newX = areas[prevArea.split('/')[0]].x + Math.floor(Math.random() * distance * 2) - distance;
                newY = areas[prevArea.split('/')[0]].y + Math.floor(Math.random() * distance * 2) - distance;
                attempts++;
            } while (attempts < maxAttempts && Object.values(areas).some(a => a.x === newX && a.y === newY));

            if (attempts >= maxAttempts) {
                throw new Error("Unable to find a suitable location for the new area.");
            }

            await generateArea(newX, newY, topArea);
        }

        targetArea = areas[topArea];
        let currentPath = topArea;
        for (const subPath of subPaths) {
            currentPath += '/' + subPath;
            if (!targetArea.sublocations[subPath]) {
                await generateArea(0, 0, currentPath, '', true, areas[topArea]);
            } else if (!targetArea.sublocations[subPath].visual) {
                // If sublocation exists but wasn't fully generated, generate it now
                await generateArea(0, 0, currentPath, targetArea.sublocations[subPath].description, true, areas[topArea]);
            }
            parentArea = targetArea;
            targetArea = targetArea.sublocations[subPath];
        }
    } else if (!areas[area]) {
        let newX, newY;
        const maxAttempts = 100;
        let attempts = 0;
        const distance = 30;

        do {
            newX = areas[prevArea.split('/')[0]].x + Math.floor(Math.random() * distance * 2) - distance;
            newY = areas[prevArea.split('/')[0]].y + Math.floor(Math.random() * distance * 2) - distance;
            attempts++;
        } while (attempts < maxAttempts && Object.values(areas).some(a => a.x === newX && a.y === newY));

        if (attempts >= maxAttempts) {
            throw new Error("Unable to find a suitable location for the new area.");
        }

        await generateArea(newX, newY, area);
    }

    currentArea = area;
    if(prevArea.includes('/')) {
        targetArea = areas[prevArea.split('/')[0]];
        for (const subPath of prevArea.split('/').slice(1)) {
            targetArea = targetArea.sublocations[subPath];
        }
    } else {
        targetArea = areas[prevArea];
    }

    if(targetArea.people.length > 0) {
        const peopleNames = targetArea.people.map(person => person.name).join(', ');
        const movingPeople = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(prevArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in a list format separate by '\n' in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who moved with the player?" + "]", '', {
            prevArea: prevArea,
            newArea: area,
            context: context,
            text: text,
            peopleNames: peopleNames
        });
        const movers = movingPeople.split('\n');
        for (const mover of movers) {
            if (mover.trim() != "") {
                const personIndex = targetArea.people.findIndex(person => person.name === mover);
                if (personIndex !== -1) {
                    const person = targetArea.people.splice(personIndex, 1)[0];
                    let destArea;
                    if (area.includes('/')) {
                        destArea = areas[area.split('/')[0]];
                        for (const subPath of area.split('/').slice(1)) {
                            destArea = destArea.sublocations[subPath];
                        }
                    } else {
                        destArea = areas[area];
                    }
                    destArea.people.push(person);
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
    const prompt = settings.outputCheckPrompt;
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n" + prompt, '', {
        currentArea: currentArea,
        context: context,
        text: text
    });
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
            addConfirmButton('Move to', newArea, (inputValue) => moveToArea(inputValue || newArea, currentArea, text, context));
        } else if (line.startsWith('4.') && !line.includes('N/A') && line.trim() !== '4.') {
            const newName = line.replace("4. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (!areas[currentArea].people.some(person => person.name === newName) && newName != settings.player_name) {
                const peopleNames = areas[currentArea].people.map(person => person.name).join(', ');
                const prevName = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who is " + newName + "?" + "]", '', {
                    peopleNames: peopleNames,
                    newName: newName,
                    currentArea: currentArea,
                    context: context,
                    text: text
                });
                if (prevName.trim() != "N/A" && areas[currentArea].people.some(person => person.name === prevName)) {
                    addConfirmButton('Rename ' + prevName, newName, (inputValue) => renamePerson(inputValue || newName, prevName));
                } else {
                    addConfirmButton('New Person', newName, (inputValue) => addPerson(inputValue || newName, currentArea, text, context));
                }
            }
        } else if (line.startsWith('5.') && !line.includes('N/A') && line.trim() !== '5.') {
            const prevArea = currentArea;
            const newArea = line.replace("5. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
        } else if (line.startsWith('6.') && !line.includes('N/A') && line.trim() !== '6.') {
            const name = line.replace("6. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            addConfirmButton('Befriend', name, (inputValue) => befriendHostile(inputValue || name));
        } else if (line.startsWith('7.') && !line.includes('N/A') && line.trim() !== '7.') {
            const name = line.replace("7. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            addConfirmButton('Provoke', name, (inputValue) => provokeAlly(inputValue || name));
        }
    }
}

function areaContext(areaPath) {
    let area;
    if (areaPath.includes('/')) {
        area = areas[areaPath.split('/')[0]];
        for (const subPath of areaPath.split('/').slice(1)) {
            area = area.sublocations[subPath];
        }
    } else {
        area = areas[areaPath];
    }

    let context = " \n" + area.name + " : " + area.description + "\n\n";
    
    if (Object.keys(area.sublocations).length > 0) {
        context += "Sublocations:\n";
        for (const [name, subloc] of Object.entries(area.sublocations)) {
            context += name + ": " + subloc.description + "\n";
        }
        context += "\n";
    }

    if(area.people.length > 0) {
        context += "People nearby\n";
        for(let i = 0; i < area.people.length; i++) {
            context += area.people[i].name + ": " + area.people[i].description + "\n";
        }
        context += "\n";
    }
    if(area.things.length > 0) {
        context += "Things in area\n";
        for(let i = 0; i < area.things.length; i++) {
            context += area.things[i].name + ": " + area.things[i].description + "\n";
        }
        context += "\n";
    }
    if(area.hostiles.length > 0) {
        context += "Hostiles nearby\n";
        for(let i = 0; i < area.hostiles.length; i++) {
            context += area.hostiles[i].name + ": " + area.hostiles[i].description + "\n";
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
    messageElement.classList.add('new-message');
    input.value = '';

    if (message.trim()) {
        if (message.startsWith('/')) {
            const parts = message.split(' ');
            const command = parts[0];
            const name = parts.slice(1).join(' ');

            if (command === '/char') {
                await addPerson(name);
            } else if (command === '/thing') {
                await addThing(name);
            } else if (command === '/hostile') {
                await addHostile(name);
            } else {
                console.log('[Unknown command: ' + message + ']');
            }
            return;
        } else {
            messageElement.innerHTML = '\n[Generate the next two paragraphs as player attempts to ' + message + ']';
        }
    } else {
        messageElement.innerHTML = '\n[Continue the story for another two paragraphs.]';
    }
    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    const priorMessageElement = output.querySelector('.new-message');
    if (priorMessageElement) {
        priorMessageElement.classList.remove('new-message');
    }

    output.appendChild(messageElement);
    output.scrollTop = output.scrollHeight;

    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext() + messageElement.innerHTML, '', {
        message: message,
        currentArea: currentArea,
        playerName: settings.player_name
    }));
    
    messageElement.innerHTML = "<br>" + text.replace(/\n/g, '<br>');
    output.scrollTop = output.scrollHeight;

    await outputCheck(text, output.textContent);

    const artPrompt = await generateText(settings.question_param, messageElement.innerHTML + '\n[How would you describe the visual details of the previous scene in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]', '', {
        text: text,
        currentArea: currentArea
    });
    
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
        sentences.pop();
        return sentences.join(' ');
    }
    return text;
}

async function setupStart() {
    document.getElementById('sceneart').src = 'placeholder.png';
    await generateArea(100, 100, settings.starting_area, settings.starting_area_description);
    document.getElementById('sceneart').alt = areas[settings.starting_area].description;
    const responseElement = document.createElement('div');
    responseElement.classList.add('new-message');
    
    const text = trimIncompleteSentences(await generateText(settings.story_param, settings.world_description + "\n" + "[Generate the beginning of the story as the player arrives at " + areas[settings.starting_area] + ", an area described as " + areas[settings.starting_area].description + ". Response should be less than 300 words.]", '', {
        playerName: settings.player_name,
        areaName: settings.starting_area,
        areaDescription: areas[settings.starting_area].description,
        worldDescription: settings.world_description
    }));

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
    document.querySelectorAll('.location').forEach(location => {
        location.remove();
    });
    currentArea = settings.starting_area;
    document.getElementById('output').innerHTML = '';
    document.getElementById('imageGrid').innerHTML = '';
    setupStart();
}

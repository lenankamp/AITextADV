async function generateArea(x, y, areaName, description='', isSubLocation=false, parentArea=null) {
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
        const prompt = settings.generateAreaDescriptionPrompt.replace('$areaName', areaName);
        response = await generateText(settings.question_param, minContext(3) + "\n" + prompt, '', {
            areaName: areaName
        });
        area.description = response;
    } else {
        area.description = description;
    }

    // Generate potential sublocations
    const sublocationsPrompt = settings.generateSublocationsPrompt
        .replace('$areaName', areaName)
        .replace('$description', area.description);
    
    response = await generateText(settings.question_param, minContext(3) + "\n" + sublocationsPrompt, '', {
        areaName: areaName,
        description: area.description
    });

    const sublocations = response.split('\n');
    for (const line of sublocations) {
        if (line.trim() && !line.includes('None')) {
            const cleanedLine = line.replace(/\-/g, ' ').replace(/[^a-zA-Z\s:]/g, '');
            const [name, ...descriptionParts] = cleanedLine.split(': ');
            const sublocationName = name.trim();
            const sublocationDesc = descriptionParts.join(': ').trim();
            if (sublocationName && sublocationDesc) {
                area.sublocations[sublocationName] = {
                    path: areaName + '/' + sublocationName,
                    name: sublocationName,
                    description: sublocationDesc
                };
            }
        }
    }

    const allPeople = Object.values(areas).flatMap(area => area.people.map(person => person.name)).join(', ');
    const entitiesPrompt = settings.generateEntitiesPrompt
        .replace('$people', allPeople)
        .replace('$areaName', areaName)
        .replace('$description', area.description);

    response = await generateText(settings.question_param, minContext(3) + "\n" + entitiesPrompt, '', {
        areaName: areaName,
        description: area.description
    });

    const lines = response.split('\n');
    let currentSection = null;
    for (const line of lines) {
        const cleanedLine = line.replace(/[^a-zA-Z\s.,-:]/g, '').replace('Name:', '').replace('[-#]', ' ').trim();
        if (cleanedLine.startsWith('People')) {
            currentSection = 'people';
        } else if (cleanedLine.startsWith('Things')) {
            currentSection = 'things';
        } else if (cleanedLine.startsWith('Hostiles')) {
            currentSection = 'hostiles';
        } else if (currentSection && cleanedLine.trim() && !cleanedLine.includes('None') && cleanedLine.includes(':')) {
            const [namePart, ...descriptionParts] = cleanedLine.split(': ');
            const name = namePart.replace(/-/g, ' ').replace(/[^a-zA-Z.-\s]/g, '').trim();
            let description = descriptionParts.join(': ').trim();
            if (!description && lines[lines.indexOf(line) + 1] && !lines[lines.indexOf(line) + 1].includes(':') && lines[lines.indexOf(line) + 1].trim() !== '') {
                description = lines[lines.indexOf(line) + 1].trim();
            }
            let visualPrompt = settings.generateVisualPrompt
                .replace('$name', name)
                .replace('$description', description);

            let visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
                name: name,
                description: description
            });
            
            if(currentSection === 'things')
                visual = "(" + name + "), " + visual;
            const seed = Math.floor(Math.random() * 4294967295) + 1;
            const section = currentSection;
            area[section].push({ name: name, description, visual, seed, image: 'placeholder' });
        }
    }

    let visualPrompt = settings.generateVisualPrompt
        .replace('$name', areaName)
        .replace('$description', area.description);

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
        .replace('$name', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('$name', name)
        .replace('$description', description);

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
        .replace('$name', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('$name', name)
        .replace('$description', description);

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
        .replace('$name', name);

    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    let visualPrompt = settings.generateVisualPrompt
        .replace('$name', name)
        .replace('$description', description);

    const visual = await generateText(settings.question_param, settings.world_description + "\n" + visualPrompt, '', {
        name: name,
        description: description
    });
    
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['hostiles'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addSublocation(name, area=currentArea, text="", context="") {
    const descriptionPrompt = "[Describe the area named " + name + " in 1-2 sentences.]";
    const description = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + descriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    areas[currentArea]['sublocations'][name] = { path: area+'/'+name, name: name, description: description };
    updateImageGrid(currentArea);
}

async function moveToArea(area, prevArea, text="", context="") {
    if (area === currentArea || area === currentArea.split('/').pop()) {
        return;
    }
    let targetArea = null;
    //check if the area exists or is a sublocation within the current area
    if(areas[area]) {
        targetArea = area;
    } else if (areas[currentArea].sublocations[area]) {
        targetArea = areas[currentArea].sublocations[area].path;
        if(!areas[targetArea]) {
            await generateArea(0, 0, targetArea, areas[currentArea].sublocations[area].description, true, areas[currentArea]);
        }
    } else if (area.includes('/')) {
        const [topArea, ...subPaths] = area.split('/');
        if (!areas[topArea]) {
            let newX, newY;
            const maxAttempts = 100;
            let attempts = 0;
            const distance = 30;

            do {
                newX = areas[currentArea.split('/')[0]].x + Math.floor(Math.random() * distance * 2) - distance;
                newY = areas[currentArea.split('/')[0]].y + Math.floor(Math.random() * distance * 2) - distance;
                attempts++;
            } while (attempts < maxAttempts && Object.values(areas).some(a => a.x === newX && a.y === newY));

            if (attempts >= maxAttempts) {
                throw new Error("Unable to find a suitable location for the new area.");
            }

            await generateArea(newX, newY, topArea);
        }

        let currentPath = topArea;
        for (const subPath of subPaths) {
            const parentPath = currentPath;
            currentPath += '/' + subPath;
            await generateArea(0, 0, currentPath, '', true, areas[parentPath]);
            // if area is not listed as a sublocation of the parent, add it
            if (!areas[parentPath].sublocations[subPath]) {
                areas[parentPath].sublocations[subPath] = { path: currentPath, name: subPath, description: areas[currentPath].description };
            }
        }
        targetArea = currentPath;
    } else if (!areas[area]) {
        const areaList = Object.keys(areas).join(', ') + ', ' + Object.keys(areas[currentArea].sublocations).join(', ');

        const prompt = `[Depending on the distance traveled in the passage, would "${area}" be best described as proximate to one of the previously listed locations? Specify the location and only the location name from the list if such is the case, otherwise answer N/A.]`;
        const response = await generateText(settings.question_param, settings.world_description + "\n\n\nPassage:\n" + text + "\nLocations: "+ areaList + "\n\n" + prompt, '', {
            areaList: areaList,
            currentArea: currentArea,
            newArea: area,
            context: context,
            text: text
        });
        if (response !== 'N/A') {
            const responseCleaned = response.replace(/[^a-zA-Z\s]/g, '');
            const parentArea = Object.keys(areas).find(a => {
                const isMatch = a === responseCleaned || Object.keys(areas[a].sublocations).includes(responseCleaned);
                return isMatch;
            });

            await generateArea(0, 0, parentArea + "/" + area, '', true, areas[parentArea]);
            if (!areas[parentArea].sublocations) {
                areas[parentArea].sublocations = {};
            }
            areas[parentArea].sublocations[area] = { path: parentArea + '/' + area, name: area, description: areas[parentArea + '/' + area].description };
            targetArea = parentArea + '/' + area;
        }
    } 
    if(targetArea === null) {
        let newX, newY;
        const maxAttempts = 100;
        let attempts = 0;
        const distance = 30;

        do {
            newX = areas[currentArea.split('/')[0]].x + Math.floor(Math.random() * distance * 2) - distance;
            newY = areas[currentArea.split('/')[0]].y + Math.floor(Math.random() * distance * 2) - distance;
            attempts++;
        } while (attempts < maxAttempts && Object.values(areas).some(a => a.x === newX && a.y === newY));

        if (attempts >= maxAttempts) {
            throw new Error("Unable to find a suitable location for the new area.");
        }

        await generateArea(newX, newY, area);
        targetArea = area;
    }
    

    if(areas[currentArea].people.length > 0) {
        const peopleNames = areas[currentArea].people.map(person => person.name).join(', ');
        const movingPeople = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in a list format separate by '\n' in regard to the passage. If the question can not be answered just respond with 'N/A' and no explanation. Among " + peopleNames + ", who moved with the player?" + "]", '', {
            currentArea: currentArea,
            newArea: area,
            context: context,
            text: text,
            peopleNames: peopleNames
        });
        const movers = movingPeople.split('\n');
        for (const mover of movers) {
            if (mover.trim() != "") {
                const personIndex = areas[currentArea].people.findIndex(person => person.name === mover);
                if (personIndex !== -1) {
                    const person = areas[currentArea].people.splice(personIndex, 1)[0];
                    areas[targetArea].people.push(person);
                }
            }
        }
    }
    currentArea = targetArea;
    if(areas[currentArea].image instanceof Blob)
        document.getElementById('sceneart').src = URL.createObjectURL(areas[currentArea].image);
    else
        document.getElementById('sceneart').src = 'placeholder.png';
    document.getElementById('sceneart').alt = areas[currentArea].description;
    updateImageGrid(currentArea);
}

async function entityLeavesArea(name, text) {
    //ask where name went in the passage among the areas adjacent to the currentarea, then find their index among hostiles or people and move them to the area
    const prompt = `[In the passage, to which of the adjacent areas in the context did ${name} move to? If ambiguous be creative and give the most fitting among the options.]`;
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nPassage:\n" + text + "\n\n" + prompt, '', {
        currentArea: currentArea,
        name: name,
        text: text
    });
    //find the area referenced in response
    let targetArea = null;
    if(areas[response]) {
        targetArea = response;
    } else if (areas[currentArea].sublocations[response]) {
        targetArea = areas[currentArea].sublocations[response].path;
    }
    if(targetArea === null) {
        return;
    }
    if(areas[targetArea] === undefined) {
        await generateArea(0, 0, targetArea);
    }
    const personIndex = areas[currentArea].people.findIndex(person => person.name === name);
    if (personIndex !== -1) {
        const person = areas[currentArea].people.splice(personIndex, 1)[0];
        areas[targetArea].people.push(person);
    } else {
        const hostileIndex = areas[currentArea].hostiles.findIndex(hostile => hostile.name === name);
        if (hostileIndex !== -1) {
            const hostile = areas[currentArea].hostiles.splice(hostileIndex, 1)[0];
            areas[targetArea].hostiles.push(hostile);
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

function advanceTime(timePassed) {
    const dateParts = currentTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
    let [year, month, day, hours, minutes, seconds] = dateParts.slice(1).map(Number);

    seconds += timePassed;
    while (seconds >= 60) {
        seconds -= 60;
        minutes += 1;
    }
    while (minutes >= 60) {
        minutes -= 60;
        hours += 1;
    }
    while (hours >= 24) {
        hours -= 24;
        day += 1;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    while (day > daysInMonth) {
        day -= daysInMonth;
        month += 1;
    }
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    currentTime = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            if (newArea !== currentArea && newArea !== currentArea.split('/').pop()) {
                addConfirmButton('Move to', newArea, (inputValue) => moveToArea(inputValue || newArea, currentArea, text, context));
            }
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
            const name = line.replace("5. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (areas[currentArea].people.some(person => person.name === name) || areas[currentArea].hostiles.some(hostile => hostile.name === name))
                addConfirmButton('Leaving Area', name, (inputValue) => entityLeavesArea(inputValue || name, text));
        } else if (line.startsWith('6.') && !line.includes('N/A') && line.trim() !== '6.') {
            const name = line.replace("6. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (areas[currentArea].hostiles.some(hostile => hostile.name === name))
                addConfirmButton('Befriend', name, (inputValue) => befriendHostile(inputValue || name));
        } else if (line.startsWith('7.') && !line.includes('N/A') && line.trim() !== '7.') {
            const name = line.replace("7. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (areas[currentArea].people.some(person => person.name === name))
                addConfirmButton('Provoke', name, (inputValue) => provokeAlly(inputValue || name));
        } else if (line.startsWith('8.') && !line.includes('N/A') && line.trim() !== '8.') {
            const name = line.replace("8. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (!areas[currentArea].things.some(thing => thing.name === name))
                addConfirmButton('New Thing', name, (inputValue) => addThing(inputValue || name));
        } else if (line.startsWith('9.') && !line.includes('N/A') && line.trim() !== '8.') {
            const name = line.replace("9. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            if (!areas[currentArea].sublocations[name])
                addConfirmButton('New Path', name, (inputValue) => addSublocation(inputValue || name, currentArea, text));
        } else if (line.startsWith('10.') && !line.includes('N/A') && line.trim() !== '10.') {
            const timePassed = line.replace("10. ", '').replace(/[^a-zA-Z\s]/g, '').trim();
            const timePassedLower = timePassed.toLowerCase();
            if (timePassedLower.includes("moments")) {
                advanceTime(randomInt(30) + 4);
            } else if (timePassedLower.includes("minutes")) {
                advanceTime((randomInt(20) + 3) * 60);
            } else if (timePassedLower.includes("hours")) {
                advanceTime((randomInt(2) + 1) * 3600);
            } else if (timePassedLower.includes("full rest")) {
                const dateParts = currentTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
                let [year, month, day, hours, minutes, seconds] = dateParts.slice(1).map(Number);
                let timeToAdvance = 0;
                if(hours < 8) {
                    timeToAdvance = (7 - hours) * 3600 + (60 - minutes) * 60 - seconds;
                } else {
                    timeToAdvance = (31 - hours) * 3600 + (60 - minutes) * 60 - seconds;
                }
                advanceTime(timeToAdvance);
            }
            updateTime();
        }
    }
}

function areaContext(areaPath) {
    let area = areas[areaPath];

    let context = " \nCurrently in: " + area.name + " : " + area.description + "\n\n";
    
    context += "Paths or Exits may lead to:\n";
    if (Object.keys(area.sublocations).length > 0) {
        for (const [name, subloc] of Object.entries(area.sublocations)) {
            context += name + ": " + subloc.description + "\n";
        }
    }
    if (areaPath.includes('/')) {
        const parentArea = areaPath.split('/').slice(0, -1).join('/');
        context += parentArea.split('/').pop() + ": " + areas[parentArea].description + "\n";
    }
    context += "\n";

    if(area.people.length > 0) {
        context += "People within" + area.name + "\n";
        for(let i = 0; i < area.people.length; i++) {
            context += area.people[i].name + ": " + area.people[i].description + "\n";
        }
        context += "\n";
    }
    if(area.things.length > 0) {
        context += "Things within" + area.name + "\n";
        for(let i = 0; i < area.things.length; i++) {
            context += area.things[i].name + ": " + area.things[i].description + "\n";
        }
        context += "\n";
    }
    if(area.hostiles.length > 0) {
        context += "Hostiles within" + area.name + "\n";
        for(let i = 0; i < area.hostiles.length; i++) {
            context += area.hostiles[i].name + ": " + area.hostiles[i].description + "\n";
        }
        context += "\n";
    }
    context += "Time: " + + getTimeofDay() + " in " + getSeason() + "\n";
    return context;
}

function fullContext(limit = null) {
    let outputContent = document.getElementById('output').innerText;
    if (limit !== null) {
        const output = document.getElementById('output');
        const children = Array.from(output.children);
        const limitedChildren = children.slice(-limit);
        outputContent = limitedChildren.map(child => child.outerText).join('');
    }
    return settings.full_context
        .replace('$world', settings.world_description)
        .replace('$player', settings.player_name)
        .replace('$player_desc', settings.player_description)
        .replace('$locale', areaContext(currentArea))
        .replace('$story', outputContent);
}

function minContext(limit = null) {
    let outputContent = document.getElementById('output').innerText;
    if (limit !== null) {
        const output = document.getElementById('output');
        const children = Array.from(output.children);
        const limitedChildren = children.slice(-limit);
        outputContent = limitedChildren.map(child => child.outerText).join('');
    }
    return settings.full_context
        .replace('$world', settings.world_description)
        .replace('$player', '')
        .replace('$player_desc', '')
        .replace('$locale', '')
        .replace('$story', outputContent);
}

function faeCharSheet(charsheet) {
    // charsheet string should begin with Stunts, a comma separated list of each stun be key name and value, then Aspects, a comma separated list of each aspect be key name and value, then Consequences, a comma separated list of each consequence be key name and value.
    let charsheetString = "Stunts: ";
    for (const [key, value] of Object.entries(charsheet.stunts)) {
        charsheetString += key + ": " + value + ", ";
    }

    charsheetString += "\n" +
        "Aspects: " + charsheet.high_concept + ", " + charsheet.aspects + "\n" +
        "Consequences: " + charsheet.trouble;
    if(charsheet.consequences) {
        if (charsheet.consequences.mild && charsheet.consequences.mild.length > 0) {
            charsheetString += ", " + charsheet.consequences.mild.join(', ');
        }
        if (charsheet.consequences.moderate && charsheet.consequences.moderate.length > 0) {
            charsheetString += ", " + charsheet.consequences.moderate.join(', ');
        }
        if (charsheet.consequences.severe && charsheet.consequences.severe.length > 0) {
            charsheetString += ", " + charsheet.consequences.severe.join(', ');
        }
    }
    charsheetString += "\n";
    console.log(charsheetString);
    return charsheetString;
}

async function playerAction(action) {
    switch (settings.rule_set) {
        case 'Fate Accelerated':
            const prompt = settings.ruleprompt_fae_action1.replace('$action', action);
            const response = await generateText(settings.question_param, fullContext(2) + "\n\n" + faeCharSheet(settings.charsheet_fae) + prompt, '', {
                action: action,
                currentArea: currentArea
            });
            const lines = response.toLowerCase().split('\n');
            let disadvantage = 2;
            let advantage = 0;

            for (const line of lines) {
                if (line.startsWith('1.') && !line.includes('N/A') && line.trim() !== '1.') {
                    // conditionals if line contains trivial, challeng, extreme, or impossible. plausible is default case
                    if (line.includes('trivial')) {
                        return "[Continue the story for another two paragraphs as player " + action + "]";
                    } else if (line.includes('challeng')) {
                        disadvantage += 2;
                    } else if (line.includes('extreme')) {
                        disadvantage += 4;
                    } else if (line.includes('impossible')) {
                        return "[Continue the story for another two paragraphs as player considers the possibility of " + action + "]";
                    }
                } else if (line.startsWith('2.') && !line.includes('N/A') && line.trim() !== '2.') {
                    //conditions if line contains careful, clever, flashy, forceful, quick, or sneaky.
                    if (line.includes('careful')) {
                        advantage += settings.charsheet_fae.approaches['careful'];
                    } else if (line.includes('clever')) {
                        advantage += settings.charsheet_fae.approaches['clever'];
                    } else if (line.includes('flashy')) {
                        advantage += settings.charsheet_fae.approaches['flashy'];
                    } else if (line.includes('forceful')) {
                        advantage += settings.charsheet_fae.approaches['forceful'];
                    } else if (line.includes('quick')) {
                        advantage += settings.charsheet_fae.approaches['quick'];
                    } else if (line.includes('sneaky')) {
                        advantage += settings.charsheet_fae.approaches['sneaky'];
                    }
                } else if (line.startsWith('3.') && !line.includes('N/A') && line.trim() !== '3.') {
                    // simply count the number of commas returned and add to the advantage
                    advantage += line.split(',').length;;
                } else if (line.startsWith('4.') && !line.includes('N/A') && line.trim() !== '4.') {
                    // simply count the number of commas returned and add to the disadvantage
                    disadvantage += line.split(',').length;;
                }
            }
            // roll 4d4-8+advantage-disadvantage
            let roll = randomInt(3) + randomInt(3) + randomInt(3) + randomInt(3) - 4 + advantage - disadvantage;
            console.log('Roll 4d4-8 +',advantage,'-',disadvantage,'=', roll);
            if(roll >= 3) {
                return "[The player's actions are extremely successful, so much so that they will create advantages in similar actions in the future. Continue the story for another two paragraphs as player successfully " + action + "]";
            } else if (roll >= 1) {
                return "[Continue the story for another two paragraphs as player successfully " + action + "]";
            } else if (roll === 0) {
                return "[Continue the story for another two paragraphs as player attempts to " + action + "]";
            } else if (roll >= -2) {
                return "[Continue the story for another two paragraphs as player fails to " + action + ". While a failure, it may still achieve the desired result at a cost.]";
            } else {
                return "[Continue the story for another two paragraphs as player fails to " + action + ". The failure is significant having negative consequences for the player.]";
            }
        case 'pathfinder2e':
            return pathfinder2eAction(action);
        default:
            return "[Continue the story as player " + action +"]";
    }
}

async function sendMessage(message = input.value) {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const messageElement = document.createElement('div');
    messageElement.classList.add('new-message');
    input.value = '';

    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    const priorMessageElement = output.querySelector('.new-message');
    if (priorMessageElement) {
        priorMessageElement.classList.remove('new-message');
    }

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
            } else if (command === '/move') {
                await moveToArea(name, currentArea);
            } 
            if (message.startsWith('//')) {
                const directInput = document.createElement('div');
                directInput.innerHTML = message.replace('//', '');
                output.appendChild(directInput);
                output.scrollTop = output.scrollHeight;
                messageElement.innerHTML = '\n[Continue the story for another two paragraphs.]';
            } else return;
        } else {
            messageElement.innerHTML = await playerAction(message);
        }
    } else {
        messageElement.innerHTML = '\n[Continue the story for another two paragraphs.]';
    }

    output.appendChild(messageElement);
    output.scrollTop = output.scrollHeight;

    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext(), '', {
        message: message,
        currentArea: currentArea,
        playerName: settings.player_name
    }));
    
    messageElement.innerHTML = "<br>" + text.replace(/\n/g, '<br>');
    output.scrollTop = output.scrollHeight;

    await outputCheck(text, output.textContent);
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
    
    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext() + "\n" + "[Generate the beginning of the story as the player starts the day. Response should be less than 300 words.]", '', {
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

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function getTimeofDay() {
    const hours = parseInt(currentTime.match(/(\d{2}):/)[1], 10);
    if (hours >= 2 && hours < 6) {
        return "Early Morning before dawn";
    } else if (hours >= 6 && hours < 12) {
        return "Morning";
    } else if (hours >= 11 && hours < 13) {
        return "Noonish";
    } else if (hours >= 13 && hours < 17) {
        return "Afternoon";
    } else if (hours >= 17 && hours < 22) {
        return "Evening";
    } else {
        return "Late Night";
    }
}

function getSeason() {
    const seasons = ["Winter", "Spring", "Summer", "Fall"];
    const month = parseInt(currentTime.match(/-(\d{2})-/)[1], 10) - 1;
    return seasons[Math.floor((month % 12) / 3)];
}

function updateTime() {
    const timeElement = document.getElementById('currentTime');
    const season = getSeason();
    timeElement.innerHTML = `${season} ${currentTime}`;
}

let areas = {};
let currentArea;
let currentTime;

    loadSettings();
    overrideSettings();
    areas[settings.starting_area] = {};
    currentArea = settings.starting_area;
    currentTime = settings.starting_date;
    updateTime();

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

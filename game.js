async function generateVisualPrompt(name, description) {
    const visualPrompt = replaceVariables(settings.generateVisualPrompt, {
        name: name,
        description: description,
        time: getTimeofDay(),
        season: getSeason()

    });

    return await generateText(settings.creative_question_param, settings.world_description + "\n" + visualPrompt, '', {
        name: name,
        description: description
    });
}

async function generateArea(areaName, description='', x=0, y=0, contextDepth=0, sublocation='') {
    if (areas[areaName]) {
        return;
       // else if area's parent does not exist, generate the parent area first 
    } else if (areaName.includes('/') && !areas[areaName.split('/').slice(0, -1).join('/')]) {
        await generateArea(areaName.split('/').slice(0, -1).join('/'), '', x, y, contextDepth, areaName);
    }
    let area;
    areas[areaName] = {};
    area = areas[areaName];

    area.name = areaName.split('/').pop();
    area.seed = Math.floor(Math.random() * 4294967295) + 1;
    if (!areaName.includes('/')) {
        area.x = x;
        area.y = y;
    } else {
        const parentPath = areaName.split('/').slice(0, -1).join('/');
        const subName = areaName.split('/').pop();
        if (areas[parentPath]?.sublocations[subName]?.tempImage) {
            URL.revokeObjectURL(areas[parentPath].sublocations[subName].tempImage);
            delete areas[parentPath].sublocations[subName].tempImage;
        }
    }
    area['people'] = [];
    area['things'] = [];
    area['creatures'] = [];
    area['sublocations'] = [];
    if(sublocation !== '') {
            area.sublocations[sublocation.split('/').pop()] = {
                path: sublocation,
                name: sublocation.split('/').pop()
            };
        }

    let response;
    if (description == '') {
        const prompt = replaceVariables(settings.generateAreaDescriptionPrompt, {
            areaName: area.name,
            time: getTimeofDay(),
            season: getSeason(),    
            description: area.description,
            world: "World Info: " + settings.world_description + "\n",
            mainLocation: areaName.includes('/') ? "Within the " + areas[areaName.split('/')[0]].name + " described as " + areas[areaName.split('/')[0]].description + "\n" : '',
            parentArea: (areaName.match(/\//g) || []).length > 1 ? "More Locally within: " + areaName.split('/').slice(0, -1).join('/') : '',
            });
        response = await generateText(settings.creative_question_param, minContext(contextDepth) + "\n" + prompt, '', {
            areaName: area.name
        });
        area.description = response;
    } else {
        area.description = description;
    }
    area.lastVisted = '';

    // Generate potential sublocations
    const existingLocations = Object.keys(areas)
        .filter(key => key.startsWith(areaName.split('/')[0]))
        .flatMap(key => Object.keys(areas[key].sublocations))
        .join(', ')
        + ',' + areaName.split('/')[0];
    
    response = await generateText(settings.creative_question_param, settings.generateSublocationsPrompt, '', {
        areaName: area.name,
        description: area.description,
        locations: existingLocations ? "Existing Nearby Locations: " + existingLocations : '',
        world: "World Info: " + settings.world_description + "\n",
        mainLocation: areaName.includes('/') ? "Within the " + areas[areaName.split('/')[0]].name + " described as " + areas[areaName.split('/')[0]].description + "\n" : '',
        parentArea: (areaName.match(/\//g) || []).length > 1 ? "More Locally within: " + areaName.split('/').slice(0, -1).join('/') : '',
        topAreaDirective: (!areaName.includes('/')) ? settings.topAreaDirective : '',
    }, settings.sampleSublocations);
    let lines = response.split('\n');
    let currentSection = null;
    for (const line of lines) {
        const cleanedLine = line.replace('Name:', '').stripNonAlpha(':,.').trim();
        if (cleanedLine.startsWith('Things')) {
            currentSection = 'things';
        } else if (cleanedLine.startsWith('Locations')) {
            currentSection = 'locations';
        } else if (currentSection && cleanedLine && !cleanedLine.includes('None') && cleanedLine.includes(':')) {
            const [namePart, ...descriptionParts] = cleanedLine.split(':');
            const name = namePart.trim();
            let description = descriptionParts.join(':').trim();
            if (!description && lines[lines.indexOf(line) + 1] && !lines[lines.indexOf(line) + 1].includes(':') && lines[lines.indexOf(line) + 1].trim() !== '') {
                description = lines[lines.indexOf(line) + 1].trim();
            }

            
            if(currentSection === 'things') {
                let visual = "(" + name + "), " + await generateVisualPrompt(name, description);
                const seed = Math.floor(Math.random() * 4294967295) + 1;
                const section = currentSection;
                area[section].push({ name: name, description, visual, seed, image: 'placeholder' });
            } else {
                area.sublocations[name] = {
                    path: areaName + '/' + name,
                    name: name,
                    description: description
                };
            }
        }
    }

    const allPeople = Object.values(areas).flatMap(area => area.people.map(person => person.name)).join(', ');
    response = await generateText(settings.creative_question_param, settings.generateEntitiesPrompt, '', {
        people: allPeople,
        areaName: area.name,
        description: area.description,
        world: "World Info: " + settings.world_description + "\n",
        mainLocation: areaName.includes('/') ? "Within the " + areas[areaName.split('/')[0]].name + " described as " + areas[areaName.split('/')[0]].description + "\n" : '',
        parentArea: (areaName.match(/\//g) || []).length > 1 ? "More Locally within: " + areaName.split('/').slice(0, -1).join('/') : '',
    }, settings.sampleEntities);

    lines = response.split('\n');
    currentSection = null;
    for (const line of lines) {
        const cleanedLine = line.replace('Name:', '').stripNonAlpha(':,.').trim();
        if (cleanedLine.startsWith('People')) {
            currentSection = 'people';
        } else if (cleanedLine.startsWith('Creatures')) {
            currentSection = 'creatures';
        } else if (currentSection && cleanedLine && !cleanedLine.includes('None') && cleanedLine.includes(':')) {
            const [namePart, ...descriptionParts] = cleanedLine.split(':');
            const name = namePart.trim();
            let description = descriptionParts.join(':').trim();
            if (!description && lines[lines.indexOf(line) + 1] && !lines[lines.indexOf(line) + 1].includes(':') && lines[lines.indexOf(line) + 1].trim() !== '') {
                description = lines[lines.indexOf(line) + 1].trim();
            }

            let visual = await generateVisualPrompt(name, description);
            const seed = Math.floor(Math.random() * 4294967295) + 1;
            const section = currentSection;
            area[section].push({ name: name, description, visual, seed, image: 'placeholder' });
        }
    }

    area.visual = await generateVisualPrompt(area.name, area.description);
    
    area.image = 'placeholder';
    if (!areaName.includes('/')) {
        addLocation(areaName);
    }

    setTimeout(async () => {
        const artBlob = await generateArt(area.visual, "", area.seed);
        if (artBlob instanceof Blob) {
            area.image = artBlob;
            if (areaName === currentArea) {
                document.getElementById('sceneart').src = URL.createObjectURL(artBlob);
            }
            if (!areaName.includes('/')) {
                const locationElement = document.getElementById(`location-${areaName}`);
                if (locationElement) {
                    locationElement.style.backgroundImage = `url(${URL.createObjectURL(artBlob)})`;
                }
            }
        }
    }, 0);
}

function moveHere(name, key=false, type=false) {
    if (key && type) {
        const entityIndex = areas[key][type].findIndex(entity => entity.name === name);
        if (entityIndex !== -1) {
            const entity = areas[key][type].splice(entityIndex, 1)[0];
            areas[currentArea][type].push(entity);
            updateImageGrid(currentArea);
        } else {
            return;
        }
    } else if (key) {
        const entityIndex = areas[key]['creatures'].findIndex(entity => entity.name === name);
        if (entityIndex !== -1) {
            const entity = areas[key]['creatures'].splice(entityIndex, 1)[0];
            areas[currentArea]['creatures'].push(entity);
            updateImageGrid(currentArea);
        } else {
            return;
        }
    } else return;
}

function addFollower(entity) {
    const personIndex = areas[currentArea]['people'].findIndex(person => person === entity);
    if (personIndex !== -1) {
        const person = areas[currentArea]['people'].splice(personIndex, 1)[0];
        person.type = 'people';
        followers.push(person);
    } else {
        const creatureIndex = areas[currentArea]['creatures'].findIndex(creature => creature === entity);
        if (creatureIndex !== -1) {
            const creature = areas[currentArea]['creatures'].splice(creatureIndex, 1)[0];
            creature.type = 'creatures';
            followers.push(creature);
        }
    }
    updateImageGrid(currentArea);
}

function dismissFollower(entity) {
    const followerIndex = followers.findIndex(follower => follower === entity);
    if (followerIndex !== -1) {
        const follower = followers.splice(followerIndex, 1)[0];
        if (follower.type === 'people') {
            areas[currentArea]['people'].push(follower);
        } else if (follower.type === 'creatures') {
            areas[currentArea]['creatures'].push(follower);
        }
    }
    updateImageGrid(currentArea);
}

async function addPerson(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.creative_question_param, "\n\nContext:\n" + context +"\n" + text + "\n\n" + addPersonDescriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text,
        world: settings.world_description,
        areaName: area.name,
        areaDescription: area.description
    });
    
    const visual = await generateVisualPrompt(name, description);
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['people'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addThing(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.creative_question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + settings.addThingDescriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    const visual = await generateVisualPrompt(name, description);
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['things'].push({ 
        name, 
        description, 
        visual: `(${name}), ${visual}`, 
        seed, 
        image: 'placeholder' 
    });
    updateImageGrid(currentArea);
}

async function addCreature(name, area=currentArea, context="", text="") {
    const description = await generateText(settings.creative_question_param, settings.world_description + "\n" + areaContext(area) + "\n\nContext:\n" + context +"\n" + text + "\n\n" + settings.addCreatureDescriptionPrompt, '', {
        name: name,
        area: area,
        context: context,
        text: text
    });
    
    const visual = await generateVisualPrompt(name, description);
    const seed = Math.floor(Math.random() * 4294967295) + 1;
    areas[currentArea]['creatures'].push({ name, description, visual, seed, image: 'placeholder' });
    updateImageGrid(currentArea);
}

async function addSublocation(name, area=currentArea, text="", context="") {
    const description = await generateText(settings.creative_question_param, "Context:\n" + context +"\n" + text + "\n\n" + settings.generateAreaDescriptionPrompt, '', {
        name: name,
        time: getTimeofDay(),
        season: getSeason(),
        world: "World Info: " + settings.world_description + "\n",
        mainLocation: areas[area].name.includes('/') ? "Within the " + areas[areas[area].name.split('/')[0]].name + " described as " + areas[areas[area].name.split('/')[0]].description + "\n" : '',
        parentArea: (areas[area].name.match(/\//g) || []).length > 1 ? "More Locally within: " + areas[area].name.split('/').slice(0, -1).join('/') : '',
        area: areas[area].name,
        context: context,
        text: text
    });
    
    areas[currentArea]['sublocations'][name] = { path: area+'/'+name, name: name, description: description };
    updateImageGrid(currentArea);
}

async function entityLeavesArea(name, text) {
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nPassage:\n" + text + "\n\n" + settings.entityLeavesAreaPrompt, '', {
        currentArea: currentArea,
        name: name,
        text: text
    }, settings.sampleQuestions);
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
        await generateArea(targetArea);
    }
    const personIndex = areas[currentArea].people.findIndex(person => person.name === name);
    if (personIndex !== -1) {
        const person = areas[currentArea].people.splice(personIndex, 1)[0];
        areas[targetArea].people.push(person);
    } else {
        const creatureIndex = areas[currentArea].creatures.findIndex(creature => creature.name === name);
        if (creatureIndex !== -1) {
            const creature = areas[currentArea].creatures.splice(creatureIndex, 1)[0];
            areas[targetArea].creatures.push(creature);
        }
    }
    updateImageGrid(currentArea);
}

async function generateNewDescription(name, type) {
    if (type === 'people' || type === 'player') {
        return await generateText(settings.creative_question_param, settings.addPersonDescriptionPrompt, '', {
            name: name,
            world: settings.world_description,
            areaName: currentArea.name,
            areaDescription: currentArea.description
        });
    
    } else if (type === 'creatures') {
        return await generateText(settings.creative_question_param, settings.addCreatureDescriptionPrompt, '', {
            name: name,
            world: settings.world_description,
            areaName: currentArea.name,
            areaDescription: currentArea.description
        });
    } else if (type === 'things') {
        return await generateText(settings.creative_question_param, settings.addThingDescriptionPrompt, '', {
            name: name,
            world: settings.world_description,
            areaName: currentArea.name,
            areaDescription: currentArea.description
        });
    } else {
        return await generateText(settings.creative_question_param, settings.generateAreaDescriptionPrompt, '', {
            areaName: name,
            time: getTimeofDay(),
            season: getSeason(),
            world: "World Info: " + settings.world_description + "\n",
            mainLocation: '',
            parentArea: ''
        });
    }
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
}

function renameEntity(name, prevName) {
    const followerIndex = followers.findIndex(follower => follower.name === prevName);
    if (followerIndex !== -1) {
        const follower = followers[followerIndex];
        follower.name = name;
    } else {
        const personIndex = areas[currentArea]['people'].findIndex(person => person.name === prevName);
        if (personIndex !== -1) {
            const person = areas[currentArea]['people'][personIndex];
            person.name = name;
        } else {
            const creatureIndex = areas[currentArea]['creatures'].findIndex(creature => creature.name === prevName);
            if (creatureIndex !== -1) {
                const creature = areas[currentArea]['creatures'][creatureIndex];
                creature.name = name;
            } else {
                const thingIndex = areas[currentArea]['things'].findIndex(thing => thing.name === prevName);
                if (thingIndex !== -1) {
                    const thing = areas[currentArea]['things'][thingIndex];
                    thing.name = name;
                }
            }
        }
    }
    updateImageGrid(currentArea);
}

function befriendCreature(name) {
    const creatureIndex = areas[currentArea]['creatures'].findIndex(creature => creature.name === name);
    if (creatureIndex !== -1) {
        const creature = areas[currentArea]['creatures'].splice(creatureIndex, 1)[0];
        areas[currentArea]['people'].push(creature);
    }
    updateImageGrid(currentArea);
}

function provokeAlly(name) {
    const personIndex = areas[currentArea]['people'].findIndex(person => person.name === name);
    if (personIndex !== -1) {
        const person = areas[currentArea]['people'].splice(personIndex, 1)[0];
        areas[currentArea]['creatures'].push(person);
    }
    updateImageGrid(currentArea);
}

async function outputCheck(text, context="") {
    const prompt = settings.outputCheckPrompt;
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nPassage:\n" + text + "\n\n" + prompt, '', {
        currentArea: currentArea,
        context: context,
        text: text
    }, settings.sampleQuestions);
    const lines = response.split('\n');

    for (const line of lines) {
        if (line.startsWith('1.') && !line.includes('n/a') && line.trim() !== '1.') {
            const names = line.replace("1. ", '').trim().split(',').map(name => name.stripNonAlpha().trim());
            for (const name of names) {
                if (!areas[currentArea]['people'].some(person => person.name.toLowerCase() === name.toLowerCase()) && !followers.some(follower => follower.name.toLowerCase() === name.toLowerCase()) && name.toLowerCase() != settings.player_name.toLowerCase()) {
                    addConfirmButton('New Person', name, (inputValue) => addPerson(inputValue || name, currentArea, text, context));
                }
            }
        } else if (line.startsWith('2.') && !line.includes('n/a') && line.trim() !== '2.') {
            const names = line.replace("2. ", '').trim().split(',').map(name => name.stripNonAlpha().trim());
            for (const name of names) {
                if (!areas[currentArea]['creatures'].some(creature => creature.name.toLowerCase() === name.toLowerCase())  && !followers.some(follower => follower.name.toLowerCase() === name.toLowerCase()) && name.toLowerCase() != settings.player_name.toLowerCase()) {
                    addConfirmButton('New Creature', name, (inputValue) => addCreature(inputValue || name, currentArea, text, context));
                }
            }
        } else if (line.startsWith('3.') && !line.includes('n/a') && line.trim() !== '3.') {
            const newArea = line.replace("3. ", '').stripNonAlpha().trim();
            if (newArea !== currentArea && newArea !== currentArea.split('/').pop()) {
                addConfirmButton('Move to', newArea, (inputValue) => moveToArea(inputValue || newArea, 0, text, 3));
            }
        } else if (line.startsWith('4.') && !line.includes('n/a') && line.trim() !== '4.') {
            const newName = line.replace("4. ", '').stripNonAlpha().trim();
            // check for false positive of name of someone already here
            if (!areas[currentArea].people.some(person => person.name.toLowerCase() === newName.toLowerCase()) && newName.toLowerCase() != settings.player_name.toLowerCase() && !followers.some(follower => follower.name.toLowerCase() === newName.toLowerCase())) {
                const peopleNames = areas[currentArea].people.map(person => person.name).join(', ') + (followers.length > 0 ? ', ' + followers.map(follower => follower.name).join(', ') : '');
                const prevName = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nContext:\n" + context + "\n\nPassage:\n" + text + "\n\n[Answer the following question in regard to the passage. If the question can not be answered just respond with 'n/a' and no explanation. Among " + peopleNames + ", who is " + newName + "?" + "]", '', {
                    peopleNames: peopleNames,
                    newName: newName,
                    currentArea: currentArea,
                    context: context,
                    text: text
                }, settings.sampleQuestions);
                if (prevName.trim() != "n/a" && areas[currentArea].people.some(person => person.name.toLowerCase() === prevName.toLowerCase()) || followers.some(follower => follower.name.toLowerCase() === prevName.toLowerCase())) {
                    addConfirmButton('Rename ' + prevName, newName, (inputValue) => renameEntity(inputValue || newName, prevName));
                } else {
                    // Check if newName exists as a person in some other area, and then delete that person
                    let match = false;
                    for (const areaKey in areas) {
                        if (areas[areaKey].people.some(person => person.name === newName)) {
                            addConfirmButton('Move Here', newName, (inputValue) => moveHere(inputValue || newName, areaKey, 'people'));
                            match = true;
                            break;
                        }
                    }
                    if(!match)
                        addConfirmButton('New Person', newName, (inputValue) => addPerson(inputValue || newName, currentArea, text, context));
                }
            }
        } else if (line.startsWith('5.') && !line.includes('n/a') && line.trim() !== '5.') {
            const name = line.replace("5. ", '').stripNonAlpha().trim();
            if (areas[currentArea].people.some(person => person.name.toLowerCase() === name.toLowerCase()) || areas[currentArea].creatures.some(creature => creature.name.toLowerCase() === name.toLowerCase()))
                addConfirmButton('Leaving Area', name, (inputValue) => entityLeavesArea(inputValue || name, text));
        } else if (line.startsWith('6.') && !line.includes('n/a') && line.trim() !== '6.') {
            const name = line.replace("6. ", '').stripNonAlpha().trim();
            if (areas[currentArea].creatures.some(creature => creature.name.toLowerCase() === name.toLowerCase()))
                addConfirmButton('Befriend', name, (inputValue) => befrienCreature(inputValue || name));
        } else if (line.startsWith('7.') && !line.includes('n/a') && line.trim() !== '7.') {
            const name = line.replace("7. ", '').stripNonAlpha().trim();
            if (areas[currentArea].people.some(person => person.name.toLowerCase() === name.toLowerCase()))
                addConfirmButton('Provoke', name, (inputValue) => provokeAlly(inputValue || name));
        } else if (line.startsWith('8.') && !line.includes('n/a') && line.trim() !== '8.') {
            const name = line.replace("8. ", '').stripNonAlpha().trim();
            if (!areas[currentArea].things.some(thing => thing.name.toLowerCase() === name.toLowerCase()))
                addConfirmButton('New Thing', name, (inputValue) => addThing(inputValue || name));
        } else if (line.startsWith('9.') && !line.includes('n/a') && line.trim() !== '9.') {
            const name = line.replace("9. ", '').stripNonAlpha().trim();
            if (!areas[currentArea].sublocations[name])
                addConfirmButton('New Path', name, (inputValue) => addSublocation(inputValue || name, currentArea, text));
        }
    }
}

async function outputAutoCheck(text, context="") {
    const prompt = settings.outputAutoCheckPrompt;
    const response = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nPassage:\n" + text + "\n\n" + prompt, '', {
        currentArea: currentArea,
        context: context,
        text: text,
        player: settings.player_name
    }, settings.sampleQuestions);
    const lines = response.split('\n');

    for (const line of lines) {
        if (line.startsWith('1.') && !line.includes('n/a') && line.trim() !== '1.') {
            const timePassed = line.replace("1. ", '').stripNonAlpha().trim();
            const timePassedLower = timePassed.toLowerCase();
            if (timePassedLower.includes("moments")) {
                advanceTime(randomInt(30) + 4);
            } else if (timePassedLower.includes("minutes")) {
                advanceTime((randomInt(20) + 3) * 60);
            } else if (timePassedLower.includes("hours")) {
                advanceTime((randomInt(2) + 1) * 3600);
            } else if (timePassedLower.includes("full rest")) {
                const dateParts = settings.current_time.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
                let [year, month, day, hours, minutes, seconds] = dateParts.slice(1).map(Number);
                let timeToAdvance = 0;
                if(hours < 8) {
                    timeToAdvance = (7 - hours) * 3600 + (60 - minutes) * 60 - seconds;
                } else {
                    timeToAdvance = (31 - hours) * 3600 + (60 - minutes) * 60 - seconds;
                }
                // if player has mild consequence, remove the first in the array, else if moderate, check the first time in consquenceTimee.moderate, if it's been more than 7 days, remove it and the first moderate consequnce, if no moderate consequences, but a severe, check the first time in consquenceTimee.severe, if it's been more than 30 days, remove it and the first severe consequnce
                if (settings.charsheet_fae.consequences.mild.length > 0) {
                    settings.charsheet_fae.consequences.mild.shift();
                } else if (settings.charsheet_fae.consequences.moderate.length > 0) {
                    const firstModerateTime = settings.charsheet_fae.consequenceTime.moderate[0];
                    if (timeDiff(firstModerateTime, settings.current_time) > 7*60*60*24) {
                        settings.charsheet_fae.consequences.moderate.shift();
                        settings.charsheet_fae.consequenceTime.moderate.shift();
                    }
                } else if (settings.charsheet_fae.consequences.severe.length > 0) {
                    const firstSevereTime = settings.charsheet_fae.consequenceTime.severe[0];
                    if (timeDiff(firstSevereTime, settings.current_time) > 30*60*60*24) {
                        settings.charsheet_fae.consequences.severe.shift();
                        settings.charsheet_fae.consequenceTime.severe.shift();
                    }
                }
                updateConsequences();
                advanceTime(timeToAdvance);
            }
            updateTime();
        } else if (line.startsWith('2.') && !line.includes('n/a') && line.trim() !== '2.') {
            const name = line.replace("2. ", '').stripNonAlpha().trim();
            let section = null;
            let target = null;
            if (name.toLowerCase() === settings.player_name.toLowerCase() || name.toLowerCase() === "you") {
                const response = await generateText(settings.creative_question_param, minContext(3) + settings.consequencePrompt, '', {
                    player: settings.player_name,
                    description: settings.player_description
                },settings.sampleQuestions);
                let severity = 0;
                for(const consequenceTest of response.split('\n')) {
                    if (consequenceTest.startsWith('1.') && !consequenceTest.includes('n/a') && consequenceTest.trim() !== '1.') {
                        const timeInjured = consequenceTest.replace("1. ", '').stripNonAlpha().toLowerCase().trim();
                        if (timeInjured.includes("hours") && severity === 0) {
                            severity = 1;
                        } else if (timeInjured.includes("days") && severity <= 1) {
                            severity = 2;
                        } else if ((timeInjured.includes("years") || timeInjured.includes("longer")) && severity <= 2) {
                            severity = 3;
                        }
                    } else if (severity > 0 && consequenceTest.startsWith('2.') && !consequenceTest.includes('n/a') && consequenceTest.trim() !== '2.') {
                        const consequence = consequenceTest.replace("2. ", '').stripNonAlpha().trim();
                        console.log("Adding consequence.",severity,consequence);
                        if(!settings.charsheet_fae.consequences) {
                            settings.charsheet_fae.consequences = { mild: [], moderate: [], severe: [] };
                        }
                        if (!settings.charsheet_fae.consequenceTime) {
                            settings.charsheet_fae.consequenceTime = { moderate: [], severe: [] };
                        }
                        if (severity === 1) {
                            settings.charsheet_fae.consequences.mild.push(consequence);
                        } else if (severity === 2) {
                            settings.charsheet_fae.consequences.moderate.push(consequence);
                            settings.charsheet_fae.consequenceTime.moderate.push(settings.current_time);
                        } else if (severity === 3) {
                            settings.charsheet_fae.consequences.severe.push(consequence);
                            settings.charsheet_fae.consequenceTime.severe.push(settings.current_time);
                        }

                    }
                    updateConsequences();
                }

            } else if (areas[currentArea].people.some(person => person.name === name)) {
                section = 'people';
                target = areas[currentArea].people.find(person => person.name === name);
            } else if (areas[currentArea].creatures.some(creature => creature.name === name)) {
                section = 'creatures';
                target = areas[currentArea].creatures.find(creature => creature.name === name);
            } else if (areas[currentArea].things.some(thing => thing.name === name)) {
                section = 'things';
                target = areas[currentArea].things.find(thing => thing.name === name);
            } else if (followers.some(follower => follower.name === name)) {
                section = 'followers';
                target = followers.find(follower => follower.name === name);
            }
            if (section && target) {
                const description = await generateText(settings.creative_question_param, minContext(3) + settings.generateNewDescription, '', {
                    name: target.name,
                    description: target.description
                });

                console.log("Generated new description for " + name + " changing\n\n " + target.description + "\n\n " + description);

                target.description = description;
            }

        }
    }
}

function areaContext(areaPath) {
    let area = areas[areaPath];
    let context = replaceVariables(settings.areaContext, { 
        name: area.name, 
        description: area.description 
    });
    
    // Build entity lists
    if(area.people.length > 0) {
        let peopleList = area.people.map(person => 
            replaceVariables(settings.entityFormat, { 
                name: person.name, 
                description: person.description 
            })
        ).join('');
        context += replaceVariables(settings.areaPeopleContext, { 
            name: area.name, 
            peopleList 
        });
    }
    
    if(area.things.length > 0) {
        let thingsList = area.things.map(thing => 
            replaceVariables(settings.entityFormat, { 
                name: thing.name, 
                description: thing.description 
            })
        ).join('');
        context += replaceVariables(settings.areaThingsContext, { 
            name: area.name, 
            thingsList 
        });
    }
    
    if(area.creatures.length > 0) {
        let creaturesList = area.creatures.map(creature => 
            replaceVariables(settings.entityFormat, { 
                name: creature.name, 
                description: creature.description 
            })
        ).join('');
        context += replaceVariables(settings.areaCreaturesContext, { 
            name: area.name, 
            creaturesList 
        });
    }
    if(followers.length > 0) {
        let followersList = followers.map(follower =>
            replaceVariables(settings.entityFormat, {
                name: follower.name,
                description: follower.description
            })
        ).join('');
        context += replaceVariables(settings.areaFollowersContext, {
            name: area.name,
            followersList
        });
    }

    // Build paths context
    let paths = '';
    if (Object.keys(area.sublocations).length > 0) {
        for (const [name, subloc] of Object.entries(area.sublocations)) {
            paths += replaceVariables(settings.subLocationFormat, {
                name: name,
                description: subloc.description
            });
        }
    }
    if (areaPath.includes('/')) {
        const parentArea = areaPath.split('/').slice(0, -1).join('/');
        paths += replaceVariables(settings.subLocationFormat, {
            name: parentArea.split('/').pop(),
            description: areas[parentArea].description
        });
    }
    context += replaceVariables(settings.areaPathsContext, { paths });

    context += replaceVariables(settings.areaTimeContext, {
        timeOfDay: getTimeofDay(),
        season: getSeason(),
        dayOfWeek: getDayOfWeek(),
        time: getPreciseTime()
    });

    return context;
}

function fullContext(limit = null, summaryLength = 0, maxContext, extraContext = "") {
    const output = document.getElementById('output');
    const outputElements = Array.from(output.children).filter(child => !['outputCheckConfirm', 'system-message', 'player-action'].includes(child.id)).map(child => child.innerText);
    let outputContent = '';
    let summary = '';
    let totalCharacters = 0;

    if (limit !== null) {
        const limitedElements = outputElements.slice(-limit); // Get the last 'limit' elements
        for (let i = limitedElements.length - 1; i >= 0; i--) {
            const element = limitedElements[i];
            if (totalCharacters + element.length > maxContext * 4) break;
            outputContent = element + ' ' + outputContent;
            totalCharacters += element.length;
        }

        if (summaryLength === -1) {
            for (let i = 0; i < outputElements.length - limitedElements.length; i++) {
                const element = outputElements[i];
                if (totalCharacters + element.length > maxContext * 4) break;
                summary += element + ' ';
                totalCharacters += element.length;
            }
        } else if (summaryLength > 0) {
            const summaryElements = outputElements.slice(-summaryLength - limitedElements.length, -limitedElements.length);
            for (let i = summaryElements.length - 1; i >= 0; i--) {
                const element = summaryElements[i];
                if (totalCharacters + element.length > maxContext * 4) break;
                summary = element + ' ' + summary;
                totalCharacters += element.length;
            }
        }
    } else {
        for (let i = outputElements.length - 1; i >= 0; i--) {
            const element = outputElements[i];
            if (totalCharacters + element.length > maxContext * 4) break;
            outputContent = element + ' ' + outputContent;
            totalCharacters += element.length;
        }
    }

    return settings.full_context
        .replace('$world', "World Description: " + settings.world_description + "\n")
        .replace('$player', "Player Name: " + settings.player_name + "\n")
        .replace('$player_desc', "Player Description: " + settings.player_description + "\n")
        .replace('$summary', summary ? "\nSummary of Previous Events: " + summary.trim() +"\n" : '')
        .replace('$locale', "\nCurrent Situation:\n" + areaContext(currentArea))
        .replace('$extra_context', extraContext + '\n' ? extraContext : '')
        .replace('$story', outputContent);
}

function minContext(limit = null, extraContext = "") {
    let outputContent = document.getElementById('output').innerText;
    if (limit !== null) {
        const output = document.getElementById('output');
        const children = Array.from(output.children);
        const limitedChildren = children.slice(-limit);
        outputContent = limitedChildren.map(child => child.outerText).join('');
    }
    return settings.full_context
        .replace('$world', "World Description: " + settings.world_description + "\n")
        .replace('$player', '')
        .replace('$player_desc', '')
        .replace('$summary', '')
        .replace('$locale', '')
        .replace('$extra_context', extraContext + '\n' ? extraContext : '')
        .replace('$story', outputContent);
}

function faeCharSheet(charsheet) {
    let charsheetString = "Stunts: ";
    for (const [key, value] of Object.entries(charsheet.stunts)) {
        charsheetString += key + ": " + value + ", ";
    }

    let aspects = Array.isArray(charsheet.aspects) 
        ? charsheet.aspects.join(',')
        : charsheet.aspects;

    charsheetString += "\n" +
        "Aspects: " + charsheet.high_concept + "," + aspects + "," + charsheet.trouble;
    
    if(charsheet.consequences) {
        if (charsheet.consequences.mild && charsheet.consequences.mild.length > 0) {
            charsheetString += "," + charsheet.consequences.mild.join(', ');
        }
        if (charsheet.consequences.moderate && charsheet.consequences.moderate.length > 0) {
            charsheetString += "," + charsheet.consequences.moderate.join(', ');
        }
        if (charsheet.consequences.severe && charsheet.consequences.severe.length > 0) {
            charsheetString += "," + charsheet.consequences.severe.join(', ');
        }
    }
    charsheetString += "\n";
    return charsheetString;
}

async function playerAction(action) {
    switch (settings.rule_set) {
        case 'Fate Accelerated':
            const response1 = await generateText(settings.question_param, fullContext(turnsAtCurrentArea > 2 ? 2 : turnsAtCurrentArea, 0, settings.question_param.max_context_length) + "\n" + settings.ruleprompt_fae_action1, '', {
                action: action,
                currentArea: currentArea
            }, settings.sampleFAEAction);
            const response2 = await generateText(settings.question_param, fullContext(turnsAtCurrentArea > 2 ? 2 : turnsAtCurrentArea, 0, settings.question_param.max_context_length) + "\n\n" + faeCharSheet(settings.charsheet_fae) + settings.ruleprompt_fae_action2, '', {
                action: action,
                currentArea: currentArea
            }, settings.sampleFAEAction);
            console.log("Player Action Response:\n", response1, '\n', response2);

            let disadvantage = 1;
            let advantage = 0;
/*      default case for now
            if (response1.toLowerCase().includes('intermediate')) {
                disadvantage += 1;
            } else*/ if (response1.toLowerCase().includes('expert')) {
                disadvantage += 2;
            } else if (response1.toLowerCase().includes('master') || response1.toLowerCase().includes('impossible')) {
                disadvantage += 4;
            } else if (response1.toLowerCase().includes('none') || response1.toLowerCase().includes('basic')) {
                return "[Continue the story for another $settings.output_length$ as player '" + action + "'. "+ settings.action_string +"]";
            }


            const lines = response2.toLowerCase().split('\n');

            for (const line of lines) {
                if (line.startsWith('1.') && !line.includes('n/a') && line.trim() !== '1.') {
                    // conditionals if line contains trivial, challeng, extreme, or impossible. simple is default case
                    if (line.includes('yes')) {
                        return "[Continue the story for another $settings.output_length$ as player considers why it's impossibile to '" + action + "'. "+ settings.action_string +"]";
                    }
                } else if (line.startsWith('2.') && !line.includes('n/a') && line.trim() !== '2.') {
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
                } else if (line.startsWith('3.') && !line.includes('n/a') && line.trim() !== '3.') {
                    // simply count the number of commas returned and add to the advantage
                    advantage += line.split(',').length;;
                } else if (line.startsWith('4.') && !line.includes('n/a') && line.trim() !== '4.') {
                    // simply count the number of commas returned and add to the disadvantage
                    disadvantage += line.split(',').length;;
                }
            }
            // roll 4d3-8+advantage-disadvantage
            let roll = randomInt(3) + randomInt(3) + randomInt(3) + randomInt(3) - 4;
            console.log('Roll 4d4-8('+ roll + ') +' + advantage + '-' + disadvantage + '=' + roll + advantage - disadvantage);
            roll += advantage - disadvantage;
            if(roll >= 3) {
                return "[The player's actions are extremely successful, so much so that they will create advantages in similar actions in the future. Continue the story for another $settings.output_length$ as player successfully '" + action + "'. "+ settings.action_string + "]";
            } else if (roll >= 1) {
                return "[Continue the story for another $settings.output_length$ as player successfully '" + action + "'. "+ settings.action_string +"]"
            } else if (roll === 0) {
                return "[Continue the story for another $settings.output_length$ as player attempts to '" + action + "'. "+ settings.action_string +"]"
            } else if (roll >= -2) {
                return "[Continue the story for another $settings.output_length$ as player fails to '" + action + "'. While a failure, it may still achieve the desired result at personal cost. " + settings.action_string +"]"
            } else {
                return "[Continue the story for another $settings.output_length$ as player fails to '" + action + "'. The failure is significant having negative consequences for the player. " + settings.action_string +"]";
            }
        case 'pathfinder2e':
            return pathfinder2eAction(action);
        default:
            return "[Continue the story as player '" + action + "'. "+ settings.action_string +"]"
    }
}

async function sendMessage(message = input.value, bypassCheck = false, extraContext = '') {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const inputElement = document.createElement('div');
    inputElement.id = 'player-action';
    input.value = '';
    let postPrompt = '';

    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    const systemElement = document.getElementById('system-message');
    if (systemElement) {
        systemElement.remove();
    }
    const priorMessageElement = output.querySelector('.new-message');
    if (priorMessageElement) {
        priorMessageElement.classList.remove('new-message');
        priorMessageElement.classList.add('text-1');
    }

    if (message.trim()) {
        if (message.startsWith('/') || message.startsWith('"')) {
            const parts = message.split(' ');
            const command = parts[0];
            const name = parts.slice(1).join(' ');
            if (command === '/char') {
                await addPerson(name);
            } else if (command === '/thing') {
                await addThing(name);
            } else if (command === '/creature') {
                await addCreature(name);
            } else if (command === '/move') {
                await moveToArea(name);
            } else if (command === '/rename') {
                // name command is passed as /rename 'old name' 'new name'
                const [oldName, newName] = name.split("' '").map(n => n.replace(/'/g, '').trim());
                renameEntity(newName, oldName);
            } else if (command === '/help') {
                const helpOutput = document.createElement('div');
                helpOutput.id = 'system-message';
                helpOutput.classList.add('new-message');
                helpOutput.innerHTML = '<br>You can use the following commands to add a new person, creature, or thing to the current area: <br> /char [name], /thing [name], /creature [name]. <br> <br> You can also use the following commands to move to a different area: <br> /move [area name]. <br> <br> To rename an existing person, creature, or thing: <br> /rename [old name] [new name]. <br><br> Prepending // will add the input as a direct input to the story. <br> <br> Prepending a " will at least attempt to have the player say your words, no skill check. If wanting a skill check, just try beginning with the action such as, \'Pursaude by saying "Words".\'';
                output.appendChild(helpOutput);
                output.scrollTop = output.scrollHeight;
            }
            if (message.startsWith('//')) {
                const directInput = document.createElement('div');
                directInput.innerHTML = message.replace('//', '');
                output.appendChild(directInput);
                output.scrollTop = output.scrollHeight;
                turnsAtCurrentArea++;
            } 
            if (message.startsWith('"')) {
                inputElement.innerHTML = '\n[Have the player say ' + message + ' Inlcude every letter and punctuation verbatim, and then continue the story for another $settings.output_length$.]';
            } else return;

        } else if (bypassCheck) {
            inputElement.innerHTML = '\n[Continue the story for another $settings.output_length$ as ' + message + ' ' + settings.action_string +']';
        } else {
            inputElement.innerHTML = message;
            inputElement.innerHTML = await playerAction(message);
        }
    } else {
        inputElement.innerHTML = '\n[Continue the story for another $settings.output_length$.]';
    }
    inputElement.innerHTML = replaceVariables(inputElement.innerHTML);

    output.appendChild(inputElement);
    output.scrollTop = output.scrollHeight;

    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext(turnsAtCurrentArea > settings.max_passage_entries ? settings.max_passage_entries : turnsAtCurrentArea, settings.max_summary_entries, settings.story_param.max_context_length, extraContext) + inputElement.innerHTML, postPrompt, {
        message: message,
        currentArea: currentArea,
        playerName: settings.player_name
    }));

    turnsAtCurrentArea++;
    inputElement.remove();
    const messageElement = document.createElement('div');
    messageElement.classList.add('new-message');
    messageElement.innerHTML = "<br>" + text.replace(/\n/g, '<br>');
    output.appendChild(messageElement);
    

    output.scrollTop = output.lastChild.offsetTop;

    await outputCheck(text, '');
    await outputAutoCheck(text, '');
    await saveGame();
    processRecursiveSummary();
}

function undoLastAction() {
    const output = document.getElementById('output');
    const confirmElement = document.getElementById('outputCheckConfirm');
    if (confirmElement) {
        confirmElement.remove();
    }
    const systemElement = document.getElementById('system-message');
    if (systemElement) {
        systemElement.remove();
    }
    if (output.lastChild) {
        output.removeChild(output.lastChild);
    }
    if (turnsAtCurrentArea > 0) {
        turnsAtCurrentArea--;
    }
}

function updateCharacterInfo() {
    if (settings.player_name) {
        document.getElementById('playerName').textContent = settings.player_name;
    }
    if (settings.charsheet_fae) {
        // Display High Concept
        if (settings.charsheet_fae.high_concept) {
            document.getElementById('highConcept').textContent = settings.charsheet_fae.high_concept;
        }

        // Display remaining aspects
        const aspectsDiv = document.getElementById('aspects');
        aspectsDiv.innerHTML = ''; // Clear existing aspects
        
        if (settings.charsheet_fae.aspects) {
            let aspectsList = Array.isArray(settings.charsheet_fae.aspects) 
                ? settings.charsheet_fae.aspects 
                : settings.charsheet_fae.aspects.split(',');
            
            aspectsDiv.innerHTML = aspectsList.map(aspect => 
                `<div class="aspect">${aspect.trim()}</div>`
            ).join('');
        }
        
        // Display trouble
        if (settings.charsheet_fae.trouble) {
            const troubleDiv = document.createElement('div');
            troubleDiv.className = 'aspect trouble';
            troubleDiv.textContent = settings.charsheet_fae.trouble;
            aspectsDiv.appendChild(troubleDiv);
        }
    }
}

async function setupStart() {
    document.getElementById('sceneart').src = 'placeholder.png';
    updateApproachDisplay();
    updateCharacterInfo();
    updateConsequences();
    updateFollowerArt();
    updateAreaDisplay(settings.starting_area);

    await generateArea(settings.starting_area, settings.starting_area_description, 3500, 3500);
    document.getElementById('sceneart').alt = areas[settings.starting_area].description;
    centerMapOnLocation(settings.starting_area);
    const responseElement = document.createElement('div');
    responseElement.classList.add('new-message');
    
    const text = trimIncompleteSentences(await generateText(settings.story_param, fullContext(0,0,settings.story_param.max_context_length, '') + "\n" + "[Generate the beginning of the story. Response should be less than 300 words.]", '', {
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
    updateSublocationRow(settings.starting_area);

    document.getElementById('playerart').src = 'placeholder.png';
    generateArt(settings.player_visual, "", settings.player_seed).then(blob => {
        if (blob instanceof Blob)
            document.getElementById('playerart').src = URL.createObjectURL(blob);
    });
}
function restartGame() {
    
    const sceneArt = document.getElementById('sceneart');
    if (sceneArt.src.startsWith('blob:')) {
        URL.revokeObjectURL(sceneArt.src);
    }
    
    areas = {};
    followers = [];
    document.querySelectorAll('.location').forEach(location => {
        location.remove();
    });
    currentArea = settings.starting_area;
    turnsAtCurrentArea = 1;
    document.getElementById('output').innerHTML = '';
    document.getElementById('image-grid').innerHTML = '';
    setupStart();
}

function updateApproachDisplay() {
    if (settings.charsheet_fae && settings.charsheet_fae.approaches) {
        document.getElementById('careful').textContent = settings.charsheet_fae.approaches.careful || '0';
        document.getElementById('clever').textContent = settings.charsheet_fae.approaches.clever || '0';
        document.getElementById('flashy').textContent = settings.charsheet_fae.approaches.flashy || '0';
        document.getElementById('forceful').textContent = settings.charsheet_fae.approaches.forceful || '0';
        document.getElementById('quick').textContent = settings.charsheet_fae.approaches.quick || '0';
        document.getElementById('sneaky').textContent = settings.charsheet_fae.approaches.sneaky || '0';
    }
}

function updateAreaDisplay(areaName) {
    const areaNameOverlay = document.getElementById('areaNameOverlay');
    areaNameOverlay.textContent = areaName.split('/').pop();
}

async function moveToArea(area, describe=0, text="") {
    if (area === currentArea || area === currentArea.split('/').pop()) {
        return;
    }
    let targetArea = null;
    if(areas[area]) {
        targetArea = area;
    } else if (areas[currentArea].sublocations[area]) {
        targetArea = areas[currentArea].sublocations[area].path;
        if(!areas[targetArea]) {
            if(text === "")
                await generateArea(targetArea, areas[currentArea].sublocations[area].description);
            else await generateArea(targetArea, areas[currentArea].sublocations[area].description, contextDepth=3);
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
            await generateArea(currentPath);
            if (!areas[parentPath].sublocations[subPath]) {
                areas[parentPath].sublocations[subPath] = { path: currentPath, name: subPath, description: areas[currentPath].description };
            }
        }
        targetArea = currentPath;
    } else if (!areas[area]) {
        const areaList = Object.keys(areas).join(', ') + ', ' + Object.keys(areas[currentArea].sublocations).join(', ');
        const proximityPrompt = replaceVariables(settings.moveToAreaProximityPrompt, {
            newArea: area
        });
        
        const response = await generateText(settings.question_param, settings.world_description + "\n\n\nPassage:\n" + text + "\nLocations: "+ areaList + "\n\n" + proximityPrompt, '', {
            areaList: areaList,
            currentArea: currentArea,
            newArea: area,
            text: text
        }, settings.sampleQuestions);
        
        if (response !== 'n/a') {
            const responseCleaned = response.stripNonAlpha();
            const parentArea = Object.keys(areas).find(a => {
                const isMatch = a === responseCleaned || Object.keys(areas[a].sublocations).includes(responseCleaned);
                return isMatch;
            });
            if(text === "")
                await generateArea(parentArea + "/" + area);
            else await generateArea(parentArea + "/" + area, contextDepth=3);

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
        const distance = 5;

        do {
            newX = areas[currentArea.split('/')[0]].x + 200*(Math.floor(Math.random() * distance * 2) - distance);
            newY = areas[currentArea.split('/')[0]].y + 200*(Math.floor(Math.random() * distance * 2) - distance);
            attempts++;
        } while (attempts < maxAttempts && Object.values(areas).some(a => a.x === newX && a.y === newY));

        if (attempts >= maxAttempts) {
            throw new Error("Unable to find a suitable location for the new area.");
        }

        await generateArea(area, '', newX, newY, 3);
        targetArea = area;
    }

    if(text != "" && areas[currentArea].people.length > 0) {
        const peopleNames = areas[currentArea].people.map(person => person.name).join(', ');
        const peoplePrompt = replaceVariables(settings.moveToAreaPeoplePrompt, {
            peopleNames: peopleNames
        });
        
        const movingPeople = await generateText(settings.question_param, settings.world_description + "\n" + areaContext(currentArea) + "\n\nPassage:\n" + text + "\n\n" + peoplePrompt, '', {
            currentArea: currentArea,
            newArea: area,
            text: text,
            peopleNames: peopleNames
        }, settings.sampleQuestions);
        
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
    let prompt;
    let leftbehind;
    if(describe) {
        leftbehind = "Left behind " + areas[currentArea].name + ".\n";
        if (areas[currentArea].people.length > 0) {
            const peopleNames = areas[currentArea].people.map(person => person.name).join(', ');
            leftbehind +=  peopleNames + " were left behind in " + areas[currentArea].name + ".";
        } 
        if (areas[currentArea].creatures.length > 0) {
            const creatureNames = areas[currentArea].creatures.map(creature => creature.name).join(', ');
            leftbehind += creatureNames + " were left behind in " + areas[currentArea].name + ".";
        } 
        if (areas[currentArea].things.length > 0) {
            const thingNames = areas[currentArea].things.map(thing => thing.name).join(', ');
            leftbehind += thingNames + " were left behind in " + areas[currentArea].name + ".\n";
        }

        if (areas[targetArea].lastVisted === '') {
            leftbehind += " This is the first time " + settings.player_name + " has visited " + areas[targetArea].name + ".";
        } else {
            const timeSinceLastVisit = timeDiff(areas[targetArea].lastVisted, settings.current_time);
            if (timeSinceLastVisit < 60) {
                leftbehind += " It has been less than a minute since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else if (timeSinceLastVisit < 3600) {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 60) + " minutes since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else if (timeSinceLastVisit < 86400) {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 3600) + " hours since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else if (timeSinceLastVisit < 604800) {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 86400) + " days since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else if (timeSinceLastVisit < 2592000) {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 604800) + " weeks since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else if (timeSinceLastVisit < 31536000) {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 2592000) + " months since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            } else {
                leftbehind += " It has been " + Math.floor(timeSinceLastVisit / 31536000) + " years since " + settings.player_name + " has visited " + areas[targetArea].name + ".";
            }
        }

        // check if current area is the parent of targetarea, if so, add a message to the prompt that the player is moving to a sublocation of the current area
        if (targetArea.split('/').slice(0, -1).join('/') === currentArea) {
            prompt = settings.player_name + " " + (describe>1 ? settings.player_distant_movement : settings.player_local_movement) + " further through " + areas[currentArea].name;
        } else {
            prompt = settings.player_name + " leaves " + areas[currentArea].name + " and " + (describe>1 ? settings.player_distant_movement : settings.player_local_movement);
        }
        if (describe > 1) // 1 is local movement, otherwise it's the distance between map locations, should handle better
            prompt += " many miles";

        if(followers.length > 0) {
            const followerNames = followers.map(follower => follower.name).join(', ');
            prompt += " along with " + followerNames;
        }
        prompt += " and arrives at " + areas[targetArea].name + '.';
    }
    
    currentArea.lastVisted = settings.current_time;
    currentArea = targetArea;
    if (describe)
        turnsAtCurrentArea = 0;
    else turnsAtCurrentArea = 1; // presume the entrance as part of the room description when moved through confirmation
    updateAreaDisplay(currentArea);
    
    const sceneArt = document.getElementById('sceneart');
    if (sceneArt.src.startsWith('blob:')) {
        URL.revokeObjectURL(sceneArt.src);
    }
    
    if (areas[currentArea].image instanceof Blob) {
        const objectUrl = URL.createObjectURL(areas[currentArea].image);
        sceneArt.src = objectUrl;
    } else {
        sceneArt.src = 'placeholder.png';
    }
    
    // Make sure the image grid and sublocation row are updated after area change
    updateImageGrid(currentArea);
    updateSublocationRow(currentArea);
    if(describe) {
        sendMessage(prompt, true, leftbehind);
    }
}

// At the end of the file, where the initial game setup is done
let areas = {};
let followers = [];
let currentArea;
let turnsAtCurrentArea = 1;

// get half width and height of map to get center
const mapWidth = map.offsetWidth;
const mapHeight = map.offsetHeight;
const centerX = (mapContainer.clientWidth - mapWidth) / 2;
const centerY = (mapContainer.clientHeight - mapHeight) / 2;
map.style.left = `${centerX}px`;
map.style.top = `${centerY}px`;
loadDefaultSettings();
overrideSettings();
areas[settings.starting_area] = {};
currentArea = settings.starting_area;
updateTime();
updateApproachDisplay();
updateCharacterInfo();
updateConsequences();
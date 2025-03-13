function replaceVariables(text, variables) {
    if (!text || typeof text !== 'string') return text;
    
    let result = text;
    
    // First, handle specific variables with $ prefix
    if (variables) {
        for (const [key, value] of Object.entries(variables)) {
            const variablePattern = new RegExp('\\$' + key, 'g');
            result = result.replace(variablePattern, value);
        }
    }
    
    // Then handle any settings variables that might be referenced
    const settingsVarPattern = /\$settings\.([^\$]+)\$/g;
    result = result.replace(settingsVarPattern, (match, settingPath) => {
        const paths = settingPath.split('.');
        let value = settings;
        
        for (const path of paths) {
            if (value && value[path] !== undefined) {
                value = value[path];
            } else {
                return match; // Keep original if path doesn't exist
            }
        }
        
        return value !== undefined ? value : match;
    });
    
    return result;
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function getTimeofDay() {
    const hours = parseInt(settings.current_time.match(/(\d+):/)[1], 10);
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
function timeDiff(startTime, endTime) {
    const startParts = startTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/).slice(1).map(Number);
    const endParts = endTime.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/).slice(1).map(Number);

    const [startYear, startMonth, startDay, startHours, startMinutes, startSeconds] = startParts;
    const [endYear, endMonth, endDay, endHours, endMinutes, endSeconds] = endParts;

    const startTotalSeconds = startYear * 365 * 24 * 3600 + startMonth * 30 * 24 * 3600 + startDay * 24 * 3600 + startHours * 3600 + startMinutes * 60 + startSeconds;
    const endTotalSeconds = endYear * 365 * 24 * 3600 + endMonth * 30 * 24 * 3600 + endDay * 24 * 3600 + endHours * 3600 + endMinutes * 60 + endSeconds;

    const timeDifferenceInSeconds = endTotalSeconds - startTotalSeconds;
    return timeDifferenceInSeconds / (24 * 3600); // Convert seconds to days
}

function getSeason() {
    const seasons = ["Winter", "Spring", "Summer", "Fall"];
    const month = parseInt(settings.current_time.match(/-(\d+)-/)[1], 10) - 1;
    return seasons[Math.floor((month % 12) / 3)];
}

function getDayOfWeek() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dateParts = settings.current_time.match(/(\d+)-(\d+)-(\d+)/).slice(1).map(Number);
    const [year, month, day] = dateParts;
    const date = new Date(year, month - 1, day); 
    return days[date.getDay()];
}

function getPreciseTime() {
    return settings.current_time.match(/\d+:\d+:\d+/);
}

function trimIncompleteSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+["']?/g);
    if (sentences && sentences.length > 1) {
        const lastSentence = sentences[sentences.length - 1];
        if (!/[.!"]$/.test(lastSentence.trim())) {
            sentences.pop();
        }
        const lastFourSentences = sentences.slice(-4);
        for (let i = lastFourSentences.length - 1; i >= 0; i--) {
            if (lastFourSentences[i].trim().endsWith('?')) {
            sentences.splice(-4 + i);
            break;
            }
        }
        let result = sentences.join(' ');
        const quoteCount = (result.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            if (!result.endsWith('"')) {
                result += '"';
            } else {
                result = result.slice(0, -1);
            }
        }
        return result;
    }
    return text;
}

function advanceTime(timePassed) {
    const dateParts = settings.current_time.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
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
    const fourDigitYear = year.toString().padStart(4, '0').slice(-4);
    const daysInMonth = new Date(fourDigitYear, month, 0).getDate();
    while (day > daysInMonth) {
        day -= daysInMonth;
        month += 1;
    }
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    settings.current_time = `${year.toString()}-${month.toString()}-${day.toString()} ${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

String.prototype.stripNonAlpha = function(excludedChars='') {
    const regex = new RegExp(`[^\\p{L}\\s${excludedChars}]`, 'gu');
    return this.replace(regex, '');
};

function openOutputEditor() {
    const overlay = document.createElement('div');
    overlay.className = 'output-editor-overlay';
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.className = 'output-editor-container';

    const header = document.createElement('div');
    header.className = 'output-editor-header';
    header.innerHTML = '<h2>Edit Output</h2>';

    const content = document.createElement('div');
    content.className = 'output-editor-content';

    // Get output content and create editor entries
    const output = document.getElementById('output');
    const entries = Array.from(output.children);
    let lastEntryDiv;
    
    entries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'output-entry';
        
        const textarea = document.createElement('textarea');
        const textContent = entry.innerHTML.replace(/<br\s*\/?>/gi, '\n');
        textarea.value = textContent;
        textarea.dataset.originalHtml = entry.outerHTML;
        
        // Auto-adjust height on input
        const adjustHeight = (el) => {
            el.style.height = 'auto';
            el.style.height = (el.scrollHeight) + 'px';
        };
        
        textarea.addEventListener('input', (e) => adjustHeight(e.target));
        textarea.addEventListener('focus', (e) => adjustHeight(e.target));

        // Entry controls
        const controls = document.createElement('div');
        controls.className = 'entry-controls';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'entry-control-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete Entry';
        deleteBtn.onclick = () => {
            if (confirm('Are you sure you want to delete this entry?')) {
                entryDiv.remove();
            }
        };

        controls.appendChild(deleteBtn);
        entryDiv.appendChild(controls);
        entryDiv.appendChild(textarea);
        content.appendChild(entryDiv);
        lastEntryDiv = entryDiv;
        
        // Initial height adjustment
        requestAnimationFrame(() => adjustHeight(textarea));
    });

    const actions = document.createElement('div');
    actions.className = 'output-editor-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-changes-btn btn-primary';
    saveBtn.textContent = 'Save Changes';
    saveBtn.onclick = () => {
        const entries = Array.from(content.querySelectorAll('.output-entry textarea'));
        output.innerHTML = '';
        entries.forEach(textarea => {
            const originalElement = document.createElement('div');
            originalElement.innerHTML = textarea.dataset.originalHtml;
            const newElement = originalElement.firstChild;
            newElement.innerHTML = textarea.value.replace(/\n/g, '<br>');
            output.appendChild(newElement);
        });
        overlay.remove();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-edit-btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => overlay.remove();

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(actions);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Scroll to the latest entry with a slight delay to ensure everything is rendered
    setTimeout(() => {
        if (lastEntryDiv) {
            lastEntryDiv.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
    }, 50);
}

// Add event listener to edit button
document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editOutputBtn');
    if (editBtn) {
        editBtn.addEventListener('click', openOutputEditor);
    }
});

async function generateSummary(text) {
    return await generateText(settings.summary_param, "Text: " + text + "/n/n" + settings.summary_prompt);
}

async function processRecursiveSummary(config = {
    thresholds: [
        { minElements: settings.summary_first_layer_max, elementsToSummarize: settings.summary_first_layer_chunk }, // text-1 -> text-2
        { minElements: settings.summary_second_layer_max, elementsToSummarize: settings.summary_second_layer_chunk }, // text-2 -> text-3
        { minElements: settings.summary_bonus_layer_max, elementsToSummarize: settings.summary_bonus_layer_chunk }, // text-3 -> text-4
    ],
    maxLevels: settings.summary_max_layers,
    colors: [
        '#FFFFFF', // text-1 black, unused
        '#0000FF', // text-4 blue
        '#00FFFF',  // text-2 cyan
        '#00FF00', // text-3 green
        '#FFFF00', // text-5 yellow
        '#FF0000', // text-6 red
        '#FF00FF', // text-7 purple
        '#FFA500', // text-8 orange
        '#808080', // text-9 grey
        '#800080' // text-10 purple
    ]
}) {
    const output = document.getElementById('output');
    if (!output) return;

    for (let level = 1; level <= config.maxLevels; level++) {
        const currentClass = `text-${level}`;
        const elements = output.getElementsByClassName(currentClass);

        const threshold = config.thresholds[level > 2 ? 2 : level - 1];

        if (elements.length < threshold.minElements) break;

        const elementsToSummarize = Array.from(elements)
            .slice(0, threshold.elementsToSummarize);

        const textToSummarize = elementsToSummarize
            .map(el => el.innerHTML.replace(/<br\s*\/?>/g, '\n').trim())
            .join('\n\n');

        try {
            const summary = await generateSummary(textToSummarize);

            const summaryElement = document.createElement('div');
            summaryElement.className = `text-${level + 1}`;
            summaryElement.innerHTML = summary.replace(/\n/g, '<br>');
            summaryElement.style.borderLeft = `5px solid ${config.colors[level] || '#999999'}`;
            summaryElement.style.paddingLeft = '10px';
            summaryElement.style.margin = '10px 0';

            output.insertBefore(summaryElement, elementsToSummarize[0]);
            elementsToSummarize.forEach(el => el.remove());

            if (level === config.maxLevels) {
                const highestLevelElements = output.getElementsByClassName(`text-${config.maxLevels}`);
                while (highestLevelElements.length > threshold.minElements) {
                    highestLevelElements[0].remove();
                }
            }
        } catch (error) {
            break;
        }
    }
}

function getSummary(skip = 0, limit = 0) {
    const output = document.getElementById('output');
    if (!output) return;

    const elements = Array.from(output.children);
    let summary = '';
    let count = 0;
    for(let level = 1; level <= settings.summary_max_layers; level++) {
        const currentClass = `text-${level}`;
        const elements = output.getElementsByClassName(currentClass);
        for (let i = 0; i < elements.length; i++) {
            if (count >= skip && (limit === 0 || count < skip + limit)) {
                summary += elements[i].innerHTML.replace(/<br\s*\/?>/g, ' ').trim();
            }
            count++;
        }
    }
}

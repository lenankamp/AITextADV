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

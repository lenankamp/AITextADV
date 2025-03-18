let currentSpeaker = null;

function getGenderFromText(text) {
    const feminine = (text.match(/\b(she|her|herself|hers)\b/gi) || []).length;
    const masculine = (text.match(/\b(he|him|himself|his)\b/gi) || []).length;
    if (feminine > masculine) return 'female';
    if (masculine > feminine) return 'male';
    return null;
}

function findLikelyCharacter(gender, peopleInArea) {
    for (const [_, person] of peopleInArea) {
        const descGender = getGenderFromText(person.description);
        if (descGender === gender) {
            return person;
        }
    }
    return null;
}

function getVoiceForSpeaker(speaker) {
    if (!speaker) return 'en_uk_003';
    const desc = speaker.description ? speaker.description.toLowerCase() : '';
    const gender = getGenderFromText(desc);
    return gender === 'female' ? 'en_female_emotional' : 'en_uk_003';
}

async function readTextAloud(text, area) {
    const narratorVoice = "en_male_ghosthost";
    const playerVoice = "en_uk_003";

    // Create a map of people in the area
    const peopleInArea = new Map();
    const allPeople = [...(area.people || []), ...(followers || [])];
    
    for (const person of allPeople) {
        peopleInArea.set(person.name.toLowerCase(), person);
    }

    // First split text into segments by quotes, handling case where text starts with quote
    const segments = [];
    // Clean up the text first - normalize quotes and remove extra spaces around them and punctuation
    const cleanedText = text
        .replace(/"\s+/g, '"')          // Remove spaces after opening quotes
        .replace(/\s+"/g, '"')          // Remove spaces before closing quotes
        .replace(/([.!?])\s+"/g, '$1"') // Remove spaces between punctuation and closing quotes
        .replace(/"\s+([.!?])/g, '"$1'); // Remove spaces between opening quotes and punctuation
    const startsWithQuote = cleanedText.trimStart().charAt(0) === '"';
    const textParts = cleanedText.split('"');
    let lastSpeaker = currentSpeaker;
    let lastGender = area.people[currentSpeaker] ? getGenderFromText(area.people[currentSpeaker].description) : followers[currentSpeaker] ? getGenderFromText(followers[currentSpeaker].description) : null;

    // Process each part, accounting for whether text started with quote
    for (let i = 0; i < textParts.length; i++) {
        const part = textParts[i];
        const isQuotePart = startsWithQuote ? (i % 2 === 0) : (i % 2 === 1);
        
        if (!isQuotePart) {
            // Non-quoted text (narrative)
            if (part.trim()) {
                segments.push({
                    text: part.trim(),
                    type: 'narration',
                    voice: narratorVoice
                });
            }
        } else {
            // Quoted text (dialogue)
            const beforeText = textParts[i-1] || '';
            const afterText = textParts[i+1] || '';
            // Don't add extra quotes if the part is empty
            const quoteText = part.trim() ? `"${part}"` : '';
            
            if (quoteText) {
                // Find speaker using surrounding context
                const speakerInfo = findSpeaker(beforeText, afterText, quoteText);
                
                // Update tracking if not player
                if (speakerInfo.speaker !== 'player') {
                    lastSpeaker = speakerInfo.speaker;
                }
                
                segments.push({
                    text: quoteText,
                    type: 'quote',
                    speaker: speakerInfo.speaker,
                    voice: speakerInfo.voice
                });
            }
        }
    }

    // Helper function to find speaker with gender awareness
    function findSpeaker(beforeText, afterText, quoteText) {
        // First check for player patterns - now handles multiple actions
        const isPlayerBefore = beforeText.match(/\b(you)(?:(?:\s+\w+)*?\s+(?:and|then|while|before)\s+)?(say|reply|ask|shout|whisper|speak|mutter|call|murmur)(?:\s|,|\.|$)/i);
        const isPlayerAfter = afterText.match(/^\s*,?\s*(you)\s+(say|reply|ask|shout|whisper|speak|mutter|call|murmur)(?:\s|,|\.|$)/i);
        
        if (isPlayerBefore || isPlayerAfter) {
            return { speaker: 'player', voice: playerVoice };
        }

        // Extract the immediate context around the quote (looking for speaker attribution)
        const immediateBeforeContext = beforeText.split(/[.!?]\s*/).pop() || '';
        const immediateAfterContext = (afterText.split(/[.!?]\s*/)[0] || '').trim();

        // Enhanced speaker detection pattern to include descriptive titles
        const beforeMatch = immediateBeforeContext.match(/\b(\w+(?:\s+(?:and|the|his|her|their|\w+er|\w+or)\s+\w+)*)\s+(?:says?|replies?|asks?|shouts?|whispers?|speaks?|mutters?|calls?|murmurs?)(?:\s+(?:to|at|into|through|across|softly|quietly|loudly|angrily|calmly))?\s*[,:]?\s*$/i);
        const afterMatch = immediateAfterContext.match(/^\s*(?:says?|replies?|asks?|shouts?|whispers?|speaks?|mutters?|calls?|announces?|murmurs?)\s+(?:(?:the|his|her|their)\s+)?([^,.!?]+)/i);

        // Function to check if a name refers to the subject rather than the speaker
        const isNameSubjectOfQuote = (name) => {
            const lowerQuote = quoteText.toLowerCase();
            const lowerName = name.toLowerCase();
            return lowerQuote.includes(`${lowerName}`) &&
                   !lowerQuote.includes(`is ${lowerName}`) &&
                   !lowerQuote.includes(`'s ${lowerName}'s`);
        };

        // Check for descriptive titles in context
        const findDescriptiveSpeaker = (text) => {
            const descriptiveMatch = text.match(/\b(the\s+\w+(?:\s+(?:and|the|his|her|their|\w+er|\w+or)\s+\w+)*)\b/i);
            if (descriptiveMatch) {
                const description = descriptiveMatch[1].toLowerCase();
                // Look for matching person in area by their description
                for (const [name, person] of peopleInArea) {
                    if (person.description.toLowerCase().includes(description)) {
                        return person;
                    }
                }
            }
            return null;
        };
        
        // Handle explicit speaker attribution
        if (beforeMatch) {
            const speakerName = beforeMatch[1].toLowerCase();
            const person = peopleInArea.get(speakerName) || findDescriptiveSpeaker(beforeMatch[1]);
            if (person && !isNameSubjectOfQuote(speakerName)) {
                lastGender = getGenderFromText(person.description);
                return {
                    speaker: person.name,
                    voice: getVoiceForSpeaker(person)
                };
            }
        }
        
        if (afterMatch) {
            const speakerName = afterMatch[1].trim().toLowerCase();
            const person = peopleInArea.get(speakerName) || findDescriptiveSpeaker(afterMatch[1]);
            if (person && !isNameSubjectOfQuote(speakerName)) {
                lastGender = getGenderFromText(person.description);
                return {
                    speaker: person.name,
                    voice: getVoiceForSpeaker(person)
                };
            }
        }

        // Check for continuation of dialogue using narrative cues
        const isContinuation = immediateBeforeContext.match(/\b(continues?|adds?|resumes?|goes\s+on)\b/i) ||
                              immediateAfterContext.match(/^\s*(continuing|adding|resuming|going\s+on)\b/i);

        if (isContinuation && lastSpeaker) {
            const person = peopleInArea.get(lastSpeaker.toLowerCase());
            if (person) {
                return {
                    speaker: lastSpeaker,
                    voice: getVoiceForSpeaker(person)
                };
            }
        }

        // Check for descriptive references in immediate context
        const descriptiveSpeaker = findDescriptiveSpeaker(immediateBeforeContext) || findDescriptiveSpeaker(immediateAfterContext);
        if (descriptiveSpeaker) {
            return {
                speaker: descriptiveSpeaker.name,
                voice: getVoiceForSpeaker(descriptiveSpeaker)
            };
        }

        // Check for gender switches only in the immediate context
        const beforeGender = getGenderFromText(immediateBeforeContext);
        const afterGender = getGenderFromText(immediateAfterContext);
        const effectiveGender = beforeGender || afterGender;

        // Strong preference for maintaining the current speaker unless we have clear evidence of a switch
        if (lastSpeaker) {
            const person = peopleInArea.get(lastSpeaker.toLowerCase());
            if (person) {
                const speakerGender = getGenderFromText(person.description);
                if (!effectiveGender || speakerGender === effectiveGender) {
                    return {
                        speaker: lastSpeaker,
                        voice: getVoiceForSpeaker(person)
                    };
                }
            }
        }

        // If we get here, we either have no last speaker or detected a clear speaker switch
        if (effectiveGender) {
            const likelyPerson = findLikelyCharacter(effectiveGender, peopleInArea);
            if (likelyPerson) {
                lastGender = effectiveGender;
                return {
                    speaker: likelyPerson.name,
                    voice: getVoiceForSpeaker(likelyPerson)
                };
            }
            return {
                speaker: 'unknown_' + effectiveGender,
                voice: effectiveGender === 'female' ? 'en_female_emotional' : 'en_uk_003'
            };
        }
        
        return { speaker: 'unknown', voice: 'en_uk_003' };
    }

    // Combine sequential segments from the same speaker
    const combinedSegments = [];
    let currentSegment = null;

    for (const segment of segments) {
        if (!currentSegment) {
            currentSegment = { ...segment };
        } else if (
            segment.type === currentSegment.type && 
            segment.speaker === currentSegment.speaker
        ) {
            const lastChar = currentSegment.text.trim().slice(-1);
            const separator = (segment.type === 'quote' && lastChar === '\n') ? '' : ' ';
            currentSegment.text = currentSegment.text.trim() + separator + segment.text.trim();
        } else {
            combinedSegments.push(currentSegment);
            currentSegment = { ...segment };
        }
    }
    if (currentSegment) {
        combinedSegments.push(currentSegment);
    }

    // Update currentSpeaker with the last speaking character
    const lastSegment = combinedSegments[combinedSegments.length - 1];
    if (lastSegment && lastSegment.type === 'quote' && lastSegment.speaker !== 'player') {
        currentSpeaker = lastSegment.speaker;
    }

    // Narrate each combined segment
    for (const segment of combinedSegments) {
        try {
//            console.log((segment.type == 'narration' ? 'narrator' : segment.speaker) + ':', segment.text);
            const audio = await generateTikTokTTS(segment.text, segment.voice);
            await new Promise((resolve) => {
                audio.onended = resolve;
                audio.play();
            });
        } catch (error) {
            console.error('Error playing TTS:', error);
        }
    }
}

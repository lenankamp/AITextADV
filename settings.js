let settings;

function loadSettings() {
    const defaultSettings = {
        world_description: "A vast and mysterious world filled with magic and wonder.",
        player_name: "Adventurer",
        player_description: "A brave and adventurous soul, ready to explore the unknown.",
        player_visual: "A young adult with a determined expression, wearing a simple tunic and trousers.",
        player_seed: 1,
        starting_area: "Home",
        starting_area_description: "A cozy and warm room within a wooden cabin, your bed sits in the corner. A fire crackles in the fireplace, casting flickering shadows on the walls. The smell of pine and woodsmoke fills the air.",
        starting_date: "800-01-12 08:00:00",
        q1_height: "600px",
        q2_height: "640px",
        column_width: "640px",
        sdAPI: "http://localhost:7860/sdapi/v1/txt2img",
        sd_width: 768,
        sd_height: 1024,
        steps: 15,
        cfg_scale: 7,
        save_images: false,
        sampler_name: "Euler_a",
        seed_variation: 3,
        default_prompt: "__default__,",
        default_negative_prompt: "__defaultneg__,",
        person_prompt: "",
        person_negprompt: "",
        hostile_prompt: "",
        hostile_negprompt: "friendly,",
        thing_prompt: "(nopeople),",
        thing_negprompt: "((people, human, person)),",
        full_context: "$world $player $locale $fullstory",
        story_param: {
            textAPI: "http://localhost:5001/v1/",
            textAPItype: "openai",
            model: "mistral-small-24b-instruct-2501-abliterated-i1",
            max_context_length: 4096,
            max_length: 400,
            text_prompt: " <s> [INST] $system_prompt\n\n### INPUT\n$input_string [/INST]\n$response_string",
            stop_sequence: ["###", "<s>", " <s>", " <s> ", "### INPUT"],
            system_prompt: "Continue the story according to the bracketed instructions. Create a lifelike atmosphere with vivid, immersive details that draw the reader into the story. Use 2nd-person perspective, present tense, referring to the player as \"you\". Avoid vague statements, flowery metaphors, summaries, or send-off messages (do not end the scene). Focus on the moment, including visual and sensory detail, with quoted dialogue if appropriate. Be creative and don't always make events predictable. Characters should behave realistically and not always pander to the player. Write in the style of: Terry Pratchett.",
            quiet: false,
            rep_pen: 1.1,
            rep_pen_range: 256,
            rep_pen_slope: 1,
            temperature: 0.9,
            tfs: 1,
            top_a: 0,
            top_k: 100,
            top_p: 0.9,
            typical: 1
        },
        question_param: {
            textAPI: "http://localhost:5001/v1/",
            textAPItype: "openai",
            model: "mistral-small-24b-instruct-2501-abliterated-i1",
            max_context_length: 4096,
            max_length: 400,
            text_prompt: " <s> [INST] $system_prompt\n\n### INPUT\n$input_string [/INST]\n$response_string",
            stop_sequence: ["###", "<s>", " <s>", " <s> ", "### INPUT"],
            system_prompt: "Simply and clearly answer the question. Be as concise as possible.",
            quiet: false,
            rep_pen: 1.0,
            rep_pen_range: 0,
            rep_pen_slope: 1,
            temperature: 0.01,
            tfs: 1,
            top_a: 0,
            top_k: 100,
            top_p: 0.9,
            typical: 1
        },
        generateAreaDescriptionPrompt: "[Generate a description of the area named {areaName}.]",
        generateSublocationsPrompt: "[Generate a list of potential sublocation areas within {areaName} described as '{description}'. Each sublocation should have a name and a short description of what can be found there. If no sublocations would make sense, respond with 'None'. Format each sublocation as 'Name: Description' with one per line.]",
        generateEntitiesPrompt: "[Be creative and generate a list of people and interesting things that could reasonably be found in the area named {areaName} with the following details: {description} \nIf no people or hostiles might be reasonably found in the area, reply with None. Do not generate more than 4 in one category. Things must be non-living solid physical interactable pieces of interest within the area. Descriptions should be 1-2 sentences. Answer in a formatted list as such: \nPeople\n- Name: Description\n...\nThings\n- Name: Description\n...\nHostiles\n- Name: Description\n...\n]",
        generateVisualPrompt: "[How would you describe '{name}' described as '{description}' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]",
        addPersonDescriptionPrompt: "[Write a description of '{name}'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]",
        addThingDescriptionPrompt: "[Write a description of '{name}'. Write a 1-2 sentence physical description. If there is not enough information in the context, be creative.]",
        addHostileDescriptionPrompt: "[Write a description of '{name}'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description with consideration for why they might be hostile to the player. If there is not enough information in the context, be creative.]",
        outputCheckPrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. If a new person is in the scene, what is their name, or a simple two word description if name is not revealed? 2. If a new hostile is in the scene, what is their name, or a simple two word description if name is not revealed? 3. If the scene changed location, where is the scene now? 4. If an unknown person's name is revealed, what is their name? 5. If a person has left the scene, what is their name? 6. If hostile has become an ally, what is their name? 7. If someone not hostile has become hostile, what is their name? 8. If a new thing is in the scene, what is its name? 9. If a new location nearby has been revealed, what is its name? 10. Within the passage, approximate the time passed responding with one of the following: none, moments, minutes, hours, or full rest.]"
    };

    settings = defaultSettings;

    // Apply settings to elements
    document.getElementById('q3').style.height = `calc(100vh - ${settings.q1_height} - 5px)`;
    document.getElementById('q4').style.height = `calc(100vh - ${settings.q2_height} - 5px)`;
    document.getElementById('q1').style.height = settings.q1_height;
    document.getElementById('q2').style.height = settings.q2_height;
    content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;
}

function overrideSettings() {};

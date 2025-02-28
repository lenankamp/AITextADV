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
        q1_height: "600px",
        q2_height: "640px",
        column_width: "640px",
        sdAPI: "http://localhost:7860/sdapi/v1/txt2img",
        default_prompt: "__default__,",
        default_negative_prompt: "__defaultneg__,",
        sd_width: 768,
        sd_height: 1024,
        steps: 15,
        cfg_scale: 7,
        save_images: false,
        sampler_name: "Euler_a",
        seed_variation: 3,
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
        }
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

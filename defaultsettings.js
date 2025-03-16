let settings;

function loadDefaultSettings() {
  const defaultSettings = {
    //ui settings
    topleft_height: "70vh",
    topright_height: "40vh",
    column_width: "40vw",
    // world generation settings
    world_description: "The Kanto region is a region of the Pokémon world. Everyone aspires to be a Pokémon trainer. Pokémon trainers train their Pokémon to duel and seek to become champions.",
    starting_area: "Professor Oak's Lab",
    starting_area_description: "A small, cluttered laboratory filled with books, equipment, and various Pokémon specimens. The air is filled with the scent of chemicals and the sound of bubbling beakers. A large desk is covered in papers and a computer, while shelves are lined with jars containing strange creatures.",
    current_time: "2025-06-12 08:00:00",
    // player details and character sheet
    player_name: "Young Trainer",
    player_description: "A young and eager Pokémon trainer, ready to embark on an adventure. They have a determined look in their eyes and a backpack slung over their shoulder. Their clothes are practical and comfortable, suitable for traveling through the wilderness.",
    player_visual: "Pokémon Trainer, young, determined, wearing a cap and backpack, with a Pokéball in hand, standing in front of a lab filled with books and equipment.",
    player_seed: 11111,
    player_local_movement: "walks",
    player_distant_movement: "rides horse",
    rule_set: "Fate Accelerated",
    ruleprompt_fae_action1: "\n\nPlayer is attempting the action: '$action'. Given the context, answer the following question, only giving the simple answer without preface or explanation. What level of training in the appropriate field would one need to complete this task? Answer among one of the following: none, basic, intermediate, advanced, expert, or master. If the action is impossible in the current situation, respond with impossible.",
    ruleprompt_fae_action2: "Approach defintions:\nCareful: A Careful action is when you pay close attention to detail and take your time to do the job right. Lining up a long-range arrow shot. Attentively standing watch. Disarming a bank’s alarm system.\nClever: A Clever action requires that you think fast, solve problems, or account for complex variables. Finding the weakness in an enemy swordsman’s style. Finding the weak point in a fortress wall. Fixing a computer.\nFlashy: A Flashy action draws attention to you; it’s full of style and panache. Delivering an inspiring speech to your army. Embarrassing your opponent in a duel. Producing a magical fireworks display.\nForceful: A Forceful action isn’t subtle—it’s brute strength. Wrestling a bear. Staring down a thug. Casting a big, powerful magic spell. \nQuick: A Quick action requires that you move quickly and with dexterity. Dodging an arrow. Getting in the first punch. Disarming a bomb as it ticks 3… 2… 1… \nSneaky: A Sneaky action is done with an emphasis on misdirection, stealth, or deceit. Talking your way out of getting arrested. Picking a pocket. Feinting in a sword fight.\n\nPlayer is attempting the action: '$action'. Given the context and the player character sheet, answer the following questions in a numbered list format, only giving the simple answer without preface or explanation. 1. Yes or no, is the action impossible in the current situation? Be sure to consider if it's physiologically plausible, an anachronism, or required items are not present when considering the possibility. 2. What is the player's approach? Answer the one that best fits among: careful, clever, flashy, forceful, quick, or sneaky 3. Give a comma separated list of obviously relevant aspects, stunts, or situational advantages that make this action more likely to succeed. If none are clearly relevant to the action answer n/a. 4. Give a comma separated list of obviously relevant aspects or situational disadvantages that make this action more likely to fail. If none are clearly relevant to the action answer n/a. Be strict and harsh in determining relevance. The answer if a stunt, aspect, or situation is relevant is probably n/a.",
    charsheet_fae: {
      high_concept: "Young Pokémon Trainer",
      trouble: "Curious to a Fault",
      approaches: {
        careful: 1,
        clever: 2,
        flashy: 3,
        forceful: 1,
        quick: 2,
        sneaky: 0
      },
      aspects: [
        "Adventurous Spirit",
        "Eager Learner",
        "Loyal Friend"
      ],
      stunts: {
        'Pokémon Bond': "You get a +2 to create advantages when working with your Pokémon.",
        'Quick Reflexes': "You get a +2 to overcome obstacles when dodging attacks.",
        'Strategic Thinker': "You get a +2 to create advantages when planning your next move."
      },
      stress: {
        1: false,
        2: false,
        3: false
      },
      consequences: {
        mild: [],
        moderate: [],
        severe: []
      },
      consequenceTime: {
        moderate: [],
        severe: []
      }
    },
    // image generation settings
    concurrent_art: true,
    sdAPI: "https://b6de60edc66c97d6c9.gradio.live/sdapi/v1/txt2img",
    default_prompt: "__default__,Pokémon style,",
    default_negative_prompt: "__defaultneg__,",
    person_prompt: "",
    person_negprompt: "",
    creature_prompt: "(nopeople),((Pokémon)),",
    creature_negprompt: "((person, human)),",
    thing_prompt: "(nopeople),",
    thing_negprompt: "((people, human, person)),",
    sd_width: 768,
    sd_height: 1024,
    steps: 15,
    cfg_scale: 7,
    save_images: false,
    sampler_name: "Euler_a",
    seed_variation: 3,
    // text generation API settings
    story_param: {
      textAPI: "https://openrouter.ai/api/v1/",
      textAPItype: "openai",
      apiKey: "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",
      model: "mistralai/mistral-small-24b-instruct-2501:free",
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
      textAPI: "https://openrouter.ai/api/v1/",
      textAPItype: "openai",
      apiKey: "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",
      model: "mistralai/mistral-small-24b-instruct-2501:free",
      max_context_length: 4096,
      max_length: 400,
      text_prompt: " <s> [INST] $system_prompt\n\n### INPUT\n$input_string [/INST]\n$response_string",
      stop_sequence: ["###", "<s>", " <s>", " <s> ", "### INPUT"],
      system_prompt: "Simply and clearly answer the questions. Be as concise as possible.",
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
    creative_question_param: {
      textAPI: "https://openrouter.ai/api/v1/",
      textAPItype: "openai",
      apiKey: "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",
      model: "mistralai/mistral-small-24b-instruct-2501:free",
      max_context_length: 4096,
      max_length: 400,
      text_prompt: " <s> [INST] $system_prompt\n\n### INPUT\n$input_string [/INST]\n$response_string",
      stop_sequence: ["###", "<s>", " <s>", " <s> ", "### INPUT"],
      system_prompt: "Simply and clearly answer the questions. Be as concise as possible.",
      quiet: false,
      rep_pen: 1.0,
      rep_pen_range: 0,
      rep_pen_slope: 1,
      temperature: 0.8,
      tfs: 1,
      top_a: 0,
      top_k: 100,
      top_p: 0.6,
      typical: 1
    },
    summary_param: {
      textAPI: "https://openrouter.ai/api/v1/",
      textAPItype: "openai",
      apiKey: "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",
      model: "mistralai/mistral-small-24b-instruct-2501:free",
      max_context_length: 4096,
      max_length: 600,
      text_prompt: " <s> [INST] $system_prompt\n\n### INPUT\n$input_string [/INST]\n$response_string",
      stop_sequence: ["###", "<s>", " <s>", " <s> ", "### INPUT"],
      system_prompt: "Summarize the text in paragraph form without preface, headings, or bullet points.",
      quiet: false,
      rep_pen: 1.0,
      rep_pen_range: 0,
      rep_pen_slope: 1,
      temperature: 0.7,
      tfs: 1,
      top_a: 0,
      top_k: 100,
      top_p: 0.8,
      typical: 1
    },
    // summary settings
    summary_prompt: "Could you please provide a summary of the given text, including all key points and supporting details? The summary should be comprehensive and accurately reflect the main message and arguments presented in the original text, while also being concise and easy to understand. It is important to maintain the tone of the original text, if it is violent or explicit in language, the summary should be just as much so. Additionally, the summary should avoid any personal biases or interpretations and remain objective and factual throughout. Keep the summary in second person, bearing in mind that 'You' refers to $settings.player_name$.",
    summary_first_layer_max: 5,
    summary_first_layer_chunk: 3,
    summary_second_layer_max: 4,
    summary_second_layer_chunk: 2,
    summary_bonus_layer_max: 3,
    summary_bonus_layer_chunk: 2,
    summary_max_layers: 10,
    // text prompt settings
    output_length: "two paragraphs",
    max_context_entries: 3,
    max_summary_entries: 10,
    common_names: "Elara,Seraphina,Orion",
    full_context: "Context Info:\n$world$player$player_desc$summary$extra_context$locale\n\nStory:\n$story",
    generateAreaDescriptionPrompt: "$world$locations$mainLocation$parentArea[Generate a description of the area named $areaName in $season.]",
    areaFollowerContext: "Accompanying $player:\n$followers\n",
    areaContext: "\nCurrently in $name described as $description\n\n",
    areaPeopleContext: "People within $name\n$peopleList\n",
    areaThingsContext: "Things within $name\n$thingsList\n",
    areaCreaturesContext: "Pokémon within $name\n$creaturesList\n",
    areaPathsContext: "Paths or Exits may lead to:\n$paths",
    areaTimeContext: "Time: $timeOfDay of $dayOfWeek in $season\n",
    subLocationFormat: "$name: $description\n",
    entityFormat: "$name: $description\n",
    action_string: "Describe the player taking the action and then the resulting story.",
    generateSublocationsPrompt: "$world$locations$mainLocation\n\n[Be creative and generate a list of interesting things and locations that could reasonably be found in and around $areaName described as: $description \nIf the location only has a single entrance then there are no locations, reply with None. Do not generate more than 3 things or 6 locations. Locations must not duplicate existing nearby locations. Things must be stationary physical interactable pieces of interest within a $areaName. Descriptions should be 2-3 sentences. $topAreaDirective Answer in a formatted list with name and description on one line as such: \nLocations\n- Name: Description\n...\nThings\n- Name: Description\n...]",
    topAreaDirective: "You must generate 5 locations. If the location only has a single entrance, generate areas that might be found outside or in proximity. ",
    generateEntitiesPrompt: "$world$mainLocation$ParentArea\nExisting People:$settings.common_names$,$people\n\n[Be creative and generate a list of people and creatures that could reasonably be found in $areaName with the following details: $description \nIf no people or creatures might be reasonably found in $areaName, reply with None. Do not generate more than 4 in one category. People must not include people who already exist. Descriptions should be 3-4 sentences, starting with a physical description and followed by notable mental or emotional quirks. Answer in a formatted list with name and description on one line as such: \nPeople\n- Name: Description\n...\nCreatures\n- Name: Description\n...\n]",
    generateVisualPrompt: "[How would you describe '$name' described as '$description It is $season and $time' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]",
    addPersonDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]",
    addThingDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 2-3 sentence physical description. If there is not enough information in the context, be creative.]",
    addCreatureDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 1-2 sentence physical description, and a 1-2 sentence description of attidue dispositon or apparrent motivation. If there is not enough information in the context, be creative.]",
    outputCheckPrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'n/a'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. If a new person is in the scene, what is their name, or a simple two word description if name is not revealed? 2. If a new creature is in the scene, what is their name, or a simple two word description if name is not revealed? 3. If the scene changed location, where is the scene now? 4. If an unknown person's name is revealed, what is their name? 5. If a person has left the scene, what is their name? 6. If creature has turned into a person, what is their name? 7. If a person has turned into a creature, what is their name? 8. If a new thing is in the scene, what is its name? 9. If a new location nearby has been revealed, what is its name?]",
    outputAutoCheckPrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'n/a'. If a question has multiple answers, answer the question multiple times preceeded by the question number on each line separated by new lines. 1. Within the passage, approximate the time passed responding with one of the following: none, moments, minutes, hours, or full rest. 2. If a person, creature, or thing had a signficant change to their physical or emotional state, what was their name?]",
    consequencePrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'n/a'. 1. If I, the player $player, suffered emotional or physical harm in the passage, how long would you estimate it would take to recover? Answer in terms of rest time choosing one of the following: hours, days, years, or longer. 2. If $player suffered emotional or physical harm, creatively describe the immediate and lingering effects in 6 words.]",
    moveToAreaProximityPrompt: '[Depending on the distance traveled in the passage, would "$newArea" be best described as proximate to one of the previously listed locations? Specify the location and only the location name from the list if such is the case, otherwise answer n/a.]',
    moveToAreaPeoplePrompt: '[Answer the following question in a list format separate by \'\n\' in regard to the passage. If the question can not be answered just respond with \'n/a\' and no explanation. Among $peopleNames, who moved with the player?]',
    entityLeavesAreaPrompt: '[In the passage, to which of the adjacent areas in the context did $name move to? If ambiguous be creative and give the most fitting among the options.]',
    generateNewDescription: '\nPrevious Description: $description\n\n[Generate a new description for $name reflecting any significant changes in the context. The previous description should remain relatively unchanged unless something from recent events contradicts or is significantly important. Only $name should be mentioned in the description output. Description should be 3-4 sentences, starting with a physical description and followed by notable mental or emotional quirks.]',
    // sample prompts
    sampleSublocations: [
      {
        "role": "user",
        "content": "[Be creative and generate a list of interesting things and locations that could reasonably be found in and around Old Cabin described as: Warm and Cozy. \nIf the location only has a single entrance then there are no locations, reply with None. Do not generate more than 3 things or 6 locations. Locations must not duplicate existing nearby locations. Things must be stationary physical interactable pieces of interest within a $areaName. Descriptions should be 2-3 sentences. You must generate 5 locations. If the location only has a single entrance, generate areas that might be found outside or in proximity. Answer in a formatted list with name and description on one line as such: \nLocations\n- Name: Description\n...\nThings\n- Name: Description\n...]"
      },
      {
        "role": "assistant",
        "content": "Locations\n- Cozy Kitchen: A small room with a wooden table and chairs, a pot of stew bubbling on the stove. The smell of spices and herbs fills the air.\n- Warm Bedroom: A cozy room with a large bed covered in soft furs and blankets. A window looks out onto the snowy landscape outside.\n- Dank Cellar: A dark and musty room filled with shelves of preserved food and barrels of ale. The air is cool and damp, with a faint smell of earth and mold.\n- Musty Attic: A small, dusty room filled with old furniture and boxes. The floorboards creak underfoot, and the air is thick with dust.\n- Front Porch: A small wooden porch with a rocking chair and a view of the surrounding forest. The sound of birds chirping and leaves rustling can be heard in the distance.\nThings\n- Old Book: A leather-bound book with yellowed pages, filled with handwritten notes and sketches. The cover is worn and faded, but the contents are still legible.\n- Wooden Chest: A sturdy wooden chest with a brass lock. It looks like it hasn't been opened in years, but it might contain valuable items or secrets.\n- Old Map: A faded map of the surrounding area, with handwritten notes and markings. It looks like it hasn't been used in a long time, but it might still be useful for navigation."
      },
      {
        "role": "user",
        "content": "[Generate a list of areas within a Warm Bedroom described as 'A cozy room with a large bed covered in soft furs and blankets. A window looks out onto the snowy landscape outside.'. Each location should have a name and a short description of what can be found there. If no locations would make sense, respond with 'None'. Format each location as 'Name: Description' with one per line.]"
      },
      {
        "role": "assistant",
        "content": "None"
      }
    ],
    sampleEntities: [
      {
        "role": "user",
        "content": "[Be creative and generate a list of people and creatures that could reasonably be found in Park with the following details: A local park.\nIf no people or creatures might be reasonably found in $areaName, reply with None. Do not generate more than 4 in one category. People must not include people who already exist. Descriptions should be 3-4 sentences, starting with a physical description and followed by notable mental or emotional quirks. Answer in a formatted list with name and description on one line as such: \nPeople\n- Name: Description\n...\nCreatures\n- Name: Description\n...\n]"
      },
      {
        "role": "assistant",
        "content": "People\n- blonde woman: A tall woman with long, flowing blonde hair that cascades down her back. She has piercing blue eyes that seem to look right through you, and her expression often carries a hint of sadness. Despite her striking appearance, she tends to keep to herself, preferring solitude over social interactions. Her demeanor suggests a deep inner turmoil, as if she is haunted by memories of a troubled past.\n- curious teenager: A young teenager with a unruly brown hair and a mischievous glint in her eyes. She is always eager to explore new places and try new things, often getting herself into trouble with her reckless curiosity. Despite her carefree attitude, she has a kind heart and a strong sense of justice, always willing to stand up for what she believes in.\nCreatures\n- wild dog: A scrappy looking dog with matted fur and sharp teeth, its eyes gleaming with a feral intelligence. Despite its rough appearance, the dog seems friendly and eager for companionship, wagging its tail and nuzzling up to anyone who offers it a kind word or a scrap of food. It roams the area with a sense of purpose, as if guarding the land from unseen threats."
      }
    ],
    sampleQuestions: [
      {
        "role": "user",
        "content": "The girl behind you whimpers softly. You glance back to see her eyes welling up with tears, but she does not look scared. You turn back to him and you are ready for anything that comes your way. The old man in the corner stands up, leaning heavily on his walking stick, his voice suddenly clear as day: \"We can't let go of everything.\"[Answer the following question. Who in the passage had signifcant changes to their character?]"
      },
      {
        "role": "assistant",
        "content": "n/a"
      },
      {
        "role": "user",
        "content": "Passage:You see the old man holding a small, broken piece of metal and looking at us with an angry face. The newcomer lets out a low hiss of pain as he clutches his leg and falls back against a table that is barely stable. The girl behind you lets out a small scream and rushes forward but stops short when she hears the sound of a gunshot echoing through the food court. You see the old man stagger back, a look of shock on his face as he crumples to the ground. [Answer the following questions in a numbered list format. If the question can not be answered just respond with 'n/a'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. Who in the passage had signifcant changes to their character? 2. What are three common hair colors? 3. What is the most common eye color?]"
      },
      {
        "role": "assistant",
        "content": "1. old man\n2. blonde\n2. brown\n2. black\n3. blue"
      }
    ],
    sampleFAEAction: [
      {
        "role": "user",
        "content": "\"First, we need to find some batteries. There might be some in that storage closet.\" Your eyes drift towards the cluttered closet, its door slightly ajar. \"And I'll need something to straighten out this antenna.\" You glance around the room, spotting a few potential tools amidst the debris—a broken chair leg, a rusty fork. You hand the radio back to the girl and gesture for her to stay with it, \"Can you take care of this? I’ll be right back.\" She nods eagerly, cradling the radio as if it were a fragile treasure.\nStunts: Grand Slam: +2 to Forceful when you have the element of surprise., I love it when a plan comes together: +2 to Clever when you have a plan in place.,\nAspects: The Man with the Plan,Big Brain,Good with Computers,Lone Wolf,Always on the Run\nPlayer is attempting the action: 'Enact the plan to fix the radio.'. Given the context and the player character sheet, answer the following questions in a numbered list format, only giving the simple answer without preface or explanation. 1. How likely is success for the character's action? Answer among one of the following: trivial(little chance of failure or no consequences to failure), plausible(reasonable chance of failure), challenging(significant chance of failure), extremely difficult(extremely high risk of failure), impossible(physiologically implausible, anachronism, required items not present). 2. What is the player's approach? Answer the one that best fits among: careful, clever, flashy, forceful, quick, or sneaky 3. Give a comma separated list of specifically relevant aspects, stunts, or situational advantages that make this action more likely to succeed. If none are relevant to the action answer n/a. 4. Give a comma separated list of specifically relevant aspects or situational disadvantages that make this action more likely to fail. If none are relevant to the action answer n/a.",
      },
      {
      "role": "assistant",
      "content": "1. challenging\n2.clever\n3. I love it when a plan comes together,Big Brain\n4. n/a",
      },
    ],

  };

  settings = defaultSettings;

  // Apply settings to elements
  document.getElementById('q3').style.height = `calc(100vh - ${settings.topleft_height} - .5vh)`;
  document.getElementById('q4').style.height = `calc(100vh - ${settings.topright_height} - .5vh)`;
  document.getElementById('q1').style.height = settings.topleft_height;
  document.getElementById('q2').style.height = settings.topright_height;
  content.style.gridTemplateColumns = `${settings.column_width} .5vh 1fr`;
}

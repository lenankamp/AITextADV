let settings;

function loadDefaultSettings() {
  const defaultSettings = {
    //ui settings
    q1_height: "600px",
    q2_height: "640px",
    column_width: "640px",
    // world generation settings
    world_description: "A vast and mysterious world filled with magic and wonder.",
    starting_area: "Home",
    starting_area_description: "A cozy and warm room within a wooden cabin, your bed sits in the corner. A fire crackles in the fireplace, casting flickering shadows on the walls. The smell of pine and woodsmoke fills the air.",
    current_time: "800-01-12 08:00:00",
    // player details and character sheet
    player_name: "Adventurer",
    player_description: "A brave and adventurous soul, ready to explore the unknown.",
    player_visual: "A young adult with a determined expression, wearing a simple tunic and trousers.",
    player_seed: 11111,
    rule_set: "Fate Accelerated",
    ruleprompt_fae_action1: "Approach defintions:\nCareful: A Careful action is when you pay close attention to detail and take your time to do the job right. Lining up a long-range arrow shot. Attentively standing watch. Disarming a bank’s alarm system.\nClever: A Clever action requires that you think fast, solve problems, or account for complex variables. Finding the weakness in an enemy swordsman’s style. Finding the weak point in a fortress wall. Fixing a computer.\nFlashy: A Flashy action draws attention to you; it’s full of style and panache. Delivering an inspiring speech to your army. Embarrassing your opponent in a duel. Producing a magical fireworks display.\nForceful: A Forceful action isn’t subtle—it’s brute strength. Wrestling a bear. Staring down a thug. Casting a big, powerful magic spell. \nQuick: A Quick action requires that you move quickly and with dexterity. Dodging an arrow. Getting in the first punch. Disarming a bomb as it ticks 3… 2… 1… \nSneaky: A Sneaky action is done with an emphasis on misdirection, stealth, or deceit. Talking your way out of getting arrested. Picking a pocket. Feinting in a sword fight.\n\nPlayer is attempting the action: '$action'. Given the context and the player character sheet, answer the following questions in a numbered list format, only giving the simple answer without preface or explanation. 1. How likely is success for the character's action? Answer among one of the following: trivial(little chance of failure or no consequences to failure), plausible(reasonable chance of failure), challenging(significant chance of failure), extremely difficult(extremely high risk of failure), impossible(physiologically implausible, anachronism, required items not present). 2. What is the player's approach? Answer the one that best fits among: careful, clever, flashy, forceful, quick, or sneaky 3. Give a comma separated list of specifically relevant aspects, stunts, or situational advantages that make this action more likely to succeed. If none are relevant to the action answer n/a. 4. Give a comma separated list of specifically relevant aspects or situational disadvantages that make this action more likely to fail. If none are relevant to the action answer n/a.",
    charsheet_fae: {
      high_concept: "Determined Adventurer",
      trouble: "Curious to a Fault",
      approaches: {
        careful: 1,
        clever: 3,
        flashy: 2,
        forceful: 1,
        quick: 2,
        sneaky: 0
      },
      aspects: [
        "Adept with a Sword",
        "Fast Runner",
        "Winning Smile"
      ],
      stunts: {
        swordplay: "You get a +2 to overcome obstacles when using your sword.",
        fast: "You get a +2 to overcome obstacles when running.",
        disarming_charm: "You get a +2 to create advantages when using your charm."
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
    sdAPI: "http://localhost:7860/sdapi/v1/txt2img",
    default_prompt: "__default__,",
    default_negative_prompt: "__defaultneg__,",
    person_prompt: "",
    person_negprompt: "",
    creature_prompt: "(nopeople),",
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
    creative_question_param: {
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
      temperature: 0.9,
      tfs: 1,
      top_a: 0,
      top_k: 100,
      top_p: 0.6,
      typical: 1
    },
    // text prompt settings
    output_length: "two paragraphs",
    full_context: "Context Info:\n$world$player$player_desc$locale\n\nStory:\n$story",
    generateAreaDescriptionPrompt: "[Generate a description of the area named $areaName in $season.]",
    areaFollowerContext: "Accompanying $player:\n$followers\n",
    areaContext: "\nCurrently in: $name : $description\n\n",
    areaPeopleContext: "People within $name\n$peopleList\n",
    areaThingsContext: "Things within $name\n$thingsList\n",
    areaCreaturesContext: "Creatures within $name\n$creaturesList\n",
    areaPathsContext: "Paths or Exits may lead to:\n$paths",
    areaTimeContext: "Time: $timeOfDay of $dayOfWeek in $season\n",
    subLocationFormat: "$name: $description\n",
    entityFormat: "$name: $description\n",
    action_string: "Describe the player taking the action and then the resulting story.",
    generateSublocationsPrompt: "World Info: $world\nExisting Nearby Locations: $locations\n\n[Be creative and generate a list of interesting things and locations that could reasonably be found in and around $areaName described as: $description \nIf the location only has a single entrance then there are no locations, reply with None. Do not generate more than 3 things or 6 locations. Locations must not duplicate existing nearby locations. Things must be stationary physical interactable pieces of interest within a $areaName. Descriptions should be 2-3 sentences. Answer in a formatted list with name and description on one line as such: \nThings\n- Name: Description\n...\nLocations\n- Name: Description\n...]",
    generateEntitiesPrompt: "Existing People:Elara,Seraphina,Orion,$people\n\n[Be creative and generate a list of people and creatures that could reasonably be found in $areaName with the following details: $description \nIf no people or creatures might be reasonably found in $areaName, reply with None. Do not generate more than 4 in one category. People must not include people who already exist. Descriptions should be 3-4 sentences, starting with a physical description and followed by notable mental or emotional quirks. Answer in a formatted list with name and description on one line as such: \nPeople\n- Name: Description\n...\nCreatures\n- Name: Description\n...\n]",
    generateVisualPrompt: "[How would you describe '$name' described as '$description It is $season and $time' in a comma separated list ordered from most important details to least without specifying names for an AI image generation model?]",
    addPersonDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 1-2 sentence physical description including style of dress and hair color and style, and a 1-2 sentence personality description. If there is not enough information in the context, be creative.]",
    addThingDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 2-3 sentence physical description. If there is not enough information in the context, be creative.]",
    addCreatureDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Write a description of '$name'. Write a 1-2 sentence physical description, and a 1-2 sentence description of attidue dispositon or apparrent motivation. If there is not enough information in the context, be creative.]",
    addSubLocationDescriptionPrompt: "World Info: $world\nLocated in $areaName: $areaDescription\n\n[Describe the area named $name in 1-2 sentences.]",
    outputCheckPrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. If a new person is in the scene, what is their name, or a simple two word description if name is not revealed? 2. If a new creature is in the scene, what is their name, or a simple two word description if name is not revealed? 3. If the scene changed location, where is the scene now? 4. If an unknown person's name is revealed, what is their name? 5. If a person has left the scene, what is their name? 6. If creature has turned into a person, what is their name? 7. If a person has turned into a creature, what is their name? 8. If a new thing is in the scene, what is its name? 9. If a new location nearby has been revealed, what is its name?]",
    outputAutoCheckPrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A'. If a question has multiple answers, answer the question multiple times preceeded by the question number on each line separated by new lines. 1. Within the passage, approximate the time passed responding with one of the following: none, moments, minutes, hours, or full rest. 2. If a person, creature, or thing had a signficant change to their physical or emotional state, what was their name?]",
    consequencePrompt: "[Answer the following questions in a numbered list format in regard to the passage. If the question can not be answered just respond with 'N/A'. 1. If I, the player $player, suffered emotional or physical harm in the passage, how long would you estimate it would take to recover? Answer in terms of rest time choosing one of the following: hours, days, years, or longer. 2. If $player suffered emotional or physical harm, creatively describe the lingering effects in 6 words.]",
    moveToAreaProximityPrompt: '[Depending on the distance traveled in the passage, would "$newArea" be best described as proximate to one of the previously listed locations? Specify the location and only the location name from the list if such is the case, otherwise answer N/A.]',
    moveToAreaPeoplePrompt: '[Answer the following question in a list format separate by \'\n\' in regard to the passage. If the question can not be answered just respond with \'N/A\' and no explanation. Among $peopleNames, who moved with the player?]',
    entityLeavesAreaPrompt: '[In the passage, to which of the adjacent areas in the context did $name move to? If ambiguous be creative and give the most fitting among the options.]',
    generateNewDescription: '\nPrevious Description: $description\n\n[Generate a new description for $name reflecting any significant changes in the context. Description should be 3-4 sentences, starting with a physical description and followed by notable mental or emotional quirks.]',
    // sample prompts
    sampleSublocations: [
      {
        "role": "user",
        "content": "[Generate a list of locations within a Old Cabin described as 'A cozy and warm wooden cabin. A fire crackles in the fireplace, casting flickering shadows on the walls. The smell of pine and woodsmoke fills the air.'. Each location should have a name and a short description of what can be found there. If no locations would make sense, respond with 'None'. Format each location as 'Name: Description' with one per line.]"
      },
      {
        "role": "assistant",
        "content": "Cozy Kitchen: A small room with a wooden table and chairs, a pot of stew bubbling on the stove. The smell of spices and herbs fills the air.\nWarm Bedroom: A cozy room with a large bed covered in soft furs and blankets. A window looks out onto the snowy landscape outside.\nDank Cellar: A dark and musty room filled with shelves of preserved food and barrels of ale. The air is cool and damp, with a faint smell of earth and mold."
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
        "content": "[Answer the following question. What is your favorite color?]"
      },
      {
        "role": "assistant",
        "content": "Blue"
      },
      {
        "role": "user",
        "content": "[Answer the following questions in a numbered list format. If the question can not be answered just respond with 'N/A'. If a question has multiple answers, answer the question multiple times preceeded by the question number and separated by new lines. 1. Who in the passage had signifcant changes to their character? 2. What are three common hair colors? 3. What is the most common eye color?]"
      },
      {
        "role": "assistant",
        "content": "1. N/A\n2. blonde\n2. brown\n2. black\n3. blue"
      }
    ],

  };

  settings = defaultSettings;

  // Apply settings to elements
  document.getElementById('q3').style.height = `calc(100vh - ${settings.q1_height} - 5px)`;
  document.getElementById('q4').style.height = `calc(100vh - ${settings.q2_height} - 5px)`;
  document.getElementById('q1').style.height = settings.q1_height;
  document.getElementById('q2').style.height = settings.q2_height;
  content.style.gridTemplateColumns = `${settings.column_width} 5px 1fr`;
}

function overrideSettings() { };

function openSettings() {
  const overlay = document.getElementById('settingsOverlay');
  const form = document.getElementById('settingsForm');
  form.innerHTML = '';

  const sections = {
      'UI': ['column_width', 'topleft_height', 'topright_height'],
      'Game Settings': [ 
        'writing_style', 'sentient_string', 'creature_string', 
        'sentient_generation_limit', 'creature_generation_limit',
        'affinity_threshold', 'positive_affinities', 'negative_affinities',
        'positive_creature_affinities', 'negative_creature_affinities',
        ],
      'World Generation': [
          'world_description', 'starting_area', 'starting_area_description', 
          'current_time', 'climate', 'world_map_visual', 'world_map_seed'
      ],
      'Rule System': ['rule_set', 'charsheet_fae', 'ruleprompt_fae_action1', 
        'ruleprompt_fae_action2', 'sampleFAEAction'],
      'Summary': [
        'summary_prompt', 'summary_first_layer_max', 'summary_first_layer_chunk', 
        'summary_second_layer_max', 'summary_second_layer_chunk', 'summary_bonus_layer_max', 
        'summary_bonus_layer_chunk', 'summary_max_layers'
      ],
      'Image Generation': [
        'autogenerate_prompts', 'concurrent_art', 'sdAPItype',
        'sdAPI', 'default_prompt', 
        'default_negative_prompt', 'person_prompt', 'person_negprompt',
          'creature_prompt', 'creature_negprompt',
          'thing_prompt', 'thing_negprompt',
          'sd_width', 'sd_height', 'steps', 'cfg_scale',
          'save_images', 'sampler_name', 'seed_variation'
      ],
      'Text To Speech': [
          'tts_enable', 'tts_type', 'tts_api', 'tts_api_key', 'tts_default_male',
          'tts_default_female', 'tts_narrator', 'tts_player', 'tts_max_length'
      ],
      'Text Generation': [
          'story_param', 'question_param', 'creative_question_param',
          'summary_param', 'output_length'
      ],
      'Text Prompts': [
          'common_names', 'max_context_entries', 'max_summary_entries', 
          'full_context', 'generateAreaDescriptionPrompt','areaContext', 
          'topAreaDirective', 'areaPeopleContext','areaFollowerContext',
          'areaThingsContext', 'areaCreaturesContext', 'areaPathsContext',
          'areaTimeContext', 'subLocationFormat', 'entityFormat',
          'action_string', 'generateSublocationsPrompt', 'generateEntitiesPrompt',
          'generateVisualPrompt', 'addPersonDescriptionPrompt',
          'addThingDescriptionPrompt', 'addCreatureDescriptionPrompt',
          'outputCheckPrompt', 'affinityGainCheck', 'affinityLossCheck',
          'outputAutoCheckPrompt', 'consequencePrompt',
          'moveToAreaProximityPrompt', 'moveToAreaPeoplePrompt',
          'entityLeavesAreaPrompt', 'generateNewDescription'
      ],
      'Sample Data': ['sampleSublocations', 'sampleEntities', 'sampleQuestions']
  };

  // Create search filter
  const searchContainer = document.createElement('div');
  searchContainer.className = 'settings-search';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search settings...';
  searchInput.className = 'settings-search-input';
  
  searchContainer.appendChild(searchInput);
  form.appendChild(searchContainer);

  // Create sections container
  const sectionsContainer = document.createElement('div');
  sectionsContainer.className = 'settings-sections';

  // Helper function for tooltips
  const createTooltip = (key) => {
    const tooltips = {
      // UI Settings
      'column_width': 'Width of the left column',
      'topleft_height': 'Height of the top left quadrant',
      'topright_height': 'Height of the top right quadrant',
      
      // Game Settings
      'writing_style': 'Writing style for generated text (e.g., "epic fantasy", "sensory immersion", "dark gritty realism")',
      'sentient_string': 'Label used to refer to intelligent beings (e.g., "People")',
      'creature_string': 'Label used to refer to non-intelligent beings (e.g., "Creatures")',
      'sentient_generation_limit': '4 is max, can also enter a % and it will roll that chance 4 times',
      'creature_generation_limit': '4 is max, can also enter a % and it will roll that chance 4 times',
      'affinity_threshold': 'Number of interactions needed to increase relationship level',
      'positive_affinities': 'List of increasingly positive relationship states',
      'negative_affinities': 'List of increasingly negative relationship states',
      'positive_creature_affinities': 'List of increasingly positive creature relationship states',
      'negative_creature_affinities': 'List of increasingly negative creature relationship states',
      
      // World Generation Settings
      'world_description': 'Overall description of the game world setting',
      'starting_area': 'Name of the initial area where gameplay begins, a / can be sued to being in areas within areas',
      'starting_area_description': 'Detailed description of the starting area',
      'current_time': 'Year can be arbitary number, but must be Y-MM-DD HH:MM:SS format',
      'climate': '"temperate" is default and will change by month, blank entry will disable, anything else will override if you want a nuclear winter or eternal summer',
      
      // Rule System
      'rule_set': 'Active game rule system (e.g., "Fate Accelerated")',
      'ruleprompt_fae_action1': 'Prompt for determining action difficulty in FAE',
      'ruleprompt_fae_action2': 'Prompt for determining action approach in FAE',
      'sampleFAEAction': 'Example of a FAE action resolution',
      
      // Summary Settings
      'summary_prompt': 'Template for generating story summaries',
      'summary_first_layer_max': 'Maximum entries in first summary layer',
      'summary_first_layer_chunk': 'Number of entries per chunk in first layer',
      'summary_second_layer_max': 'Maximum entries in second summary layer',
      'summary_second_layer_chunk': 'Number of entries per chunk in second layer',
      'summary_bonus_layer_max': 'Maximum entries in bonus summary layer',
      'summary_bonus_layer_chunk': 'Number of entries per chunk in bonus layer',
      'summary_max_layers': 'Maximum number of summary layers',
      
      // Image Generation
      'autogenerate_prompts': 'Whether to generate distinct image prompts, possibly better suited to AI, or save the LLM use and just use description',
      'concurrent_art': 'Allow images to generate simultaneously with text generation',
      'sdAPItype': 'Type of Stable Diffusion API to use, ignored at moment and a1111 like is assumed',
      'sdAPI': 'URL of the Stable Diffusion API endpoint',
      'default_prompt': 'Base prompt for all image generation',
      'default_negative_prompt': 'Base negative prompt for all image generation',
      'person_prompt': 'Additional prompt elements for generating person images',
      'person_negprompt': 'Additional negative prompt elements for person images',
      'creature_prompt': 'Additional prompt elements for generating creature images',
      'creature_negprompt': 'Additional negative prompt elements for creature images',
      'thing_prompt': 'Additional prompt elements for generating object images',
      'thing_negprompt': 'Additional negative prompt elements for object images',
      'sd_width': 'Width of generated images in pixels',
      'sd_height': 'Height of generated images in pixels',
      'steps': 'Number of inference steps for image generation',
      'cfg_scale': 'CFG scale for image generation (higher = more prompt adherence)',
      'save_images': 'Whether to save generated images to disk',
      'sampler_name': 'Name of the sampling algorithm to use',
      'seed_variation': 'Adds random factor to seed for hopefully only slight variations for an entity',
      
      // Text to Speech
      'tts_enable': 'Enable text-to-speech functionality',
      'tts_type': 'Type of TTS service to use, only kobold support for now',
      'tts_api': 'URL of the TTS API endpoint',
      'tts_api_key': 'API key for TTS service',
      'tts_default_male': 'Default voice for male characters',
      'tts_default_female': 'Default voice for female characters',
      'tts_narrator': 'Voice used for narrator text',
      'tts_player': 'Voice used for player character',
      'tts_max_length': 'Maximum text length for TTS conversion',
      
      // Text Generation
      'story_param': 'Parameters for story generation model',
      'question_param': 'Parameters for question answering model',
      'creative_question_param': 'Parameters for creative question answering',
      'summary_param': 'Parameters for summary generation',
      'output_length': 'Desired length of generated text for story coniuations',
      
      // Text Prompts
      'common_names': 'List of commonly used character names to try and exclude',
      'max_context_entries': 'Maximum number of context entries to maintain',
      'max_summary_entries': 'Maximum number of summary entries to maintain',
      'full_context': 'Template for full context construction',
      'generateAreaDescriptionPrompt': 'Template for generating area descriptions',
      'areaContext': 'Template for area context information',
      'areaPeopleContext': 'Template for describing people in an area',
      'areaFollowerContext': 'Template for describing followers in an area',
      'areaThingsContext': 'Template for describing objects in an area',
      'areaCreaturesContext': 'Template for describing creatures in an area',
      'areaPathsContext': 'Template for describing area exits and paths',
      'areaTimeContext': 'Template for describing current time in area',
      'subLocationFormat': 'Format for sub-location descriptions',
      'entityFormat': 'Format for entity descriptions',
      'action_string': 'Template for describing player actions',
      'generateSublocationsPrompt': 'Template for generating sub-locations',
      'generateEntitiesPrompt': 'Template for generating entities',
      'generateVisualPrompt': 'Template for generating visual descriptions',
      'addPersonDescriptionPrompt': 'Template for adding person descriptions',
      'addThingDescriptionPrompt': 'Template for adding object descriptions',
      'addCreatureDescriptionPrompt': 'Template for adding creature descriptions',
      'outputCheckPrompt': 'Template for checking output validity',
      'outputAutoCheckPrompt': 'Template for automatic output checking',
      'consequencePrompt': 'Template for determining action consequences',
      'moveToAreaProximityPrompt': 'Template for checking area proximity',
      'moveToAreaPeoplePrompt': 'Template for determining who moves with player',
      'entityLeavesAreaPrompt': 'Template for determining entity movement',
      'generateNewDescription': 'Template for updating entity descriptions',
      
      // Sample Data
      'sampleSublocations': 'Example sub-location generation data',
      'sampleEntities': 'Example entity generation data',
      'sampleQuestions': 'Example question and answer data',
      
      // Text Generation API Settings
      'textAPI': 'URL of the text generation API',
      'textAPItype': 'Type of text generation API to use',
      'apiKey': 'API key for text generation service',
      'model': 'Model name/ID for text generation',
      'max_context_length': 'Maximum context length for text generation',
      'max_length': 'Maximum length of generated text',
      'text_prompt': 'Template for text generation prompts',
      'stop_sequence': 'Sequences that stop text generation',
      'system_prompt': 'System-level prompt for text generation',
      'quiet': 'Whether to suppress API output',
      'rep_pen': 'Repetition penalty factor',
      'rep_pen_range': 'Range for repetition penalty',
      'rep_pen_slope': 'Slope for repetition penalty',
      'temperature': 'Temperature for text generation randomness',
      'tfs': 'Tail free sampling parameter',
      'top_a': 'Top-A sampling parameter',
      'top_k': 'Top-K sampling parameter',
      'top_p': 'Top-P (nucleus) sampling parameter',
      'typical': 'Typical sampling parameter'
    };
  
    return tooltips[key] || 'Configure this setting';
  };

  // Process settings and create sections
  for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
          const value = settings[key];
          
          // Determine section
          let sectionName = 'Other';
          for (const [section, keys] of Object.entries(sections)) {
              if (keys.includes(key)) {
                  sectionName = section;
                  break;
              }
          }

          // Get or create section
          let section = sectionsContainer.querySelector(`.settings-section[data-section="${sectionName}"]`);
          if (!section) {
              section = document.createElement('div');
              section.className = 'settings-section collapsed'; // Add collapsed class by default
              section.dataset.section = sectionName;

              const header = document.createElement('div');
              header.className = 'settings-section-header';
              header.innerHTML = `<span>${sectionName}</span><span class="section-toggle" style="transform: rotate(-90deg)">▼</span>`; // Start rotated
              header.onclick = (e) => {
                  const isCollapsed = section.classList.toggle('collapsed');
                  const toggle = header.querySelector('.section-toggle');
                  toggle.style.transform = isCollapsed ? 'rotate(-90deg)' : '';
                  e.stopPropagation();
              };

              const content = document.createElement('div');
              content.className = 'settings-section-content';

              section.appendChild(header);
              section.appendChild(content);
              sectionsContainer.appendChild(section);
          }

          const sectionContent = section.querySelector('.settings-section-content');

          // Create setting container
          const settingContainer = document.createElement('div');
          settingContainer.className = 'setting-item';
          settingContainer.dataset.settingName = key.toLowerCase();
          settingContainer.dataset.searchTerms = `${key.toLowerCase()} ${sectionName.toLowerCase()}`;

          // Create label with tooltip
          const label = document.createElement('label');
          label.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          label.title = createTooltip(key);
          label.htmlFor = key;
          settingContainer.appendChild(label);

          // Create input based on value type
          if (typeof value === 'object') {
              const textarea = document.createElement('textarea');
              textarea.id = key;
              textarea.name = key;
              textarea.value = JSON.stringify(value, null, 2);
              textarea.spellcheck = false;
              settingContainer.appendChild(textarea);
          } else {
              const input = document.createElement('input');
              input.id = key;
              input.name = key;
              

              if (typeof value === 'boolean') {
                  input.type = 'checkbox';
                  input.checked = value;
                  settingContainer.classList.add('setting-checkbox');
              } else if (typeof value === 'number') {
                  input.type = 'number';
                  input.value = value;
                  input.min = 0; // Prevent negative values for dimensions
              } else {
                  input.type = 'text';
                  input.value = typeof value === 'string' ? value.replace(/\n/g, '\\n') : value;
              }
              

              settingContainer.appendChild(input);
          }

          sectionContent.appendChild(settingContainer);
      }
  }

  form.appendChild(sectionsContainer);

  // Add action buttons
  const actionButtons = document.createElement('div');
  actionButtons.className = 'settings-actions';
  
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Changes';
  saveButton.className = 'btn-primary';
  saveButton.type = 'button'; // Explicitly set type to button
  saveButton.onclick = saveSettings;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'btn-secondary';
  cancelButton.type = 'button'; // Prevent form submission
  cancelButton.onclick = (e) => {
    e.preventDefault();
    closeSettings();
  };
  
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset to Defaults';
  resetButton.className = 'btn-secondary';
  resetButton.type = 'button'; // Explicitly set type to button
  resetButton.onclick = (e) => {
    e.preventDefault();
        loadDefaultSettings();
        overrideSettings();
        closeSettings();
  };

  actionButtons.appendChild(saveButton);
  actionButtons.appendChild(cancelButton);
  actionButtons.appendChild(resetButton);
  form.appendChild(actionButtons);

  // Update search functionality for collapsible sections
  searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const sections = form.querySelectorAll('.settings-section');
      
      sections.forEach(section => {
          let hasVisibleItems = false;
          const items = section.querySelectorAll('.setting-item');
          
          items.forEach(item => {
              const searchTerms = item.dataset.searchTerms || '';
              const matches = searchTerms.includes(searchTerm) || 
                            item.textContent.toLowerCase().includes(searchTerm);
              item.style.display = matches ? '' : 'none';
              if (matches) hasVisibleItems = true;
          });
          
          section.style.display = hasVisibleItems ? '' : 'none';
          if (hasVisibleItems && searchTerm) {
              section.classList.remove('collapsed');
              const toggle = section.querySelector('.section-toggle');
              if (toggle) toggle.style.transform = '';
          }
      });
  });

  overlay.style.display = 'flex';
  setTimeout(() => searchInput.focus(), 100);
}

function closeSettings() {
  document.getElementById('settingsOverlay').style.display = 'none';
}

function saveSettings() {
  const form = document.getElementById('settingsForm');

  // Prevent form submission if this was triggered by a submit event
  if (event && event.preventDefault) {
      event.preventDefault();
  }

  const newSettings = {...settings}; // Create a copy of current settings

  // Update settings with form values
  for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
          const input = form.elements[key];
          if (!input) continue;

          try {
              if (typeof settings[key] === 'boolean') {
                  newSettings[key] = input.checked;
              } else if (typeof settings[key] === 'object') {
                  newSettings[key] = JSON.parse(input.value);
              } else {
                  newSettings[key] = input.value;
              }
          } catch (e) {
              console.error(`Error parsing value for ${key}:`, e);
          }
      }
  }

  // Update the settings object
  settings = newSettings;

  // Save settings to storage
  try {
      localStorage.setItem('settings', JSON.stringify(settings));
  } catch (e) {
      console.error('Error saving settings to localStorage:', e);
  }

  // Apply visual settings
  try {
      document.getElementById('q1').style.height = settings.topleft_height;
      document.getElementById('q2').style.height = settings.topright_height;
      document.getElementById('q3').style.height = `calc(100vh - ${settings.topleft_height} - .5vh)`;
      document.getElementById('q4').style.height = `calc(100vh - ${settings.topright_height} - .5vh)`;
    // Update flex properties instead of grid template columns
    const leftSide = document.getElementById('left');
    const rightSide = document.getElementById('right');
    if (leftSide && rightSide) {
        leftSide.style.flex = `0 0 ${settings.column_width}`;
        rightSide.style.flex = '1';
    }
  } catch (e) {
      console.error('Error applying visual settings:', e);
  }

  closeSettings();
  updateTime();
  updateApproachDisplay();
  updateCharacterInfo();
  updateConsequences();
  return false; // Prevent form submission
}

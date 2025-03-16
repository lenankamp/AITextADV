function openSettings() {
  const overlay = document.getElementById('settingsOverlay');
  const form = document.getElementById('settingsForm');
  form.innerHTML = '';

  const sections = {
      'UI': ['column_width', 'topleft_height', 'topright_height'],
      'World Generation': [
          'world_description', 'starting_area', 'starting_area_description', 
          'current_time', 'climate'
      ],
      'Player Details': [
          'player_name', 'player_description', 'player_visual', 'player_seed',
          'player_local_movement', 'player_distant_movement'
      ],
      'Rule System': ['rule_set', 'charsheet_fae', 'ruleprompt_fae_action1', 
        'ruleprompt_fae_action2', 'sampleFAEAction'],
      'Summary': [
        'summary_prompt', 'summary_first_layer_max', 'summary_first_layer_chunk', 
        'summary_second_layer_max', 'summary_second_layer_chunk', 'summary_bonus_layer_max', 
        'summary_bonus_layer_chunk', 'summary_max_layers'
      ],
      'Image Generation': [
          'concurrent_art', 'sdAPI', 'default_prompt', 'default_negative_prompt',
          'person_prompt', 'person_negprompt',
          'creature_prompt', 'creature_negprompt',
          'thing_prompt', 'thing_negprompt',
          'sd_width', 'sd_height', 'steps', 'cfg_scale',
          'save_images', 'sampler_name', 'seed_variation'
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
          'outputCheckPrompt',
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
      'column_width': 'Width of the left side panel in pixels',
      'topleft_height': 'Height of the top quadrant in pixels',
      'topright_height': 'Height of the middle quadrant in pixels',
      'world_description': 'Description of the world setting',
      'starting_area': 'Name of the starting area',
      'starting_area_description': 'Description of the starting area',
      'current_time': 'Current time in the game world',
      'player_name': 'Name of the player character',
      'player_description': 'Description of the player character',
      'player_visual': 'Visual description of the player character',
      'player_seed': 'Seed value for generating player character visuals',
      'rule_set': 'Rule set used for the game',
      'ruleprompt_fae_action1': 'Prompt for determining actions in the Fate Accelerated rule set',
      'charsheet_fae': 'Character sheet for the Fate Accelerated rule set',
      'sdAPI': 'URL of the Stable Diffusion API',
      'default_prompt': 'Default prompt for image generation',
      'default_negative_prompt': 'Default negative prompt for image generation',
      'person_prompt': 'Base prompt for generating character images',
      'person_negprompt': 'Negative prompt to avoid unwanted elements in character images',
      'creature_prompt': 'Base prompt for generating creature images',
      'creature_negprompt': 'Negative prompt to avoid unwanted elements in creature images',
      'thing_prompt': 'Base prompt for generating object and item images',
      'thing_negprompt': 'Negative prompt to avoid unwanted elements in object images',
      'sd_width': 'Width of generated images in pixels',
      'sd_height': 'Height of generated images in pixels',
      'steps': 'Number of steps for image generation',
      'cfg_scale': 'CFG scale for image generation',
      'save_images': 'Whether to save generated images',
      'sampler_name': 'Name of the sampler used for image generation',
      'seed_variation': 'Variation in seed values for image generation',
      'story_param': 'Parameters for story text generation',
      'question_param': 'Parameters for question text generation',
      'creative_question_param': 'Parameters for creative question text generation',
      'output_length': 'Length of the generated output',
      'full_context': 'Full context information for text generation',
      'generateAreaDescriptionPrompt': 'Prompt for generating area descriptions',
      'areaContext': 'Context information for the current area',
      'areaPeopleContext': 'Context information for people in the current area',
      'areaFollowerContext': 'Context information for followers in the current area',
      'areaThingsContext': 'Context information for things in the current area',
      'areaCreaturesContext': 'Context information for creatures in the current area',
      'areaPathsContext': 'Context information for paths or exits in the current area',
      'areaTimeContext': 'Context information for the time in the current area',
      'subLocationFormat': 'Format for sub-location descriptions',
      'entityFormat': 'Format for entity descriptions',
      'action_string': 'String describing the player\'s action',
      'generateSublocationsPrompt': 'Prompt for generating sub-locations',
      'generateEntitiesPrompt': 'Prompt for generating entities',
      'generateVisualPrompt': 'Prompt for generating visual descriptions',
      'addPersonDescriptionPrompt': 'Prompt for adding person descriptions',
      'addThingDescriptionPrompt': 'Prompt for adding thing descriptions',
      'addCreatureDescriptionPrompt': 'Prompt for adding creature descriptions',
      'outputCheckPrompt': 'Prompt for checking the output',
      'outputAutoCheckPrompt': 'Prompt for automatically checking the output',
      'consequencePrompt': 'Prompt for determining consequences',
      'moveToAreaProximityPrompt': 'Prompt for determining proximity to areas',
      'moveToAreaPeoplePrompt': 'Prompt for determining people moving with the player',
      'entityLeavesAreaPrompt': 'Prompt for determining entities leaving the area',
      'generateNewDescription': 'Prompt for generating new descriptions',
      'sampleSublocations': 'Sample sub-locations for testing',
      'sampleEntities': 'Sample entities for testing',
      'sampleQuestions': 'Sample questions for testing'
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
              section.className = 'settings-section';
              section.dataset.section = sectionName;
              

              const header = document.createElement('div');
              header.className = 'settings-section-header';
              header.innerHTML = `<span>${sectionName}</span><span class="section-toggle">▼</span>`;
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
  resetButton.onclick = resetSettings;

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

function resetSettings() {
  loadDefaultSettings();
  overrideSettings();
  closeSettings();
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
      document.querySelector('.content').style.gridTemplateColumns = `${settings.column_width} .5vh 1fr`;
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

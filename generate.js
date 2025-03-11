async function generateText(params, input, post='', variables={}, sample_messages=[]) {
    // Show loader
    document.getElementById('loader').style.display = 'block';

    // Process input string for variable replacements if it contains $variables
    input = replaceVariables(input, variables);
    
    // Process system_prompt for variable replacements
    const system_prompt = replaceVariables(params.system_prompt, variables);

    let response;

    // Send message to API
    if(params.textAPItype == 'openai') {
        const messages = [
            {
                "role": "system",
                "content": system_prompt
            }
        ];
    
        // Include sample_messages if provided
        if (sample_messages.length > 0) {
            sample_messages.forEach(message => {
                messages.push(message);
            });
        }
    
        messages.push({
            "role": "user",
            "content": input
        });
        response = await fetch(params.textAPI + 'chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: params.model,
                messages: messages,
                max_completion_tokens: params.max_length,
                temperature: params.temperature,
                top_p: params.top_p,
                n: 1,
                stream: false,
                stop: params.stop_sequence
            })
        });
    } else { // default to koboldcpp
        // Process the text_prompt template with variables
        const processedPrompt = replaceVariables(params.text_prompt, {
            ...variables,
            system_prompt: system_prompt,
            input_string: input,
            response_string: post
        });

        response = await fetch(params.textAPI + 'generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                max_context_length: params.max_context_length,
                max_length: params.max_length,
                prompt: processedPrompt,
                quiet: params.quiet,
                rep_pen: params.rep_pen,
                rep_pen_range: params.rep_pen_range,
                rep_pen_slope: params.rep_pen_slope,
                temperature: params.temperature,
                tfs: params.tfs,
                top_a: params.top_a,
                top_k: params.top_k,
                top_p: params.top_p,
                typical: params.typical,
                stop_sequence: params.stop_sequence
            })
        });
    }

    const data = await response.json();

    // Hide loader
    document.getElementById('loader').style.display = 'none';

    if(params.textAPItype == 'openai') {
        console.log(data.choices[0].message.content);
        return data.choices[0].message.content;
    } else {
        return data.results[0].text;
    }
}

// Helper function to replace all variables in a string
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
    const settingsVarPattern = /\$settings\.([^\$]+)/g;
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

async function generateArt(prompt, negprompt='', seed=-1) {
    // Show loader
    document.getElementById('loader').style.display = 'block';

    let sum = 0;
    if (typeof seed == "string") {
        for (let i = 0; i < seed.length; i++)
            sum *= seed.charCodeAt(i);
    } else {
        sum = seed;
    }

    try {
        const response = await fetch(settings.sdAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "prompt": settings.default_prompt + prompt,
                "negative_prompt": settings.default_negative_prompt + negprompt,
                "width": settings.sd_width,
                "height": settings.sd_height,
                "steps": settings.steps,
                "seed": sum + Math.floor(Math.random() * settings.seed_variation),
                "cfg_scale": settings.cfg_scale,
                "send_images": true,
                "save_images": settings.save_images,
                "sampler_name": settings.sampler_name
            })
        });

        const data = await response.json();
        // Assuming the image data is in data.images[0] as a base64 string
        const imageBase64 = data.images[0];
        const binaryString = window.atob(imageBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const pngBlob = new Blob([bytes], { type: 'image/png' });

        // Converting PNG to WebP for file size reduction, should make quality or even this feature options

        const img = new Image();

        // Create a canvas element to draw the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Unable to obtain 2D rendering context.");
        }

        img.src = URL.createObjectURL(pngBlob);
        await new Promise((resolve) => {
            img.onload = () => resolve();
        });

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const webpBlob = await new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        throw new Error("Failed to convert to WebP format.");
                    }
                },
                "image/webp",
                0.6 // quality 0-1, 1 being best quality
            );
        });

        // Hide loader
        document.getElementById('loader').style.display = 'none';

        return webpBlob;
    } catch (error) {
        console.error('Error generating art:', error);
        // Hide loader
        document.getElementById('loader').style.display = 'none';
        // Return placeholder image
        return 'placeholder';
    }
}
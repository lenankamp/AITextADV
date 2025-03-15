// Static queues and processing states
let artRequestQueue = [];
let textRequestQueue = [];
let isProcessingArt = false;
let isProcessingText = false;

async function processTextQueue() {
    if (isProcessingText || textRequestQueue.length === 0) return;
    
    isProcessingText = true;
    const request = textRequestQueue.shift();
    
    try {
        const result = await generateTextImpl(
            request.params,
            request.input,
            request.post,
            request.variables,
            request.sample_messages
        );
        request.resolve(result);
    } catch (error) {
        request.reject(error);
    } finally {
        isProcessingText = false;
        processTextQueue();
    }
}

async function processArtQueue() {
    // Don't process art if text is being processed and concurrent_art is false
    if (isProcessingText && !settings.concurrent_art) return;
    
    if (isProcessingArt || artRequestQueue.length === 0) return;
    
    isProcessingArt = true;
    const request = artRequestQueue.shift();
    
    try {
        const result = await generateArtImpl(request.prompt, request.negprompt, request.seed);
        request.resolve(result);
    } catch (error) {
        request.reject(error);
    } finally {
        isProcessingArt = false;
        // Process next request if any
        processArtQueue();
    }
}

// Main generateText function that adds to queue
async function generateText(params, input, post='', variables={}, sample_messages=[]) {
    return new Promise((resolve, reject) => {
        textRequestQueue.push({ params, input, post, variables, sample_messages, resolve, reject });
        processTextQueue();
    });
}

// Implementation of text generation
async function generateTextImpl(params, input, post='', variables={}, sample_messages=[]) {
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
                'Authorization': 'Bearer ' + params.apiKey,
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
        if (data.choices)
            return data.choices[0].message.content;
        else
            return '';
    } else {
        return data.results[0].text;
    }
}

async function generateArt(prompt, negprompt='', seed=-1) {
    return new Promise((resolve, reject) => {
        artRequestQueue.push({ prompt, negprompt, seed, resolve, reject });
        // Only try to process art queue if we're not processing text, or if concurrent_art is true
        if (!isProcessingText || settings.concurrent_art) {
            processArtQueue();
        }
    });
}

// Implementation of the art generation
async function generateArtImpl(prompt, negprompt='', seed=-1) {
    let sum = 0;
    if (typeof seed == "string") {
        for (let i = 0; i < seed.length; i++)
            sum *= seed.charCodeAt(i);
    } else {
        sum = seed;
    }

    if (settings.sdAPI == '') { //5 fantasy art, 3 none, 16 watercolor, 17 realistic, 7 hd
        const imageBase64 = await send_task_to_dream_api(16, prompt);
        return await base64ToWebP(imageBase64);
    } else {
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
        if (!response.ok) {
            return 'placeholder';
        }
        
        const imageBase64 = data.images[0];
        return await base64ToWebP(imageBase64);
    }
}

async function send_task_to_dream_api(style_id = 0, prompt, negprompt='', seed=-1) {
    /**
    Send requests to the dream API.
    prompt is the text prompt.
    style_id is which style to use (a mapping of ids to names is in the docs).
    target_img_path is an optional base64 string of the target image.
    Returns: base64 string of generated image or throws error
    */

    const post_payload = { "use_target_image": (false) };
    const BASE_URL = 'https://api.luan.tools/api/tasks/';
    const headers = {
        'Authorization': `Bearer qVo2UrCJ5ofXlbq6ewa7WqNrCgu0wkfx`,
        'Content-Type': 'application/json'
    };

    // Step 1: Create task
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(post_payload)
    });
    if (!response.ok) throw new Error('Failed to create task');
    const taskData = await response.json();

    // Step 2: Configure generation task
    const task_id = taskData.id;
    const task_url = `${BASE_URL}${task_id}`;
    const put_payload = {
        'input_spec': {
            'style': style_id,
            'prompt': prompt,
            'negative_prompt': negprompt,
            'width': 512,
            'height': 768,
            'seed': seed
        }
    };
    
    const putResponse = await fetch(task_url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(put_payload)
    });
    if (!putResponse.ok) throw new Error('Failed to configure task');

    // Step 3: Poll for results
    while (true) {
        const statusResponse = await fetch(task_url, { headers });
        if (!statusResponse.ok) throw new Error('Failed to check status');
        
        const statusData = await statusResponse.json();
        if (statusData.state === 'failed') {
            throw new Error('Image generation failed');
        } else if (statusData.state === 'completed') {
            const imageResponse = await fetch(statusData.result);
            const blob = await imageResponse.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Extract just the base64 part if it's a data URL
                    const base64Data = reader.result.split(',')[1] || reader.result;
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        await new Promise(res => setTimeout(res, 4000));
    }
}

async function base64ToWebP(imageBase64) {
            // Assuming the image data is in data.images[0] as a base64 string
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
            return webpBlob;
}
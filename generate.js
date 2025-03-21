// Static queues and processing states
let artRequestQueue = [];
let textRequestQueue = [];
let isProcessingArt = false;
let isProcessingText = false;

function updateQueueStatus() {
    const queueStatusEl = document.querySelector('.queue-status');
    const loaderEl = document.querySelector('.loader');
    const container = document.querySelector('.loader-container');
    
    const artCount = artRequestQueue.length;
    const textCount = textRequestQueue.length;
    
    if (artCount === 0 && textCount === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    loaderEl.style.display = 'block';
    
    let status = 'Generating ';
    if (artCount > 0 && textCount > 0) {
        status += `${artCount} Image${artCount > 1 ? 's' : ''} and ${textCount} Text`;
    } else if (artCount > 0) {
        status += `${artCount} Image${artCount > 1 ? 's' : ''}`;
    } else if (textCount > 0) {
        status += `${textCount} Text`;
    }
    
    queueStatusEl.textContent = status;
}

async function processTextQueue() {
    if (isProcessingText || textRequestQueue.length === 0) return;
    if (isProcessingArt && !settings.concurrent_art) return;

    isProcessingText = true;
    updateQueueStatus();
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
        updateQueueStatus();
        processTextQueue();
        if(!isProcessingText && !isArtQueueEmpty())
            processArtQueue();
    }
}

function isArtQueueEmpty() {
    return artRequestQueue.length === 0 && !isProcessingArt;
}

async function processArtQueue() {
    if (isProcessingText && !settings.concurrent_art) return;

    if (isProcessingArt || artRequestQueue.length === 0) {
        if (!isProcessingArt && !isProcessingText) {
            const event = new CustomEvent('artQueueEmpty');
            document.dispatchEvent(event);
        }
        return;
    }

    isProcessingArt = true;
    updateQueueStatus();
    const request = artRequestQueue.shift();

    try {
        const result = await generateArtImpl(request.prompt, request.negprompt, request.seed);
        request.resolve(result);
    } catch (error) {
        request.reject(error);
    } finally {
        isProcessingArt = false;
        updateQueueStatus();
        if (textRequestQueue.length > 0)
            processTextQueue();
        else
            processArtQueue();
    }
}

// Main generateText function that adds to queue
async function generateText(params, input, post = '', variables = {}, sample_messages = []) {
    return new Promise((resolve, reject) => {
        textRequestQueue.push({ params, input, post, variables, sample_messages, resolve, reject });
        processTextQueue();
    });
}

// Implementation of text generation
async function generateTextImpl(params, input, post = '', variables = {}, sample_messages = []) {

    // Process input string for variable replacements if it contains $variables
    input = replaceVariables(input, variables);

    // Process system_prompt for variable replacements
    const system_prompt = replaceVariables(params.system_prompt, variables);

    let response;

    // Send message to API
    if (params.textAPItype == 'openai') {
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
        if (post) {
            messages.push({
                "role": "assistant",
                "content": post
            });
        }
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
    } else if (params.textAPItype == 'completion') { // default to koboldcpp
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
    } else {
        const processedPrompt = replaceVariables(params.text_prompt, {
            ...variables,
            system_prompt: system_prompt,
            input_string: input,
            response_string: post
        });
        const url = "https://aihorde.net/api/v2/generate/text/async";
        const apiKey = "aqaGvzHTwL2WsfkaGh8UPg"; // Replace with your actual API key
        const options = {
            method: "POST",
            headers: {
                "apikey": apiKey, // Your API key
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: processedPrompt, // The text prompt
                params: {
                    max_length: 300, // Max tokens to generate
                    temperature: params.temperature,
                    top_p: params.top_p,
                    n: 1,
                    },
                models: ["koboldcpp/Meta-Llama-3-8B-Instruct"] // Optional: specify a model
            })
        };

        try {
            // Submit the generation request
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const taskData = await response.json();
            console.log("Task submitted:", taskData);

            // Poll for the result
            const taskId = taskData.id;
            await pollTextStatus(taskId, apiKey);
        } catch (error) {
            console.error("Error:", error);
        }

    }

    const data = await response.json();

    if (params.textAPItype == 'openai') {
        if (data.choices)
            return data.choices[0].message.content;
        else
            return '';
    } else {
        if(data.results)
            return data.results[0].text;
        else
            return '';
    }
}

// Polling function for text generation status
async function pollTextStatus(taskId, apiKey) {
    const statusUrl = `https://aihorde.net/api/v2/generate/text/status/${taskId}`;
    const options = {
        headers: {
            "apikey": apiKey
        }
    };

    let completed = false;
    while (!completed) {
        const response = await fetch(statusUrl, options);
        const statusData = await response.json();

        if (statusData.done) {
            console.log("Generated text:", statusData.generations[0].text);
            completed = true;
        } else if (statusData.faulted) {
            throw new Error("Text generation failed");
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
}

async function generateArt(prompt, negprompt = '', seed = -1) {
    return new Promise((resolve, reject) => {
        artRequestQueue.push({ prompt, negprompt, seed, resolve, reject });
        // Only try to process art queue if we're not processing text, or if concurrent_art is true
        if (!isProcessingText || settings.concurrent_art) {
            processArtQueue();
        }
    });
}

// Implementation of the art generation
async function generateArtImpl(prompt, negprompt = '', seed = -1) {
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
                "width": parseInt(settings.sd_width),
                "height": parseInt(settings.sd_height),
                "steps": parseInt(settings.steps),
                "seed": sum + Math.floor(Math.random() * settings.seed_variation),
                "cfg_scale": parseFloat(settings.cfg_scale),
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

async function send_task_to_dream_api(style_id = 0, prompt, negprompt = '', seed = -1) {
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

    return webpBlob;
}

async function generateTikTokTTS(text, voice) {
    const sessionId = '94f80631579b6e945f4e648bed5a439f';
    const userAgent = 'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)';
    const ttsEndpoint = 'https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/invoke/';
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';

    try {
        const payload = {
            text_speaker: voice,
            req_text: text,
            speaker_map_type: 0,
            aid: 1233
        };

        const response = await fetch(corsProxy + ttsEndpoint, {
            method: 'POST',
            headers: {
                'User-Agent': userAgent,
                'Cookie': `sessionid=${sessionId}`,
                'Accept-Encoding': 'gzip,deflate,compress',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.status_code !== 0) {
            throw new Error(`API error! Status: ${responseData.status_code}, Message: ${responseData.status_msg}`);
        }

        const audioData = await response.arrayBuffer();
        const blob = new Blob([audioData], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audio.onerror = (e) => {
            console.error('Audio playback error:', e);
        };

        audio.oncanplaythrough = () => {
            console.log('Audio can play through without interruption.');
        };

        audio.onloadeddata = () => {
            console.log('Audio data loaded.');
        };

        audio.onstalled = () => {
            console.error('Audio playback stalled.');
        };

        return audio;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function generateKoboldTTS(text, voice) {
    const apiUrl    = settings.tts_api;
    const voiceName = voice ? voice : 'cheery';

    const requestBody = {
        voice: voiceName,
        input: text
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    } else {
        const audioBlob = await response.blob();
        const audioUrl  = URL.createObjectURL(audioBlob);
        const audio     = new Audio(audioUrl);
        return audio;
    }
}

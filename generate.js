// Remove all requires since we'll use nodeBridge

// Verify bridge availability immediately
(function verifyBridge() {
    console.log('Checking bridge availability...');
    if (!window.nodeBridge) {
        console.error('nodeBridge is not available!');
        document.getElementById('loader').classList.add('hidden');
        throw new Error('Electron bridge not initialized');
    }
    console.log('Bridge check complete, bridge is available');
})();

async function generateText(params, input, post='', variables={}, sample_messages=[]) {
    try {
        document.getElementById('loader').classList.remove('hidden');
        console.log('Starting text generation with params:', { params, input, post, variables });

        // Process input string for variable replacements
        input = replaceVariables(input, variables);
        const system_prompt = replaceVariables(params.system_prompt, variables);

        let response;
        console.log('Processed inputs:', { input, system_prompt });

        if(params.textAPItype == 'openai') {
            const messages = [
                {
                    "role": "system",
                    "content": system_prompt
                }
            ];
        
            if (sample_messages.length > 0) {
                messages.push(...sample_messages);
            }
        
            messages.push({
                "role": "user",
                "content": input
            });

            console.log('OpenAI request payload:', {
                model: params.model,
                messages: messages,
                max_completion_tokens: params.max_length,
                temperature: params.temperature
            });

            try {
                response = await window.nodeBridge.fetch(params.textAPI + 'chat/completions', {
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
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API error response:', errorData);
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
        } else {
            const processedPrompt = replaceVariables(params.text_prompt, {
                ...variables,
                system_prompt: system_prompt,
                input_string: input,
                response_string: post
            });

            console.log('KoboldCPP request:', processedPrompt);
            response = await window.nodeBridge.fetch(params.textAPI + 'generate', {
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

            if (!response.ok) {
                const errorData = await response.json();
                console.error('KoboldCPP API error:', errorData);
                throw new Error(`KoboldCPP API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
        }

        const data = await response.json();
        console.log('API response data:', data);

        let result;
        if(params.textAPItype == 'openai') {
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No text completion received from OpenAI');
            }
            result = data.choices[0].message.content;
        } else {
            if (!data.results || data.results.length === 0) {
                throw new Error('No text completion received from KoboldCPP');
            }
            result = data.results[0].text;
        }

        return result;
    } catch (error) {
        console.error('Error in generateText:', error);
        if (window.nodeBridge) {
            window.nodeBridge.sendError(error);
        }
        throw error;
    } finally {
        // Ensure loader is always hidden
        document.getElementById('loader').classList.add('hidden');
        console.log('Text generation completed');
    }
}

async function generateArt(prompt, negprompt='', seed=-1) {
    document.getElementById('loader').classList.remove('hidden');

    let sum = 0;
    if (typeof seed == "string") {
        for (let i = 0; i < seed.length; i++)
            sum *= seed.charCodeAt(i);
    } else {
        sum = seed;
    }

    try {
        if (settings.sdAPI == '') {
            const imageBase64 = await send_task_to_dream_api(16, prompt);
            if (!imageBase64) {
                throw new Error('No image data received from API');
            }
            return await base64ToWebP(imageBase64);
        } else {
            const response = await window.nodeBridge.fetch(settings.sdAPI, {
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

            if (!response.ok) {
                throw new Error(`Stable Diffusion API error: ${response.status}`);
            }

            const data = await response.json();
            if (!data.images || !data.images[0]) {
                throw new Error('No image data in Stable Diffusion API response');
            }

            const imageBase64 = data.images[0];
            return await base64ToWebP(imageBase64);
        }
    } catch (error) {
        console.error('Error generating art:', error);
        document.getElementById('loader').classList.add('hidden');
        // Return placeholder but also show error to user
        const errorMessage = `Failed to generate image: ${error.message}`;
        console.error(errorMessage);
        if (window.nodeBridge) {
            window.nodeBridge.send('toMain', { type: 'error', message: errorMessage });
        }
        return 'placeholder';
    } finally {
        // Ensure loader is hidden even if there's an error in base64ToWebP
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 100);
    }
}

async function send_task_to_dream_api(style_id = 0, prompt, negprompt='', seed=-1) {
    const post_payload = { "use_target_image": false };
    const BASE_URL = 'https://api.luan.tools/api/tasks/';
    const headers = {
        'Authorization': `Bearer qVo2UrCJ5ofXlbq6ewa7WqNrCgu0wkfx`,
        'Content-Type': 'application/json'
    };

    try {
        // Step 1: Create task
        const response = await window.nodeBridge.fetch(BASE_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(post_payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create task:', errorData);
            throw new Error(`Failed to create task: ${response.status}`);
        }
        
        const taskData = await response.json();
        if (!taskData || !taskData.id) {
            throw new Error('Invalid task data received');
        }

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
        
        const putResponse = await window.nodeBridge.fetch(task_url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(put_payload)
        });
        
        if (!putResponse.ok) {
            const errorData = await putResponse.json();
            console.error('Failed to configure task:', errorData);
            throw new Error(`Failed to configure task: ${putResponse.status}`);
        }

        // Step 3: Poll for results
        let attempts = 0;
        const maxAttempts = 30; // 2 minutes maximum waiting time
        
        while (attempts < maxAttempts) {
            const statusResponse = await window.nodeBridge.fetch(task_url, { headers });
            if (!statusResponse.ok) {
                console.error('Status check failed:', statusResponse.status);
                throw new Error('Failed to check status');
            }
            
            const statusData = await statusResponse.json();
            console.log('Status response:', statusData);
            
            if (statusData.state === 'failed') {
                throw new Error(statusData.error || 'Image generation failed');
            } else if (statusData.state === 'completed' && statusData.result) {
                try {
                    const imageResponse = await window.nodeBridge.fetch(statusData.result);
                    if (!imageResponse.ok) {
                        throw new Error('Failed to fetch generated image');
                    }
                    
                    // Use the arrayBuffer method from our nodeBridge response
                    const buffer = await imageResponse.arrayBuffer();
                    return window.nodeBridge.bufferToString(
                        window.nodeBridge.bufferFrom(buffer),
                        'base64'
                    );
                } catch (error) {
                    console.error('Error processing completed image:', error);
                    throw error;
                }
            }
            
            attempts++;
            await new Promise(res => setTimeout(res, 4000));
        }
        
        throw new Error('Timeout waiting for image generation');
    } catch (error) {
        console.error('Error in dream API:', error);
        document.getElementById('loader').classList.add('hidden');
        throw error;
    }
}

async function base64ToWebP(imageBase64) {
    try {
        // Convert base64 to buffer
        const buffer = window.nodeBridge.bufferFrom(imageBase64, 'base64');
        const blob = window.nodeBridge.createBlob([buffer], { type: 'image/png' });

        // Converting PNG to WebP for file size reduction
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Unable to obtain 2D rendering context.");
        }

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const webpBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to convert to WebP format."));
                    }
                },
                "image/webp",
                0.6
            );
        });

        document.getElementById('loader').classList.add('hidden');
        return webpBlob;
    } catch (error) {
        console.error('Error converting to WebP:', error);
        document.getElementById('loader').classList.add('hidden');
        throw error;
    }
}
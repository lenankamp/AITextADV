const { contextBridge, ipcRenderer } = require('electron');
const fetch = require('node-fetch');
const { Buffer } = require('buffer');

// Create our own logging function to avoid recursion
function log(level, ...args) {
    const formattedMessage = args
        .map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
        .join(' ');
    process.stdout.write(`[Preload ${level}] ${formattedMessage}\n`);
}

// Early error catching
process.on('uncaughtException', (error) => {
    log('ERROR', 'Preload uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
    log('ERROR', 'Preload unhandled rejection:', error);
});

// Validate required modules
if (!fetch) log('ERROR', 'node-fetch module not available');
if (!Buffer) log('ERROR', 'buffer module not available');

// Setup electron compatibility
const electronRequire = require;
if (window) {
    window.nodeRequire = electronRequire;
}

// Verify bridge setup
const bridgeTest = () => {
    log('INFO', 'Bridge setup verification starting...');
    try {
        // Test buffer operations
        const testBuffer = Buffer.from('test');
        log('INFO', 'Buffer operations available');
        
        // Test fetch availability
        if (typeof fetch === 'function') {
            log('INFO', 'Fetch is available');
        } else {
            throw new Error('Fetch is not available');
        }
        
        log('INFO', 'Bridge setup verification complete');
    } catch (error) {
        log('ERROR', 'Bridge setup verification failed:', error);
    }
};

// Setup API bridge between Node.js and renderer
contextBridge.exposeInMainWorld('nodeBridge', {
    // Buffer operations
    bufferFrom: (data, encoding) => Buffer.from(data, encoding),
    bufferToString: (buffer, encoding) => buffer.toString(encoding),
    
    // Fetch API with enhanced error handling and logging
    fetch: async (url, options = {}) => {
        console.log('Making fetch request:', { 
            url, 
            method: options.method,
            headers: options.headers,
            bodyPreview: options.body ? options.body.slice(0, 500) + '...' : undefined
        });
        
        try {
            const response = await fetch(url, options);
            console.log('Fetch response status:', {
                url,
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers)
            });

            // Clone the response so we can read it multiple times if needed
            const responseClone = response.clone();

            if (!response.ok) {
                let errorText;
                try {
                    errorText = await responseClone.text();
                    let errorJson;
                    try {
                        errorJson = JSON.parse(errorText);
                        console.error('Error response JSON:', errorJson);
                    } catch (e) {
                        console.error('Error response text:', errorText);
                    }
                } catch (e) {
                    console.error('Could not read error response:', e);
                }

                const error = new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
                error.response = response;
                error.responseText = errorText;
                throw error;
            }

            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers),
                json: async () => {
                    try {
                        const data = await response.json();
                        console.log('Response JSON preview:', 
                            JSON.stringify(data).slice(0, 500) + '...'
                        );
                        return data;
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        throw new Error(`Failed to parse JSON response: ${error.message}`);
                    }
                },
                text: async () => {
                    try {
                        const text = await response.text();
                        console.log('Response text length:', text.length);
                        return text;
                    } catch (error) {
                        console.error('Error reading text:', error);
                        throw error;
                    }
                },
                blob: async () => {
                    try {
                        const blob = await response.blob();
                        console.log('Response blob size:', blob.size);
                        return blob;
                    } catch (error) {
                        console.error('Error reading blob:', error);
                        throw error;
                    }
                },
                arrayBuffer: async () => {
                    try {
                        const buffer = await response.arrayBuffer();
                        console.log('Response arrayBuffer length:', buffer.byteLength);
                        return buffer;
                    } catch (error) {
                        console.error('Error reading arrayBuffer:', error);
                        throw error;
                    }
                }
            };
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            // Ensure error is serializable
            const serializedError = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
            // Send detailed error to main process
            ipcRenderer.send('toMain', { 
                type: 'error', 
                message: `Network error (${url}): ${error.message}`,
                details: JSON.stringify(serializedError, null, 2)
            });
            throw error;
        }
    },

    // Blob operations
    createBlob: (parts, options) => new Blob(parts, options),

    // Error handling
    sendError: (error) => {
        console.error('Sending error to main process:', error);
        ipcRenderer.send('toMain', { 
            type: 'error', 
            message: error.message || String(error)
        });
    },

    // Electron compatibility layer
    electronRequire: electronRequire
});

// Run bridge verification after setup
bridgeTest();

// IPC communication
contextBridge.exposeInMainWorld('ipc', {
    send: (channel, data) => {
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Store the wrapper function so we can remove it later
            const wrapper = (event, ...args) => func(...args);
            ipcRenderer.on(channel, wrapper);
            // Return cleanup function
            return () => {
                ipcRenderer.removeListener(channel, wrapper);
            };
        }
    }
});

// Cleanup function for the window
window.addEventListener('unload', () => {
    // Remove all IPC listeners
    ipcRenderer.removeAllListeners('fromMain');
    ipcRenderer.removeAllListeners('toMain');
    
    // Log cleanup
    log('INFO', 'Cleaned up IPC listeners on window unload');
});
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
    // Fetch implementation with proper error handling
    fetch: async (url, options = {}) => {
        try {
            const response = await fetch(url, options);
            // Create a response-like object that can be used in the renderer
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                json: async () => await response.json(),
                text: async () => await response.text(),
                arrayBuffer: async () => await response.arrayBuffer()
            };
        } catch (error) {
            console.error('Fetch error:', error);
            throw new Error(`Fetch failed: ${error.message}`);
        }
    },

    // Buffer utilities
    bufferFrom: (data, encoding) => {
        return Buffer.from(data, encoding);
    },
    bufferToString: (buffer, encoding) => {
        return buffer.toString(encoding);
    },

    // Blob creation utility
    createBlob: (parts, options) => {
        return new Blob(parts, options);
    },

    // Error reporting to main process
    sendError: (error) => {
        ipcRenderer.send('toMain', {
            type: 'error',
            message: error.message,
            details: error.stack
        });
    },

    // Handle messages from main process
    onMessage: (callback) => {
        ipcRenderer.on('fromMain', (event, ...args) => callback(...args));
    }
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
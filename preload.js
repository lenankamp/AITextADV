const { contextBridge, ipcRenderer } = require('electron');
const fetch = require('node-fetch');
const { Buffer } = require('buffer');

// Setup electron compatibility
const electronRequire = require;
if (window) {
    window.nodeRequire = electronRequire;
}

// Setup API bridge between Node.js and renderer
contextBridge.exposeInMainWorld('nodeBridge', {
    // Buffer operations
    bufferFrom: (data, encoding) => Buffer.from(data, encoding),
    bufferToString: (buffer, encoding) => buffer.toString(encoding),
    
    // Fetch API with error handling
    fetch: async (url, options) => {
        try {
            const response = await fetch(url, options);
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers),
                json: async () => {
                    try {
                        return await response.json();
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        throw error;
                    }
                },
                text: async () => await response.text(),
                blob: async () => await response.blob(),
                arrayBuffer: async () => await response.arrayBuffer()
            };
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            throw error;
        }
    },

    // Blob operations
    createBlob: (parts, options) => new Blob(parts, options),

    // Error handling
    sendError: (error) => {
        ipcRenderer.send('toMain', { 
            type: 'error', 
            message: error.message || String(error)
        });
    },

    // Electron compatibility layer
    electronRequire: electronRequire
});

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
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeListener: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeListener(channel, func);
        }
    }
});
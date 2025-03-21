const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const securityConfig = require('./security-config')

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Enable live reload for development only
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  })
}

// Increase max listeners limit for WebContents
require('events').EventEmitter.defaultMaxListeners = 30;

// Store original console methods
const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console)
}

// Helper to safely stringify objects/arrays
function safeStringify(obj) {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Error) {
        return {
          // Pull all enumerable properties
          ...value,
          // Pull all non-enumerable properties
          name: value.name,
          message: value.message,
          stack: value.stack
        }
      }
      return value
    }, 2)
  } catch (err) {
    return String(obj)
  }
}

// Format log arguments
function formatLogArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'string') return arg
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    return safeStringify(arg)
  }).join(' ')
}

// Create global console log capture that uses original methods
function logToFile(level, ...args) {
  const formattedArgs = formatLogArgs(args)
  originalConsole[level](formattedArgs)
  
  if (global.mainWindow && global.mainWindow.webContents) {
    const script = `console.${level}(${JSON.stringify(formattedArgs)})`
    global.mainWindow.webContents.executeJavaScript(script)
      .catch(err => originalConsole.error('Failed to log to renderer:', err))
  }
}

// Override console methods to capture all output
console.log = (...args) => logToFile('log', ...args)
console.error = (...args) => logToFile('error', ...args)
console.warn = (...args) => logToFile('warn', ...args)
console.info = (...args) => logToFile('info', ...args)

function createWindow () {
  // Configure session security
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        ...securityConfig.cspHeader
      }
    })
  })

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Store window reference globally
  mainWindow.setMenuBarVisibility(false);
  global.mainWindow = mainWindow
  // Track active listeners for cleanup
  const activeListeners = new Set();

  // Helper to safely add listeners with tracking
  const addTrackedListener = (target, event, handler) => {
    // Remove any existing listeners for this event to prevent duplicates
    if (target.listenerCount && typeof target.listenerCount === 'function') {
      const existingCount = target.listenerCount(event);
      if (existingCount > 0) {
        console.log(`Removing ${existingCount} existing ${event} listeners`);
        target.removeAllListeners(event);
      }
    }
    target.on(event, handler);
    activeListeners.add({ target, event, handler });
  };

  // Clean up listeners when window is closed
  mainWindow.on('closed', () => {
    if (mainWindow.webContents) {
      // Clean up all tracked listeners
      for (const listener of activeListeners) {
        try {
          listener.target.removeListener(listener.event, listener.handler);
        } catch (err) {
          console.error(`Failed to remove listener ${listener.event}:`, err);
        }
      }
      activeListeners.clear();

      // Reset request handlers
      try {
        mainWindow.webContents.session.webRequest.onBeforeRequest(null);
        mainWindow.webContents.session.webRequest.onCompleted(null);
        mainWindow.webContents.session.webRequest.onHeadersReceived(null);
      } catch (err) {
        console.error('Failed to reset request handlers:', err);
      }
    }
    global.mainWindow = null;
  });

  // Debug logging for all requests with tracked listener (dev only)
  if (isDev) {
    const requestHandler = (details, callback) => {
      console.log('Request:', {
        url: details.url,
        method: details.method,
        resourceType: details.resourceType
      });
      callback({ cancel: false });
    };
    mainWindow.webContents.session.webRequest.onBeforeRequest(requestHandler);

    // Debug logging for responses with tracked listener
    const responseHandler = (details) => {
      console.log('Response:', {
        url: details.url,
        statusCode: details.statusCode,
        statusLine: details.statusLine
      });
    };
    mainWindow.webContents.session.webRequest.onCompleted(responseHandler);
  }

  // Capture renderer console messages with tracked listener
  const consoleHandler = (event, level, message, line, sourceId) => {
    if (message.startsWith('[LOG]:') || 
        message.startsWith('[ERROR]:') || 
        message.startsWith('[WARN]:') || 
        message.startsWith('[INFO]:')) {
      return;
    }
    
    const levels = ['debug', 'info', 'warn', 'error'];
    originalConsole[levels[level] || 'log'](`[Renderer] ${message}`);
  };
  addTrackedListener(mainWindow.webContents, 'console-message', consoleHandler);

  // Navigation security with tracked listener
  const navigationHandler = (event, url) => {
    if (!securityConfig.validateNavigation(url)) {
      event.preventDefault();
      console.warn(`Navigation to ${url} was blocked`);
    }
  };
  addTrackedListener(mainWindow.webContents, 'will-navigate', navigationHandler);

  // Add explicit handling for did-stop-loading
  const loadHandler = () => {
    console.log('Page finished loading');
  };
  addTrackedListener(mainWindow.webContents, 'did-stop-loading', loadHandler);

  // Enable DevTools in development only
  if (isDev) {
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.openDevTools();
      console.log('DevTools opened automatically');
    });
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.loadFile('index.html');

  return mainWindow;
}

// Handle Electron activation
app.whenReady().then(() => {
  const mainWindow = createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // IPC error handling with more detailed logging
  ipcMain.on('toMain', (event, data) => {
    console.log('IPC message received:', data);
    
    if (data.type === 'error') {
      console.error('Error from renderer:', {
        message: data.message,
        details: data.details || 'No additional details'
      });
      
      // Send error back to be displayed
      event.reply('fromMain', { 
        type: 'error',
        message: data.message,
        details: data.details
      });

      // Show error in DevTools
      mainWindow.webContents.openDevTools();
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Handle uncaught exceptions with more detail
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  if (error.stack) {
    console.error('Stack trace:', error.stack)
  }
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  if (error.stack) {
    console.error('Stack trace:', error.stack)
  }
})
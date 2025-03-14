const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const securityConfig = require('./security-config')

// Enable live reload for development
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
})

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
      nodeIntegration: false, // This must be false for security
      contextIsolation: true, // Protect against prototype pollution
      enableRemoteModule: false, // Disable remote module
      sandbox: false, // Required for preload script to work properly
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Enable DevTools in development
  mainWindow.webContents.openDevTools()

  // Handle navigation security
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!securityConfig.validateNavigation(url)) {
      event.preventDefault()
      console.warn(`Navigation to ${url} was blocked`)
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      require('electron').shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Debug logging for all requests
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    console.log('Request:', {
      url: details.url,
      method: details.method,
      resourceType: details.resourceType
    })
    callback({ cancel: false })
  })

  // Debug logging for responses
  mainWindow.webContents.session.webRequest.onCompleted((details) => {
    console.log('Response:', {
      url: details.url,
      statusCode: details.statusCode,
      statusLine: details.statusLine
    })
  })

  mainWindow.loadFile('index.html')

  // Handle renderer process errors
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed')
  })

  return mainWindow
}

// Handle Electron activation
app.whenReady().then(() => {
  const mainWindow = createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // IPC error handling
  ipcMain.on('toMain', (event, data) => {
    console.log('IPC message received:', data)
    
    if (data.type === 'error') {
      console.error('Error from renderer:', data.message)
      // Send error back to be displayed
      event.reply('fromMain', { 
        type: 'error',
        message: data.message 
      })
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})
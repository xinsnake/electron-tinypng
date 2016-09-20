const {app, BrowserWindow, ipcMain} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 800, height: 600, resizable: true})

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    // remove menu
    // win.setMenu(null)

    // Open the DevTools.
    win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const fs = require('fs')
const path = require('path')
let configDir = app.getPath('userData')
let settingsFile = configDir + path.sep + 'config.json'
const defaultConfig = { apiKey: '', numComp: 2 }
let tinify = require("tinify")

validateApiKeySendCount = (event, key) => {
    tinify.key = key

    tinify.validate((err) => {
        if (err) {
            event.sender.send('async-count-update', {
                success: false,
                data: err
            })
            return
        }

        event.sender.send('async-count-update', {
            success: true,
            data: tinify.compressionCount
        })
    })
}

ipcMain.on('async-load-settings', (event, arg) => {
    fs.open(settingsFile, 'wx', (err, fd) => {
        try {
            if (err) {
                if (err.code === 'EEXIST') {
                    fs.readFile(settingsFile, (err, data) => {
                        if (err) { throw err }

                        let config = JSON.parse(data)

                        event.sender.send('async-load-settings-reply', {
                            success: true,
                            data: config
                        })

                        if (config.apiKey.length > 10) {
                            validateApiKeySendCount(event, config.apiKey)
                        }
                    })
                    return
                } else {
                    throw err
                }
            }

            fs.writeFile(fd, JSON.stringify(defaultConfig), (err) => {
                if (err) { throw err }

                event.sender.send('async-load-settings-reply', {
                    success: true,
                    data: defaultConfig
                })
            })
        } catch (e) {
            event.sender.send('async-load-settings-reply', {
                success: false,
                data: e
            })
        }
    })
})

ipcMain.on('async-save-settings', (event, arg) => {
    fs.open(settingsFile, 'w+', (err, fd) => {
        try {
            if (err) { throw err }

            fs.writeFile(fd, JSON.stringify(arg), (err) => {
                if (err) { throw err }
            })

            if (typeof arg.apiKey === 'string' && arg.apiKey.length > 10) {
                validateApiKeySendCount(event, arg.apiKey)
            }

            event.sender.send('async-save-settings-reply', {
                success: true,
                data: null
            })
        } catch (e) {
            event.sender.send('async-save-settings-reply', {
                success: false,
                data: e
            })
        }
    })
})


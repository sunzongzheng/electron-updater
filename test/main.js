import autoUpdater from '../src/app'
import {app, BrowserWindow} from 'electron'

let mainWindow
const update = autoUpdater({
    type: 'github',
    options: {
        username: 'sunzongzheng',
        repo: 'electron-updater',
        log: true
    }
})

function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 600})
    mainWindow.loadURL(`file://${__dirname}/index.html?version=${app.getVersion()}`)
    mainWindow.webContents.openDevTools()
    mainWindow.on('closed', function () {
        mainWindow = null
    })

    setTimeout(() => {
        update.on('checking-for-update', () => {
            mainWindow.webContents.send('checking-for-update')
        })
        update.on('update-available', () => {
            mainWindow.webContents.send('update-available')
        })
        update.on('update-not-available', () => {
            mainWindow.webContents.send('update-not-available')
        })
        update.on('download-progress', (percent) => {
            mainWindow.webContents.send('download-progress', `${percent}%`)
        })
        update.on('error', (e) => {
            mainWindow.webContents.send('error', e)
        })
        update.on('log', (log) => {
            mainWindow.webContents.send('log', log)
        })
        update.checkForUpdatesAndNotify()
    }, 1000)
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

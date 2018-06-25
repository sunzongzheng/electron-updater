import autoUpdater from '../dist/app'
import {app, BrowserWindow} from 'electron'

let mainWindow

/* test github */
const update = autoUpdater({
    type: 'github',
    options: {
        username: 'sunzongzheng',
        repo: 'electron-updater',
        log: true
    }
})

/* test custom with url */
// const update = autoUpdater({
//     type: 'custom',
//     options: {
//         url: 'https://gist.githubusercontent.com/sunzongzheng/049eb84dbc3f0a63016bb36193a46df3/raw/',
//         log: true
//     }
// })

/* test custom with getRemoteLatest */
// const update = autoUpdater({
//     type: 'custom',
//     options: {
//         getRemoteLatest() {
//             return new Promise((resolve) => {
//                 this.latestRelease.linux = ''
//                 this.latestRelease.osx = 'https://store.zzsun.cc/electron-updater-1.0.0-mac.zip'
//                 this.latestRelease.windows = 'https://store.zzsun.cc/electron-updater.Setup.1.0.0.exe'
//                 this.emit('log', this.latestRelease)
//                 resolve(100000000)
//             })
//         },
//         log: true
//     }
// })

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

# electron-updater

## feature
- same api like [electron-userland/electron-builder](https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater)
- do not need code siging for mac
- only surpport github release now
- linux is not supported now
- node >= 8

## usage
````js
import autoUpdater from '@suen/electron-updater'

const update = autoUpdater({
    type: 'github',
    options: {
        username: 'sunzongzheng',
        repo: 'electron-updater',
        log: true
    }
})
update.checkForUpdatesAndNotify()
````

## event
- checking-for-update
- update-available
- update-not-available
- download-progress
- error
- log

example:
````js
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
````
import {ipcRenderer} from 'electron'
import url from 'url'

document.getElementById('version').innerHTML = url.parse(window.location.href, true).query.version
const message = document.getElementById('message')
const progress = document.getElementById('progress')
const log = document.getElementById('log')
const err = document.getElementById('err')
ipcRenderer.on('checking-for-update', () => {
    message.innerHTML += ('<p>checking-for-update</p>')
})
ipcRenderer.on('update-available', () => {
    message.innerHTML += `<p>update-available</p>`
})
ipcRenderer.on('update-not-available', () => {
    message.innerHTML += `<p>update-not-available</p>`
})
ipcRenderer.on('download-progress', (event, percent) => {
    progress.innerHTML = `<p>Download progress: ${percent}</p>`
})
ipcRenderer.on('error', (event, e) => {
    err.innerHTML += `<p>Error: ${JSON.stringify(e)}</p>`
})
ipcRenderer.on('log', (event, params) => {
    log.innerHTML += `<p>Log: ${JSON.stringify(params)}</p>`
})
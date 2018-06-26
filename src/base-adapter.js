import https from 'https'
import {URL} from 'url'
import fs from 'fs'
import path from 'path'
import {app, dialog} from 'electron'
import {exec, spawn, execSync} from 'child_process'
import os from 'os'

export default class {
    log = false
    latestRelease = {
        osx: '',
        linux: '',
        windows: ''
    }
    latestVersion = ''
    feedUrl = ''

    constructor(options) {
        const {
            log = false,
            updateAvailableCallback = this.updateAvailableCallback,
            downloadFinishedCallback = this.downloadFinishedCallback,
            getRemoteLatest = this.getRemoteLatest
        } = options
        this.log = log
        this.updateAvailableCallback = updateAvailableCallback
        this.downloadFinishedCallback = downloadFinishedCallback
        this.getRemoteLatest = getRemoteLatest
    }

    setFeedUrl(url) {
        this.feedUrl = url
    }

    async checkForUpdatesAndNotify() {
        this.emit('checking-for-update')
        try {
            if (await this.checkUpdate()) {
                this.emit('update-available')
                this.updateAvailableCallback()
            } else {
                this.emit('update-not-available')
            }
        } catch (e) {
            this.emit('error', e)
        }
    }

    async checkUpdate() {
        try {
            const latestVersion = await this.getRemoteLatest()
            const localVersion = this.parseVersionNum(app.getVersion())
            this.emit('log', {latestVersion, localVersion})
            return latestVersion > localVersion
        } catch (e) {
            return Promise.reject(e)
        }
    }

    getRemoteLatest() {
        this.emit('log', 'getRemoteLatest')
        this.emit('log', `feedurl: ${this.feedUrl}`)
        return new Promise((resolve, reject) => {
            const url = new URL(this.feedUrl)
            https.get({
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36'
                }
            }, (res) => {
                if (res.statusCode >= 400) {
                    return reject('Cannot get latest version, please check the feed url.')
                }
                let data = ''
                res.on('data', (chunk) => {
                    data += chunk
                })
                res.on('end', () => {
                    const {version, linux, osx, windows} = JSON.parse(data)
                    if (version) {
                        this.latestVersion = version
                        this.latestRelease.linux = linux
                        this.latestRelease.osx = osx
                        this.latestRelease.windows = windows
                        this.emit('log', this.latestRelease)
                        resolve(this.parseVersionNum(version))
                    } else {
                        reject('Cannot get latest version, please check the feed url.')
                    }
                })
            }).on("error", (err) => {
                reject(err)
            })
        })
    }

    parseVersionNum(versionStr) {
        return versionStr.split('.').map(i => parseInt(i)).reduce((a, b, i) => a * 1000 + b)
    }

    updateAvailableCallback() {
        dialog.showMessageBox({
            type: 'info',
            title: '更新提醒',
            buttons: ['下载', '取消'],
            message: '检测到可用更新，立即下载？'
        }, (res) => {
            if (res === 0) {
                this.download()
            }
        })
    }

    getDownloadUrl() {
        switch (process.platform) {
            case 'darwin':
                return this.latestRelease.osx
            case 'win32':
                return this.latestRelease.windows
            default:
                return this.latestRelease.linux
        }
    }

    async download() {
        this.updatePath = path.join(
            os.tmpdir(),
            `${app.getName()}_${this.latestVersion}.` + ({
                osx: 'zip',
                windows: 'exe'
            }[process.platform] || 'AppImage')
        )
        const file = fs.createWriteStream(this.updatePath)
        let downloadUrl
        try {
            downloadUrl = await this.getDownloadUrl()
        } catch (e) {
            this.emit('error', e)
            console.error(e)
            return dialog.showMessageBox({
                type: 'info',
                title: '下载提醒',
                message: '下载失败，无法获取当前平台程序的下载地址',
            })
        }
        try {
            const url = new URL(downloadUrl)
            https.get({
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                rejectUnauthorized: false
            }, (res) => {
                const len = res.headers['content-length']
                let downloaded = 0

                res.pipe(file)
                res.on('data', (chunk) => {
                    downloaded += chunk.length
                    this.emit('download-progress', parseInt(downloaded * 100 / len))
                })
                file.on('finish', () => {
                    file.close()
                    this.emit('log', `download success ${this.updatePath}`)
                    this.downloadFinishedCallback()
                })
            }).on('error', (err) => {
                this.emit('error', err)
                return Promise.reject(err)
            })
        } catch (e) {
            this.emit('error', e)
            console.error(e)
            dialog.showMessageBox({
                type: 'info',
                title: '下载提醒',
                message: '下载失败，请检查网络连接或稍后再试',
            })
        }
    }

    downloadFinishedCallback() {
        dialog.showMessageBox({
            type: 'info',
            title: '下载提醒',
            message: '下载已完成，立即重启更新？',
            buttons: ['重启', '取消']
        }, (res) => {
            if (res === 0) {
                this.quitAndInstall()
            }
        })
    }

    quitAndInstall() {
        switch (process.platform) {
            case 'darwin' :
                const unzip = exec(`unzip -o '${this.updatePath}' -d '/Applications/'`, {encoding: 'binary'})
                unzip.on('exit', () => {
                    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
                    app.exit(0)
                })
                break
            case 'win32':
                const args = ["--updated"]
                args.push("/S")

                args.push("--force-run")

                const spawnOptions = {
                    detached: true,
                    stdio: "ignore",
                }

                try {
                    spawn(this.updatePath, args, spawnOptions)
                        .unref()
                }
                catch (e) {
                    this.emit('error', e)
                    console.warn(e)
                }

                app.exit(0)
                break
            default:
                fs.chmodSync(this.updatePath, 0o755)
                const appImageFile = process.env.APPIMAGE
                if (appImageFile == null) {
                    this.emit('error', "APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND")
                }

                // https://stackoverflow.com/a/1712051/1910191
                fs.unlinkSync(appImageFile)

                let destination
                if (path.basename(this.updatePath) === path.basename(appImageFile)) {
                    // no version in the file name, overwrite existing
                    destination = appImageFile
                }
                else {
                    destination = path.join(path.dirname(appImageFile), path.basename(this.updatePath))
                }

                execSync(`mv -f ${this.updatePath} ${destination}`)

                app.relaunch({
                    args: process.argv.slice(1).concat(['--relaunch']),
                    execPath: destination
                })
                app.exit(0)
                break
        }
    }

    on(event, cb) {
        this[`${event}_cb`] = cb
    }

    emit(event, params) {
        if (event === 'log' && !this.log) return
        const callback = this[`${event}_cb`]
        typeof callback === 'function' && callback(params)
    }
}
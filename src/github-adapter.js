import baseAdapter from './base-adapter'
import https from 'https'
import {URL} from 'url'
import path from 'path'
import os from 'os'
import {app} from 'electron'

export default class extends baseAdapter {
    constructor(options) {
        super(options)
        if (!options.username) throw new Error('Can not find github username')
        if (!options.repo) throw new Error('Can not find github repo name')
        this.setFeedUrl(`https://api.github.com/repos/${options.username}/${options.repo}/releases/latest`)
    }

    getDownloadUrl() {
        return new Promise((resolve, reeject) => {
            let url
            switch (process.platform) {
                case 'darwin':
                    url = this.latestRelease.osx
                    break
                case 'win32':
                    url = this.latestRelease.windows
                    break
                default:
                    url = this.latestRelease.linux
                    break
            }
            if (!url) {
                reeject('There is not a available release downloadUrl')
            }
            https.get(url, (res) => {
                resolve(res.headers.location)
            }).on('error', (err) => {
                reeject(err)
            })
        })
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
                    const versionInfo = JSON.parse(data)
                    versionInfo.assets.forEach(item => {
                        switch (item.content_type) {
                            case 'application/x-debian-package':
                                this.latestRelease.linux = item.browser_download_url
                                break
                            case 'application/zip':
                                this.latestRelease.osx = item.browser_download_url
                                break
                            case 'application/x-msdos-program':
                            case 'application/x-msdownload':
                                this.latestRelease.windows = item.browser_download_url
                                break
                        }
                    })
                    this.emit('log', this.latestRelease)
                    if (versionInfo.tag_name) {
                        this.updatePath = path.join(os.tmpdir(), `${app.getName()}_v${versionInfo.tag_name}_${+new Date()}.zip`)
                        resolve(this.parseVersionNum(versionInfo.tag_name.substring(1)))
                    } else {
                        reject('Cannot get latest version, please check the feed url.')
                    }
                })
            }).on("error", (err) => {
                reject(err)
            })
        })
    }
}
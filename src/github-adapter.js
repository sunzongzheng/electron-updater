import baseAdapter from './base-adapter'
import https from 'https'

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
}
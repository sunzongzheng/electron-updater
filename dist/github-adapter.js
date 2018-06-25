"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _baseAdapter = _interopRequireDefault(require("./base-adapter"));

var _https = _interopRequireDefault(require("https"));

var _url = require("url");

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _electron = require("electron");

class _default extends _baseAdapter.default {
  constructor(options) {
    super(options);
    if (!options.username) throw new Error('Can not find github username');
    if (!options.repo) throw new Error('Can not find github repo name');
    this.setFeedUrl(`https://api.github.com/repos/${options.username}/${options.repo}/releases/latest`);
  }

  getDownloadUrl() {
    return new _promise.default((resolve, reeject) => {
      let url;

      switch (process.platform) {
        case 'darwin':
          url = this.latestRelease.osx;
          break;

        case 'win32':
          url = this.latestRelease.windows;
          break;

        default:
          url = this.latestRelease.linux;
          break;
      }

      if (!url) {
        reeject('There is not a available release downloadUrl');
      }

      _https.default.get(url, res => {
        resolve(res.headers.location);
      }).on('error', err => {
        reeject(err);
      });
    });
  }

  getRemoteLatest() {
    this.emit('log', 'getRemoteLatest');
    this.emit('log', `feedurl: ${this.feedUrl}`);
    return new _promise.default((resolve, reject) => {
      const url = new _url.URL(this.feedUrl);

      _https.default.get({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36'
        }
      }, res => {
        if (res.statusCode >= 400) {
          return reject('Cannot get latest version, please check the feed url.');
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          const versionInfo = JSON.parse(data);
          versionInfo.assets.forEach(item => {
            switch (item.content_type) {
              case 'application/x-debian-package':
                this.latestRelease.linux = item.browser_download_url;
                break;

              case 'application/zip':
                this.latestRelease.osx = item.browser_download_url;
                break;

              case 'application/x-msdos-program':
              case 'application/x-msdownload':
                this.latestRelease.windows = item.browser_download_url;
                break;
            }
          });
          this.emit('log', this.latestRelease);

          if (versionInfo.tag_name) {
            this.updatePath = _path.default.join(_os.default.tmpdir(), `${_electron.app.getName()}_v${versionInfo.tag_name}_${+new Date()}.zip`);
            resolve(this.parseVersionNum(versionInfo.tag_name.substring(1)));
          } else {
            reject('Cannot get latest version, please check the feed url.');
          }
        });
      }).on("error", err => {
        reject(err);
      });
    });
  }

}

exports.default = _default;
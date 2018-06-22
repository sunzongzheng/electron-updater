"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _https = _interopRequireDefault(require("https"));

var _url = require("url");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _electron = require("electron");

var _child_process = require("child_process");

var _os = _interopRequireDefault(require("os"));

class _default {
  constructor(options) {
    (0, _defineProperty2.default)(this, "log", false);
    (0, _defineProperty2.default)(this, "latestRelease", {
      osx: '',
      linux: '',
      windows: ''
    });
    (0, _defineProperty2.default)(this, "feedUrl", '');
    const {
      log = false,
      updateAvailableCallback = this.updateAvailableCallback,
      downloadFinishedCallback = this.downloadFinishedCallback
    } = options;
    this.log = log;
    this.updateAvailableCallback = updateAvailableCallback;
    this.downloadFinishedCallback = downloadFinishedCallback;
  }

  setFeedUrl(url) {
    this.feedUrl = url;
  }

  async checkForUpdatesAndNotify() {
    // 暂不支持linux
    if (process.platform !== 'darwin' && process.platform !== 'win32') return;
    this.emit('checking-for-update');

    try {
      if (await this.checkUpdate()) {
        this.emit('update-available');
        this.updateAvailableCallback();
      } else {
        this.emit('update-not-available');
      }
    } catch (e) {
      this.emit('error', e);
    }
  }

  async checkUpdate() {
    try {
      const latestVersion = await this.getRemoteLatest();
      const localVersion = this.parseVersionNum(_electron.app.getVersion());
      this.emit('log', {
        latestVersion,
        localVersion
      });
      return latestVersion > localVersion;
    } catch (e) {
      return _promise.default.reject(e);
    }
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

  parseVersionNum(versionStr) {
    return versionStr.split('.').map(i => parseInt(i)).reduce((a, b, i) => a * 1000 + b);
  }

  updateAvailableCallback() {
    _electron.dialog.showMessageBox({
      type: 'info',
      title: '更新提醒',
      buttons: ['下载', '取消'],
      message: '检测到可用更新，立即下载？'
    }, res => {
      if (res === 0) {
        this.download();
      }
    });
  }

  getDownloadUrl() {
    switch (process.platform) {
      case 'darwin':
        return this.latestRelease.osx;

      case 'win32':
        return this.latestRelease.windows;

      default:
        return this.latestRelease.linux;
    }
  }

  async download() {
    try {
      const file = _fs.default.createWriteStream(this.updatePath);

      const downloadUrl = await this.getDownloadUrl();

      if (!downloadUrl) {
        throw new Error('There is not a available release downloadUrl');
      }

      _https.default.get(downloadUrl, res => {
        const len = res.headers['content-length'];
        let downloaded = 0;
        res.pipe(file);
        res.on('data', chunk => {
          downloaded += chunk.length;
          this.emit('download-progress', parseInt(downloaded * 100 / len));
        });
        file.on('finish', () => {
          file.close();
          this.emit('log', `donwload success ${this.updatePath}`);
          this.downloadFinishedCallback();
        });
      }).on('error', err => {
        return _promise.default.reject(err);
      });
    } catch (e) {
      this.emit('error', e);
      console.error(e);

      _electron.dialog.showMessageBox({
        type: 'info',
        title: '下载提醒',
        message: '下载失败，请检查网络连接或稍后再试'
      });
    }
  }

  downloadFinishedCallback() {
    _electron.dialog.showMessageBox({
      type: 'info',
      title: '下载提醒',
      message: '下载已完成，立即重启更新？',
      buttons: ['重启', '取消']
    }, res => {
      if (res === 0) {
        this.quitAndInstall();
      }
    });
  }

  quitAndInstall() {
    switch (process.platform) {
      case 'darwin':
        const unzip = (0, _child_process.exec)(`unzip -o '${this.updatePath}' -d '/Applications/'`, {
          encoding: 'binary'
        });
        unzip.on('exit', () => {
          _electron.app.relaunch({
            args: process.argv.slice(1).concat(['--relaunch'])
          });

          _electron.app.exit(0);
        });
        break;

      case 'win32':
        const args = ["--updated"];
        args.push("/S");
        args.push("--force-run");
        const spawnOptions = {
          detached: true,
          stdio: "ignore"
        };

        try {
          (0, _child_process.spawn)(this.updatePath, args, spawnOptions).unref();
        } catch (e) {
          this.emit('error', e);
          console.warn(e);
        }

        _electron.app.exit(0);

        break;

      default:
        break;
    }
  }

  on(event, cb) {
    this[`${event}_cb`] = cb;
  }

  emit(event, params) {
    if (event === 'log' && !this.log) return;
    const callback = this[`${event}_cb`];
    typeof callback === 'function' && callback(params);
  }

}

exports.default = _default;
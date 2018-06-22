"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _promise = _interopRequireDefault(require("@babel/runtime/core-js/promise"));

var _baseAdapter = _interopRequireDefault(require("./base-adapter"));

var _https = _interopRequireDefault(require("https"));

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

}

exports.default = _default;
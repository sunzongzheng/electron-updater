"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _baseAdapter = _interopRequireDefault(require("./base-adapter"));

class _default extends _baseAdapter.default {
  constructor(options) {
    super(options);

    if (options && options.url) {
      this.setFeedUrl(options.url);
    } else if (!options || !options.getRemoteLatest) {
      throw new Error('Can not find getRemoteLatest function definition when use custom type without url');
    }
  }

}

exports.default = _default;
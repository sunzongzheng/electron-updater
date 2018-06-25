"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _githubAdapter = _interopRequireDefault(require("./github-adapter"));

var _customAdapter = _interopRequireDefault(require("./custom-adapter"));

function _default(config) {
  if (!config) throw new Error('Can not find update config');
  if (!config.type) throw new Error(`Can not find update config's type field`);
  if (!config.options) throw new Error(`Can not find update config's options field`);

  switch (config.type) {
    case 'github':
      return new _githubAdapter.default(config.options);

    case 'custom':
      return new _customAdapter.default(config.options);

    default:
      throw new Error(`Can not find update adapter`);
  }
}
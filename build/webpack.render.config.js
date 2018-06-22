const path = require('path')

module.exports = {
    target: 'electron-renderer',
    mode: 'production',
    entry: './test/render.js',
    output: {
        path: path.resolve(__dirname, '../test/dist'),
        filename: 'render.js'
    }
}
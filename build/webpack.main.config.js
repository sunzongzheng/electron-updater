const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    target: 'electron-main',
    mode: 'production',
    entry: './test/main.js',
    output: {
        path: path.resolve(__dirname, '../test/dist'),
        filename: 'main.js'
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, '../test/index.html'),
                to: path.resolve(__dirname, '../test/dist/index.html')
            }
        ])
    ],
    node: {
        __filename: false,
        __dirname: false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}
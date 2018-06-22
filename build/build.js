const webpack = require('webpack')
const mainConfig = require('./webpack.main.config')
const renderConfig = require('./webpack.render.config')

webpack(mainConfig, (err, stats) => {
    if (err || stats.hasErrors()) {
        if (err) {
            console.error(err)
            return
        }

        console.log(stats.toString({
            chunks: false,  // Makes the build much quieter
            colors: true    // Shows colors in the console
        }))
    }
    console.log('main process down')
})

webpack(renderConfig, (err, stats) => {
    if (err || stats.hasErrors()) {
        if (err) {
            console.error(err)
            return
        }

        console.log(stats.toString({
            chunks: false,  // Makes the build much quieter
            colors: true    // Shows colors in the console
        }))
    }
    console.log('render process down')
})
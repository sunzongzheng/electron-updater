import GithubAdapter from './github-adapter'
import CustomAdapter from './custom-adapter'

export default function (config) {
    if (!config) throw new Error('Can not find update config')
    if (!config.type) throw new Error(`Can not find update config's type field`)
    if (!config.options) throw new Error(`Can not find update config's options field`)
    switch (config.type) {
        case 'github':
            return new GithubAdapter(config.options)
        case 'custom':
            return new CustomAdapter(config.options)
        default:
            throw new Error(`Can not find update adapter`)
    }
}
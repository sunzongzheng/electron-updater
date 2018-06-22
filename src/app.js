import GithubAdapter from './github-adapter'

export default function (config) {
    if (!config) throw new Error('Can not find update config')
    if (!config.type) throw new Error(`Can not find update config's type field`)
    switch (config.type) {
        case 'github':
            return new GithubAdapter(config.options)
        default:
            throw new Error(`Can not find update adapter`)
    }
}
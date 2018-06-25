import baseAdapter from './base-adapter'

export default class extends baseAdapter {
    constructor(options) {
        super(options)
        if (options && options.url) {
            this.setFeedUrl(options.url)
        } else if (!options || !options.getRemoteLatest) {
            throw new Error('Can not find getRemoteLatest function definition when use custom type without url')
        }
    }
}
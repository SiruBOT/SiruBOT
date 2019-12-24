// TODO: Create NPM Package - SLyrics
const providers = require('./providers')
class LyricsLoader {
  /**
  * @description - Get Lyrics from each platform
  * @param type - vocaro, melon, AtoZLyrics
  * @param keyword - to get Lyrics
  */
  async get (type, keyword) {
    let value
    switch (type) {
      case 'vocaro':
        break
      case 'melon':
        value = await providers.melon.get(keyword)
        break
      case 'atoz':
        value = await providers.atozLyrics.get(keyword)
    }
    return value
  }
}

module.exports = LyricsLoader

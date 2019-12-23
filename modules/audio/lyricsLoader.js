// TODO: Making AtoZLyrics, 보카로 가사 위키, get

const cheerio = require('cheerio')
const fetch = require('node-fetch')

class LyricsLoader {
  constructor (client = {}) {
    this.client = client
  }

  async get () {

  }

  async searchFromMelon (name) {
    const result = await fetch(`https://www.melon.com/search/song/index.htm?q=${encodeURI(name)}`)
      .then(res => res.text())
      .catch(console.error)
    const $ = cheerio.load(result)
    const item = $($($('#frm_defaultList > div > table > tbody > tr').children('.t_left')[0]).children('.pd_none')[0]).children('div')
    const artist = $($($('#frm_defaultList > div > table > tbody > tr').children('.t_left')[1]).children('.wrap')[0]).children('#artistName').children('a.fc_mgray').text()
    return {
      songId: item.children('a.fc_gray').attr('href') ? parseInt(item.children('a.fc_gray').attr('href').split(';')[1].split(',').slice(-1)) : undefined,
      title: item.children('a.fc_gray').text(),
      artist: artist
    }
  }

  async getLyricsFromMelon (songId) {
    if (!songId) return null
    const result = await fetch(`https://www.melon.com/song/detail.htm?songId=${songId}`)
      .then(res => res.text())
      .catch(console.error)
    const $ = cheerio.load(result)
    return $('#d_video_summary').html($('#d_video_summary').html().replace(/<br>/g, '\\n')).text().replace(/\\n/g, '\n').trim()
  }

  async fetchFromAtoZLyrics () {

  }
}

async function test () {
  const start = new Date().getTime()
  const lyrics = new LyricsLoader()
  const melonTrackInfo = await lyrics.searchFromMelon('Sayoko')
  const lyricResult = await lyrics.getLyricsFromMelon(melonTrackInfo.songId)
  console.log(lyricResult)
  console.log(new Date().getTime() - start + 'ms')
}
test()

module.exports = LyricsLoader

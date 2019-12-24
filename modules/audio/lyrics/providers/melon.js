const fetch = require('node-fetch')
const cheerio = require('cheerio')
module.exports.getLyrics = getLyrics
/**
* @param {Number} songId - melon songId to get lyrics
* @description - get lyrics from melonSongId
*/
async function getLyrics (songId) {
  if (!songId) return null
  const result = await fetch(`https://www.melon.com/song/detail.htm?songId=${songId}`)
    .then(res => res.text())
    .catch(console.error)
  const $ = cheerio.load(result)
  try {
    return $('#d_video_summary').html($('#d_video_summary').html().replace(/<br>/g, '\\n')).text().replace(/\\n/g, '\n').trim()
  } catch {
    return null
  }
}

module.exports.get = get
/**
* @param {String} name - song name to get from melon
* @description - get lyrics by name via melon
*/
async function get (name) {
  const result = await search(name)
  const lyrics = await getLyrics(result.songId)
  return lyrics
}

module.exports.search = search
/**
* @param {String} name - song name to get from melon
* @description - get melon track info from melon
*/
async function search (name) {
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

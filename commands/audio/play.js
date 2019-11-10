// TODO: Localization Play.js
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'play',
      aliases: ['ㅔㅣ묘'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   * @param {Boolean} isSoundCloud - is Search Platform SoundCloud?
   */
  async run (compressed, isSoundCloud) {
    const { message, args } = compressed
    const Audio = this.client.audio
    let searchStr = args.join(' ')
    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!this.client.audio.players.get(message.guild.id)) await this.client.commands.get('join').run(compressed, true)
    if (args.length === 0) return message.channel.send('검색어를 입력해주세요!')
    if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getSongs(searchStr)

    const result = searchResult.tracks[0]
    switch (searchResult.loadType) {
      case 'LOAD_FAILED':
        message.channel.send(`로드에 실패했어요.. \`\`${searchResult.exception.message}\`\``)
        break
      case 'PLAYLIST_LOADED':
        message.channel.send(`플레이리스트 **${searchResult.playlistInfo.name}** 에는 **${searchResult.tracks.length}** 개의 노래가 있어요! 추가하시겠어요?`)
        Audio.players.get(message.guild.id).addQueue(searchResult.tracks)
        break
      case 'SEARCH_RESULT':
      case 'TRACK_LOADED':
        message.channel.send(`노래 ${result.info.title} (${result.info.length / 1000} 초)`)
        Audio.players.get(message.guild.id).addQueue(result)
        break
    }
  }
}

// async function ask (message) {

// }

function validURL (str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

module.exports = Command

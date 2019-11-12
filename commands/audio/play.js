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
    // Default Variables
    const { message, args } = compressed
    const vch = compressed.GuildData.vch
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker

    // Conditions
    if (!message.member.voiceChannel) return message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
    if (!this.client.getRightTextChannel(message.member.voiceChannel, vch)) return message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { CHANNEL: vch }))

    // If Conditions True
    const Audio = this.client.audio
    let searchStr = args.join(' ')
    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!Audio.players.get(message.guild.id) || (Audio.players.get(message.guild.id) && !message.guild.me.voiceChannel)) {
      const joinresult = await this.client.commands.get('join').run(compressed, true)
      if (joinresult === false) return
    }
    if (args.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getSongs(searchStr)

    // SearchResult
    if (searchResult.loadType === 'LOAD_FAILED') return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.exception.message }))
    if (searchResult.loadType === 'PLAYLIST_LOADED') {
      message.channel.send('아직 플레이리스트는...^^ㅣ발...')
    }

    if (searchResult.loadType === 'SEARCH_RESULT' || searchResult.loadType === 'TRACK_LOADED') {
      const info = searchResult.tracks[0].info
      if (Audio.players.get(message.guild.id).nowplaying) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_ADDED_SINGLE', { TRACK: info.title, DURATION: this.client.utils.timeUtil.toHHMMSS(info.length / 1000), POSITION: compressed.GuildData.queue.length + 1 }))
      Audio.players.get(message.guild.id).addQueue(searchResult.tracks[0])
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

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
    const vch = compressed.GuildData.vch
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker

    if (message.member.voiceChannel) {
      if (this.client.getRightTextChannel(message.member.voiceChannel, vch)) {
        let searchStr = args.join(' ')
        const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

        if (!Audio.players.get(message.guild.id) || (Audio.players.get(message.guild.id) && !message.guild.me.voiceChannel)) {
          const joinresult = await this.client.commands.get('join').run(compressed, true)
          if (joinresult === false) return
        }
        if (args.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
        if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

        const searchResult = await Audio.getSongs(searchStr)

        const result = searchResult.tracks[0]
        switch (searchResult.loadType) {
          case 'LOAD_FAILED':
            message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.exception.message }))
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
      } else {
        message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { CHANNEL: vch }))
      }
    } else {
      message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
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

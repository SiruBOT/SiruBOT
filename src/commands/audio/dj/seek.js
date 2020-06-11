const { BaseCommand } = require('../../../structures')
const Discord = require('discord.js')
class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'seek',
      ['점프', '탐색', 'jump', 'ㄴㄷ다', 'ㅓㅕㅡㅔ'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: true,
        playingStatus: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      false
    )
  }

  async run ({ message, args, guildData }) {
    const { locale, nowplaying } = guildData
    const picker = this.client.utils.localePicker
    let timeString = args.join('')
    const starter = timeString.charAt(0)
    if (nowplaying &&
      nowplaying.info &&
      !nowplaying.info.isSeekable) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_CANT_SEEKABLE'))
    if (!timeString) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_STRING_NOT_FOUND'))
    if (this.isStarter(starter)) timeString = timeString.substring(1)
    if (this.isStarter(timeString.charAt(0))) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_MULTIPLE_STARTER'))
    const timeMs = this.parseTime(timeString)
    if (isNaN(timeMs)) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_NAN'))
    let playerPosition = this.client.audio.players.get(message.guild.id).position
    switch (starter) {
      case '+':
        playerPosition += timeMs
        break
      case '-':
        playerPosition -= timeMs
        break
      default:
        playerPosition = timeMs
        break
    }
    if (playerPosition > guildData.nowplaying.info.length) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_NO_LONGER_THAN_TRACK'))
    if (playerPosition < 0) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_NO_SHORTER_THAN_TRACK'))
    const seekResult = await this.client.audio.players.get(message.guild.id).seekTo(playerPosition)
    if (!seekResult) return message.channel.send(picker.get(locale, 'COMMANDS_SEEK_FAIL'))
    message.channel.send(picker.get(locale, 'COMMANDS_SEEK_SUCCESS', { TIME: this.client.utils.time.toHHMMSS(playerPosition / 1000), TITLE: Discord.Util.escapeMarkdown(nowplaying.info.title) }))
  }

  isStarter (divider) {
    return divider === '-' || divider === '+'
  }

  parseTime (input) {
    if (typeof input === 'number') input = input.toString()
    if (typeof input !== 'string') return NaN // Input type check
    let sec = 0
    const splitter = ':'
    const tokenized = input.split(splitter)
    try { // Split items filter, If includes not number, returns NaN
      tokenized.map((num) => {
        if (isNaN(num)) throw new Error('Unknown Time Format')
      })
    } catch {
      return NaN
    }
    if (tokenized.length < 0) return NaN
    /**
     * 1. 'HH:MM:SS' => ['HH', 'MM', 'SS']
     * 2. 'MM:SS' => ['MM', 'SS']
     * 3. 'SS' => ['SS']
     */
    tokenized.reverse() // Reverse It! (Normalize Always 'SS' first of array)
    /**
     * 1. ['SS', 'MM', 'HH']
     * 2. ['MM', 'SS']
     * 3. ['SS']
     */
    // Math.floor -> Ignore 12.3:45:6
    if (tokenized.length === 1 && tokenized[0]) sec += Math.floor(+tokenized[0]) // Make working (sec) 120, 72.. etc
    else if (tokenized[0] && (Math.floor(tokenized[0] > 60) || Math.floor(tokenized[0]) < 0)) return NaN
    else if (tokenized[0]) sec += Math.floor(+tokenized[0])
    if (tokenized[1] && (Math.floor(tokenized[1]) > 60 || Math.floor(tokenized[1]) < 0)) return NaN
    else if (tokenized[1]) sec += Math.floor(+tokenized[1]) * 60
    if (tokenized[2] && (Math.floor(tokenized[2]) > 24 || Math.floor(tokenized[2]) < 0)) return NaN
    else if (tokenized[2]) sec += Math.floor(+tokenized[2]) * 3600
    return sec * 1000
  }
}

module.exports = Command

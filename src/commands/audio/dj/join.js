const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'join',
      ['접속'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: true,
        playingStatus: false,
        voiceStatus: {
          listenStatus: true,
          sameChannel: false,
          voiceIn: true
        }
      },
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   * @param {Boolean} silent - if Send Message
   */
  async run (compressed, silent = false) {
    const { message } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const voiceChannelID = message.member.voice.channelID

    const loadMessage = silent === true ? '' : await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_JOIN_LOAD', { VOICECHANNEL: voiceChannelID }))

    const sendFunc = async (sendContent, err) => {
      if ((loadMessage.editable && silent === false)) await loadMessage.edit(sendContent)
      else if (err && (err !== 'A Player is already established in this channel')) await message.channel.send(sendContent)
    }
    if (message.member.voice.channelID && !message.member.voice.channel.joinable && !message.member.voice.channel.speakable) {
      await sendFunc(picker.get(locale, 'AUDIO_NOT_JOINABLE_OR_SPEAKABLE'), true)
      return false
    }
    try {
      await (() => {
        if (this.client.audio.players.get(message.guild.id) && this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID !== message.member.voice.channelID) return message.guild.me.voice.setChannel(message.member.voice.channelID)
        else return this.client.audio.join(voiceChannelID, message.guild.id)
      })()
      sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_OK', { VOICECHANNEL: voiceChannelID }))
      return true
    } catch (e) {
      if (e.message === 'A Player is already established in this channel') sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_DUPLICATED', { VOICECHANNEL: voiceChannelID }))
      else await sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_FAIL', { VOICECHANNEL: voiceChannelID }) + `\`\`\`js\n > ${`${e.name}: ${e.message}`.split('\n').join('\n> ')}\`\`\``, e)
      return e.message === 'A Player is already established in this channel' ? true : e.message
    }
  }
}

module.exports = Command

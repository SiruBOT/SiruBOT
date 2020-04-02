const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'nowplaying',
      ['현', 'np', 'ㅞ'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    const embed = await this.client.audio.utils.getNowplayingEmbed(message.guild.id)
    const nowPlayingMessage = await message.channel.send(embed)
    this.client.audio.nowplayingMessages.set(message.guild.id, nowPlayingMessage)
  }
}

module.exports = Command

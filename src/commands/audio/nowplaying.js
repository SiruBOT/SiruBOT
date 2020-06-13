const { BaseCommand } = require('../../structures')
const { placeHolderConstant } = require('../../constant')
const { EMOJI_STAR } = placeHolderConstant
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
    if (this.client._options.bot.owners.includes(message.author.id) && message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS')) await nowPlayingMessage.react(EMOJI_STAR)
    this.client.audio.nowplayingMessages.set(message.guild.id, nowPlayingMessage)
  }
}

module.exports = Command

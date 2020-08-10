const { BaseCommand } = require('../../structures')
const { placeHolderConstant } = require('../../constant')
const { EMOJI_STAR, EMOJI_PIN } = placeHolderConstant
class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'nowplaying',
      ['현', 'np'],
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

  async run ({ message }) {
    const embed = await this.client.audio.utils.getNowplayingEmbed(message.guild.id)
    const nowPlayingMessage = await message.channel.send(embed)
    if (message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS')) {
      await nowPlayingMessage.react(EMOJI_PIN)
    }
    this.client.audio.nowplayingMessages.set(message.guild.id, { message: nowPlayingMessage, pinned: false })
  }
}

module.exports = Command

const { BaseCommand } = require('../../structures')
const Discord = require('discord.js')
const { placeHolderConstant } = require('../../constant')
const { EMOJI_ARROW_BACKWARD, EMOJI_ARROW_TORWARD, EMOJI_X } = placeHolderConstant

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'playlist',
      ['재생목록', 'pl'],
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
      true
    )
  }

  async run (compressed) {
    const { message, args, guildData } = compressed
  }
}

module.exports = Command

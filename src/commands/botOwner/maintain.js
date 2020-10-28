const { BaseCommand } = require('../../structures')
const { placeHolderConstant } = require('../../constant')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'maintain',
      ['점검'],
      ['BotOwner'],
      'BOT_OWNER',
      {
        audioNodes: false,
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
    const { message } = compressed
    if (!this.client.shard) {
      this.client.maintain = !this.client.maintain
      await message.channel.send(`${placeHolderConstant.EMOJI_YES} ${this.client.maintain}`)
    } else {
      await this.client.shard.broadcastEval('this.maintain = !this.maintain')
      await message.channel.send(`${placeHolderConstant.EMOJI_YES}  Shard: ${this.client.shard.count} ${this.client.maintain}`)
    }
  }
}

module.exports = Command

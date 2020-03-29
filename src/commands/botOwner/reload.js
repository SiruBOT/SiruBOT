const { placeHolderConstructors } = require('../../constructors')
class Command {
  constructor (client) {
    this.client = client
    this.name = 'reload'
    this.aliases = ['리로드', 'loadcommands', 'flfhem', 'ㄱ디ㅐㅁㅇ']
    this.category = 'BOT_OWNER'
    this.requirements = {
      audioNodes: false,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['BotOwner']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    await message.channel.send(`${placeHolderConstructors.EMOJI_YES}  모든 샤드 ${this.client.shard.count} 개에 리로드 신호를 보냅니다...`)
    await this.client.shard.broadcastEval('this.reload()')
  }
}

module.exports = Command

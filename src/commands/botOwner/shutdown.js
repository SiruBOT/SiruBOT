const { placeHolderConstructors } = require('../../constructors')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'shutdown',
      ['셧다운', '봇종료'],
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
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    message.channel.send(`📫  모든 샤드 ${this.client.shard.count} 개에 종료 신호를 보냅니다...`)
    this.client.shard.broadcastEval('this.shutdown()').then(results => {
      for (const shardID of results) {
        message.channel.send(`${placeHolderConstructors.EMOJI_YES}  샤드 ${shardID} 번의 종료가 시작되었습니다.`)
      }
    })
  }
}

module.exports = Command

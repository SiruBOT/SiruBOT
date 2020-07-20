const { placeHolderConstant } = require('../../constant')
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

  async run ({ message }) {
    if (this.client.shard) {
      await message.channel.send(`📫  모든 샤드 ${this.client.shard.count} 개에 종료 신호를 보냅니다...`)
      const results = await this.client.shard.broadcastEval('this.shutdown()')
      for (const shardID of results) {
        await message.channel.send(`${placeHolderConstant.EMOJI_YES}  샤드 ${shardID} 번의 종료가 시작되었습니다.`)
      }
    } else {
      await message.channel.send('📫 종료 중...')
      this.client.shutdown()
    }
  }
}

module.exports = Command

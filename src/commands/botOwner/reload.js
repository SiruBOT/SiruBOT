const { placeHolderConstant } = require('../../constant')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'reload',
      ['리로드', 'reloadcommands'],
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
    if (!this.client.shard) {
      const m = await message.channel.send(`${placeHolderConstant.EMOJI_YES}  리로드 중...`)
      try {
        this.client.reload()
        await m.edit(`${placeHolderConstant.EMOJI_YES}  리로드 성공.`)
      } catch {
        await m.edit(`${placeHolderConstant.EMOJI_YES}  리로드 실패. 수정된 코드를 확인해 주세요.`)
      }
    } else {
      await message.channel.send(`${placeHolderConstant.EMOJI_YES}  모든 샤드 ${this.client.shard.count} 개에 리로드 신호를 보냅니다...`)
      await this.client.shard.broadcastEval('this.reload()')
    }
  }
}

module.exports = Command

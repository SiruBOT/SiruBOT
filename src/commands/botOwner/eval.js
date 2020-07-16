const util = require('util')
const sleep = util.promisify(setTimeout)
const { placeHolderConstant } = require('../../constant')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'eval',
      ['run-code', 'compile'],
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
  async run ({ message, args }) {
    const waitReaction = await message.react(placeHolderConstant.EMOJI_SANDCLOCK)
    const codeToRun = args.join(' ')
    const startTime = this.getNanoSecTime()
    let endTime
    try {
      const evalPromise = (code) => new Promise((resolve, reject) => {
        try {
          resolve(eval(code))
        } catch (e) {
          reject(e)
        }
      })
      const result = await Promise.race([
        this.timeout(15000),
        evalPromise(codeToRun)
      ])
      endTime = this.getNanoSecTime() - startTime
      await message.react(placeHolderConstant.EMOJI_YES)
      await this.sendOver2000(util.inspect(result, { depth: 1 }), message, { code: 'js' })
    } catch (e) {
      endTime = this.getNanoSecTime() - startTime
      await message.react(placeHolderConstant.EMOJI_X)
      await this.sendOver2000(e.stack || e.message || e.name || e, message, { code: 'js' })
    } finally {
      await message.channel.send(`Processing Time: ${endTime}ns, ${endTime / 1000000}ms`, { code: 'js' })
      try {
        await waitReaction.remove()
      } catch {}
    }
  }

  async sendOver2000 (content, message, options = {}) {
    if (content.length < 1990) return message.channel.send(content, options)
    const messagesList = []
    while (content.length > 1990) {
      let index = content.lastIndexOf('\n\n', 1990)
      if (index === -1) { index = content.lastIndexOf('\n', 1990) }
      if (index === -1) { index = content.lastIndexOf(' ', 1990) }
      if (index === -1) { index = 1990 }
      messagesList.push(await message.channel.send(content.substring(0, index), options))
      content = content.substring(index).trim()
    }
    messagesList.push(await message.channel.send(content, options))
    return messagesList
  }

  async timeout (time) {
    await sleep(time)
    throw new Error('Execution Timed out.')
  }

  getNanoSecTime () {
    const hrTime = process.hrtime()
    return hrTime[0] * 1000000000 + hrTime[1]
  }
}

module.exports = Command

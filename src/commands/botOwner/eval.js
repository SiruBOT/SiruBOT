const Discord = require('discord.js')
const util = require('util')
const sleep = util.promisify(setTimeout)
const evalPromise = util.promisify(eval)
const { placeHolderConstructors } = require('../../constructors')
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
      [],
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, args } = compressed
    const waitReaction = await message.react(placeHolderConstructors.EMOJI_SANDCLOCK)
    const codeToRun = args.join(' ')
    try {
      const result = await Promise.race([
        this.timeout(30000),
        evalPromise(codeToRun)
      ])
      await message.react(placeHolderConstructors.EMOJI_YES)
      await this.sendOver2000(util.inspect(result, { depth: 0 }), message, { code: 'js' })
    } catch (e) {
      await message.react(placeHolderConstructors.EMOJI_NO)
      await this.sendOver2000(e, message, { code: 'js' })
    } finally {
      try {
        await waitReaction.remove()
      } catch {}
    }
  }

  async sendOver2000 (content, message, options = {}) {
    if (!content.length > 1990) return message.channel.send(content, options)
    const messagesList = []
    while (content.length > 1990) {
      let index = content.lastIndexOf('\n\n', 1990)
      if (index === -1) { index = content.lastIndexOf('\n', 1990) }
      if (index === -1) { index = content.lastIndexOf(' ', 1990) }
      if (index === -1) { index = 1990 }
      messagesList.push(await message.channel.send(content.substring(0, index), options))
      content = content.substring(index).trim()
      messagesList.push(await message.channel.send(content, options))
    }
    return messagesList
  }

  async timeout (time) {
    await sleep(time)
    throw new Error('Execution Timed out.')
  }
}

module.exports = Command

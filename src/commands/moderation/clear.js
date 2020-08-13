const { BaseCommand } = require('../../structures')
const { UsageFailedError } = require('../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'clear',
      ['청소', 'clean', 'cc'],
      ['Administrator'],
      'MODERATION',
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

  async run ({ message, guildData, args }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    let tobulkDelete
    let type
    if (args.length <= 0) throw new UsageFailedError(this.name)
    const fetchedMessages = await message.channel.messages.fetch({ limit: 100, before: message.id })
    if (message.mentions.users.size > 0) {
      type = 'USER'
      tobulkDelete = fetchedMessages.filter(el => el.author.id === message.mentions.users.first().id)
    } else if (isNaN(Number(args[0]))) {
      try {
        const string = args.join(' ')
        const parsed = string.match(/\/(.*?)\/(\w+)?/)
        const regExp = new RegExp(parsed[parsed.length - 2], parsed[parsed.length - 1])
        type = 'REGEX'
        tobulkDelete = fetchedMessages.filter(el => regExp.test(el))
      } catch (e) {
        type = 'KEYWORD'
        tobulkDelete = fetchedMessages.filter(el => el.content.includes(args[0]))
      }
    } else if (!isNaN(Number(args[0]))) {
      if (Number(args[0]) < 1) return message.channel.send(picker.get(locale, 'COMMANDS_CLEAR_LESS_1'))
      if (Number(args[0]) > 100) return message.channel.send(picker.get(locale, 'COMMANDS_CLEAR_EXCESS_100'))
      type = 'NUMBER'
    }
    try {
      let deleted
      if (type === 'NUMBER') deleted = await message.channel.bulkDelete(Number(args[0]))
      else deleted = await message.channel.bulkDelete(tobulkDelete)
      await message.channel.send(picker.get(locale, `COMMANDS_CLEAR_${type}`, { SIZE: deleted.size, USER: type === 'USER' ? message.mentions.users.first().tag : 'None' }))
    } catch {
      await message.channel.send(picker.get(locale, 'COMMANDS_CLEAR_FAILED'))
    }
  }
}

module.exports = Command

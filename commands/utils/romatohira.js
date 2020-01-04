const hiraModule = require('./!romaTohira')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'romtohi',
      aliases: ['로마히라', 'romajitohiragana', 'romtohira', 'romaji2hira', 'r2h'],
      category: 'COMMANDS_GENERAL_UTILS',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.channel.send('히라가나로 변환할 로마자를 작성해주세요!\n->romtohi [내용]')
    message.channel.send(hiraModule.romajiTohiragana(args.join(' ')))
  }
}
module.exports = Command

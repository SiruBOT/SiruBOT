class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'reload',
      aliases: ['리로드', 'loadcommands', 'flfhem', '리로드'],
      category: 'BOT_OWNER',
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    message.channel.send('❎  리로드 중...').then(async m => {
      const Data = await this.client.LoadCommands()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n❎  언어 리로드 중..`)
      const Locale = await this.client.utils.localePicker.init()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n❎  설정파일 리로드중....`)
      delete require.cache[require.resolve('../../settings.js')]
      this.client._options = require('../../settings.js')
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n✅  설정파일 리로드 완료!...`)
    })
  }
}

module.exports = Command

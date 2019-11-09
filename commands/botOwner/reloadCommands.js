class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'reload',
      aliases: ['리로드', 'loadcommands', 'flfhem', '리로드'],
      permissions: ['BotOwner']
    }
  }

  async run (compressed) {
    const { message } = compressed
    message.channel.send('❎  리로드 중...').then(async m => {
      const Data = await this.client.LoadCommands()
      m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n❎  언어 리로드 중..`)
      const Locale = await this.client.utils.localePicker.init()
      m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)`)
    })
  }
}

module.exports = Command

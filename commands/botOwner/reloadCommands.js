class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'reload',
      description: '모든 명령어 리로드',
      aliases: ['리로드', 'loadcommands', 'flfhem'],
      permissions: ['BotOwner']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Data = await this.client.LoadCommands()
    message.channel.send(`${this.client._options.emojis.yes}  모든 명령어 (${Data.keyArray().length} 개) 를 리로드해요!`)
  }
}

module.exports = Command

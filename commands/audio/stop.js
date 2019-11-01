class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'stop',
      aliases: ['ㄴ새ㅔ', '정지'],
      description: '노래 정지',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Audio = this.client.audio
    if (!Audio.players.get(message.guild.id)) return message.channel.send('먼저 join ㄱ')
    Audio.players.get(message.guild.id).stop()
    message.channel.send('Ok.')
  }
}

module.exports = Command

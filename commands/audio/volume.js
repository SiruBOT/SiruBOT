class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'volume',
      aliases: ['볼륨', 'vol', 'qhffba', '패ㅣㅕㅡㄷ'],
      description: '볼륨 설정',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message, args } = compressed
    const guildData = await this.client.database.getGuildData(message.guild.id)
    if (args.length === 0) return message.channel.send(`> 🔊  현재 볼륨 **${guildData.volume}%**`)
    const Audio = this.client.audio
    await Audio.setVolume(message.guild, Number(args[0]))
    message.channel.send(`> 🔊  볼륨이 **${Number(args[0])}%** 로 변경되었어요!`)
  }
}

module.exports = Command

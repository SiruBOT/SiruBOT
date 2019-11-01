class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'join',
      aliases: ['ㅓㅐㅑㅜ'],
      description: '음성 채널 참가',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Audio = this.client.audio
    if (!message.member.voiceChannel) return message.reply('보이스채널에 먼저 드가셈')
    await Audio.join({ guild: message.guild.id, channel: message.member.voiceChannel.id })
    message.channel.send('Ok.')
  }
}

module.exports = Command

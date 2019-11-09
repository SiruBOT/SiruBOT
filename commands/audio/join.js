class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'join',
      aliases: ['ㅓㅐㅑㅜ'],
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Audio = this.client.audio
    if (!message.member.voiceChannel) return message.reply()
    await Audio.join({ guild: message.guild.id, channel: message.member.voiceChannel.id })
    message.channel.send('Ok.')
  }
}

module.exports = Command

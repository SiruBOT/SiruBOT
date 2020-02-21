class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'fuckembed',
      aliases: ['임베드시발'],
      category: '',
      require_nodes: false,
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
    message.channel.messages.fetch().then((messages) => {
      message.channel.bulkDelete(messages.filter(el => el.embeds.length > 0))
      message.channel.send('EMBED 처리완료.')
    })
  }
}

module.exports = Command

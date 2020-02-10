class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'sayd',
      aliases: [],
      category: 'BOT_OWNER',
      require_voice: true,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     * @param {Boolean} silent - if Send Message
     */
  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.delete()
    message.channel.send(args.join(' '))
  }
}

module.exports = Command

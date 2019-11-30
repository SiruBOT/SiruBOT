class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'template',
      aliases: ['template'],
      category: 'COMMANDS_GENERAL',
      permissions: ['Everyone']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.GuildData.locale
    const { message } = compressed
    console.log(`This is bolierplate of command ${message.id}, ${picker.locales}, ${locale}`)
  }
}

module.exports = Command

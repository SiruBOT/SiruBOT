const canvas = require('canvas')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'qrcode',
      aliases: ['qr', 'ㅂㄱ', 'ㅂㄱ코드', 'qrzhem'],
      category: 'COMMANDS_GENERAL',
      require_voice: false,
      permissions: ['Everyone']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.GuildData.locale
    const { message, GlobalUserData, args } = compressed
    message.channel.send('Qrcode test')
  }
}

module.exports = Command

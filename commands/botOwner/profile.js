const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'profile',
      aliases: ['프로필', 'ㅔ개랴ㅣㄷ'],
      category: 'BOT_OWNER',
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
    this.client.utils.images.getStatusImage(message.author.displayAvatarURL({ format: 'png', size: 512 }), this.client.utils.findUtil.getStatus(message.author.presence), 1024).then((img) => {
      message.channel.send(new Discord.MessageAttachment(img, 'image.png'))
    })
  }
}

module.exports = Command

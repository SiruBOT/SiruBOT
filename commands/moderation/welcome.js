const Discord = require('discord.js')
const welcomeByeProperties = {
  welcome: {
    메세지: 'message',
    사진: 'image',
    역할: 'role',
    message: 'message',
    image: 'image'

  },
  bye: {

  }
}
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'welcome',
      aliases: ['환영', 'ㅈ디채ㅡㄷ'],
      category: 'MODERATION',
      require_nodes: false,
      require_playing: false,
      require_voice: false,
      hide: false,
      permissions: ['Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const { message, args, command, guildData } = compressed
    const type = this.client.utils.find.matchObj({ 잘가: 'bye', 환영: 'welcome', 입장: 'welcome', 퇴장: 'bye', welcome: 'welcome', bye: 'bye' }, args.shift(), null)
    const method = this.client.utils.find.matchObj({ view: 'view', set: 'set', 보기: 'view', 설정: 'set' }, args.shift(), null)
    // Enter: 0, Leave: 1
    if (!method || !type) return message.channel.send('No Method or Type')
    else {
      const welcomeData = guildData[type]
      if (method === 'view') {
        await message.channel.send(await this.getViewEmbed(message, picker, locale, welcomeData, type))
      } else if (method === 'set') {
        await message.channel.send(await this.getViewEmbed(message, picker, locale, welcomeData, type))
        try {
          const property = await this.client.utils.find.question(message.channel, message.author, picker.get(locale, 'COMMANDS_WELCOME_ASK_PROPERTY'))
          await message.channel.send(property.content)
        } catch (e) {
          if (e.name !== 'timeout') throw e
          else message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT')).then(m => m.delete({ timeout: 5000 }))
        }
      }
    }
  }

  async getViewEmbed (message, picker, locale, welcomeData, type) {
    const getName = this.client.commands.get('settings').getName
    const embed = new Discord.MessageEmbed()
    embed.setColor(this.client.utils.find.getColor(message.guild.me))
    embed.setTitle(picker.get(locale, `COMMANDS_WELCOME_${type.toUpperCase()}_TITLE`))
    const descHolder = {
      TEXTSTATUS: picker.get(locale, welcomeData.textEnabled ? 'ENABLE' : 'DISABLE'),
      IMAGESTATUS: picker.get(locale, welcomeData.imageEnabled ? 'ENABLE' : 'DISABLE'),
      CHANNEL: getName(welcomeData.channel, message.guild.channels.cache, locale, picker)
    }
    const desc = `${picker.get(locale, 'COMMANDS_WELCOME_STATUS', descHolder)}${welcomeData.autoRoles ? picker.get(locale, 'COMMANDS_WELCOME_AUTOROLE_STATUS', { AUTOROLE: picker.get(locale, welcomeData.autoRoleEnabled ? 'ENABLE' : 'DISABLE') }) : ''}`
    embed.setDescription(desc)
    if (welcomeData.autoRoleEnabled) {
      const roles = welcomeData.autoRoles.map(el => {
        const tempRole = message.guild.roles.cache.get(el)
        if (tempRole.position < message.guild.me.roles.highest) return tempRole
      })
      if (roles.length !== 0) {
        const rolesName = roles.map(el => `<@&${el.id}>`)
        const displayRolesName = rolesName.length > 5 ? rolesName.splice(0, 5).join(', ') + picker.get(locale, 'MORE_X', { NUM: rolesName.length - 5 }) : rolesName.join(', ')
        embed.addField(picker.get(locale, 'COMMANDS_WELCOME_AUTOROLE_TITLE'), displayRolesName)
      }
    }
    if (welcomeData.textEnabled) embed.addField(picker.get(locale, 'COMMANDS_WELCOME_MESSAGE_TITLE'), picker.get(locale, 'COMMANDS_WELCOME_MESSAGE_DESC', { TEXT: welcomeData.textContent }))
    if (welcomeData.imageEnabled) {
      const params = [message.guild, message.member.user, welcomeData.imageTextContent]
      if (welcomeData.imageBgURL) params.push(welcomeData.imageBgURL)
      if (welcomeData.imageStyle) params.push(welcomeData.imageStyle)
      const imageCanvas = await this.client.utils.image.resolveInfo(this.client.utils.image.models.welcome(...params))
      const attachment = new Discord.MessageAttachment(imageCanvas.toBuffer(), 'attachment://card.png')
      embed.attachFiles(attachment)
      embed.setImage('attachment://card.png')
      embed.addField(picker.get(locale, 'COMMANDS_WELCOME_IMAGE_TITLE'), picker.get(locale, 'COMMANDS_WELCOME_IMAGE_DESC', { TEXT: welcomeData.imageTextContent }))
    }
    embed.setTimestamp(new Date().getTime())
    return embed
  }
}

module.exports = Command

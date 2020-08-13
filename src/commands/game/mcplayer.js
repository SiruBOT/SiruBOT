const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')
const { MinecraftRESTManager } = require('../../structures').Game
const { UsageFailedError, FetchFailError } = require('../../errors')
class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'mcplayer',
      ['마크플레이어', '마크', 'mc'],
      ['Everyone'],
      'GENERAL_GAME',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  async run ({ message, args, prefix, userPermissions, guildData }) {
    if (args.length <= 0) throw new UsageFailedError(this.name)
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    try {
      const userProfile = await MinecraftRESTManager.getFullProfile(args.join(' '))
      const nameHistory = userProfile.nameHistory.map(el => Discord.Util.escapeMarkdown(el.name)).join(' **->** ')
      const embed = new Discord.MessageEmbed()
        .setColor(this.client.utils.find.getColor(message.guild.me))
        .addField(picker.get(locale, 'COMMANDS_MCPLAYER_RESULT_TITLE', { NAME: userProfile.name }), picker.get(locale, 'COMMANDS_MCPLAYER_RESULT_UUID', { UUID: userProfile.id }))
        .addField(picker.get(locale, 'COMMANDS_MCPLAYER_NAMECHANGES'), nameHistory.length > 1000 ? nameHistory.substr(0, 1000) + '(...)' : nameHistory)
        .setThumbnail(userProfile.profileImages.face)
        .setImage(userProfile.profileImages.bust)
      await message.channel.send(embed)
    } catch (e) {
      if (e instanceof FetchFailError) return message.channel.send(picker.get(locale, 'COMMANDS_MCPLAYER_NO_PLAYER'))
      throw e
    }
  }
}

module.exports = Command

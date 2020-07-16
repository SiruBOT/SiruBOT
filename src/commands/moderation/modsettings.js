const Discord = require('discord.js')
const { placeHolderConstant } = require('../../constant')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'settings',
      ['서버설정', '설정', 'svsettings'],
      ['Administrator'],
      'MODERATION',
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

  async run ({ message, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale, filter, warningMax, audioMessage, audioPlayrelated, repeat, tch, vch, dj_role: djRole } = guildData
    const embed = new Discord.MessageEmbed()
    const obj = {
      MOD: {
        LOCALE: picker.get(locale, 'NAME'),
        FILTER: filter ? picker.get(locale, 'ENABLE') : picker.get(locale, 'DISABLE'),
        WARNMAX: warningMax
      },
      AUDIO: {
        AUDIOPLAY: audioMessage ? picker.get(locale, 'YES') : picker.get(locale, 'NO'),
        RELATED: audioPlayrelated ? picker.get(locale, 'YES') : picker.get(locale, 'NO'),
        REPEAT_EMOJI: placeHolderConstant['EMOJI_' + this.client.audio.utils.getRepeatState(repeat)],
        REPEAT: picker.get(locale, this.client.audio.utils.getRepeatState(guildData.repeat))
      },
      DEFAULT: {
        DJROLE: this.getName(djRole, message.guild.roles.cache, locale, picker),
        TCH: this.getName(tch, message.guild.channels.cache, locale, picker),
        VCH: this.getName(vch, message.guild.channels.cache, locale, picker)
      }
    }
    Object.keys(obj).map(item =>
      embed.addField(
        picker.get(locale, 'COMMANDS_MODSETTINGS_FIELD_' + item),
        picker.get(locale, 'COMMANDS_MODSETTINGS_DESC_' + item, obj[item]),
        true
      )
    )
    embed.setTimestamp(new Date())
    embed.setColor(this.client.utils.find.getColor(message.guild.me))
    message.channel.send(picker.get(locale, 'COMMANDS_MODSETTINGS_EMBED_TITLE', { SERVER: message.guild.name }), embed)
  }

  getName (id, items, locale, picker) {
    if (id === 'dm') return picker.get(locale, 'DM')
    if (items.get(id)) return items.get(id).name
    if (!items.get(id)) return picker.get(locale, 'NONE')
    if (id === '0') return picker.get(locale, 'NONE')
  }
}

module.exports = Command

const fetch = require('node-fetch')
const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'changelog',
      ['변경로그'],
      ['Everyone'],
      'GENERAL_INFO',
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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const gitInfo = require('git-repo-info')()
    const result = await fetch(this.client._options.others.changelog_url + `${gitInfo.abbreviatedSha}.json`).then(res => res.text()).then(res => res)
    try {
      const obj = JSON.parse(result)
      const embed = new Discord.MessageEmbed(Object.assign(obj.locales[locale], obj.footer))
      embed.setTitle(`${obj.locales[locale].title} - **${gitInfo.abbreviatedSha}**`)
      embed.setTimestamp(obj.timestamp)
      embed.setColor(obj.color)
      message.channel.send(embed)
    } catch {
      message.channel.send(picker.get(locale, 'COMMANDS_CHANGELOG_NO', { COMMITSHA: gitInfo.abbreviatedSha }))
    }
  }
}
module.exports = Command

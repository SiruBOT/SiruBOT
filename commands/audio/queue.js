const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'queue',
      category: 'MUSIC_GENERAL',
      aliases: ['벼뎓', '큐', '대기열', '재생목록', 'playlist', 'zb', 'eorlduf'],
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    if (compressed.GuildData.queue.length === 0) return this.client.commands.get('nowplaying').run(compressed)
    const { message } = compressed
    const picker = this.client.utils.localePicker

    const guildData = await this.client.database.getGuildData(message.guild.id)
    const locale = guildData.locale
    const allDuration = guildData.queue.map(el => el.info.isStream === false ? el.info.length : 0).reduce((a, b) => {
      return a + b
    })

    const descriptionArray = []
    for (const position in guildData.queue) {
      descriptionArray.push(`\`\`${parseInt(position) + 1}.\`\` \`\`[${this.client.utils.timeUtil.toHHMMSS(guildData.queue[position].info.length / 1000, guildData.queue[position].info.isStream)}]\`\` **${guildData.queue[position].info.title}** - <@${guildData.queue[position].request}>`)
    }

    const chunkedDescriptionArray = this.client.utils.arrayUtil.chunkArray(descriptionArray, 10)
    function getEmbed (page, pages) {
      return new Discord.RichEmbed()
        .setDescription(chunkedDescriptionArray[page].map(el => el))
        .setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: page + 1, PAGES: pages }))
    }
    const nowplayingObject = this.client.audio.getNowplayingObject(message.guild.id, guildData)
    message.channel.send(`${nowplayingObject.playingStatus} **${this.client.audio.players.get(message.guild.id).nowplaying.info.title}** \`\`${nowplayingObject.time}\`\`\n${guildData.queue.length} 개 | ${this.client.utils.timeUtil.toHHMMSS(allDuration / 1000)}`, getEmbed(0, chunkedDescriptionArray.length))
  }
}

module.exports = Command

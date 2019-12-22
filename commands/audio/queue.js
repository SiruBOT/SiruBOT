const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'queue',
      category: 'MUSIC_GENERAL',
      require_voice: false,
      hide: false,
      aliases: ['벼뎓', '큐', '대기열', '재생목록', 'playlist', 'zb', 'eorlduf'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    if (!this.client.audio.players.get(compressed.message.guild.id)) return this.client.commands.get('nowplaying').run(compressed)
    if (compressed.GuildData.queue.length === 0) return this.client.commands.get('nowplaying').run(compressed)
    const { message } = compressed
    const picker = this.client.utils.localePicker
    let page = 0
    const client = this.client
    async function updateData () {
      const guildData = await client.database.getGuildData(message.guild.id)
      const locale = guildData.locale
      const allDuration = guildData.queue.map(el => el.info.isStream === false ? el.info.length : 0).reduce((a, b) => {
        return a + b
      })
      const descriptionArray = []
      for (const position in guildData.queue) {
        descriptionArray.push(`\`\`${parseInt(position) + 1}.\`\` \`\`[${client.utils.timeUtil.toHHMMSS(guildData.queue[position].info.length / 1000, guildData.queue[position].info.isStream)}]\`\` **${guildData.queue[position].info.title}** - <@${guildData.queue[position].request}>`)
      }
      const chunkedDescriptionArray = client.utils.arrayUtil.chunkArray(descriptionArray, 10)
      const nowplayingObject = client.audio.getNowplayingObject(message.guild.id, guildData)

      return {
        embed: new Discord.RichEmbed()
          .setDescription(chunkedDescriptionArray[page].map(el => el))
          .setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: page + 1, PAGES: chunkedDescriptionArray.length })).setColor(client.utils.findUtil.getColor(message.guild.me)),
        nowplaying: picker.get(locale, 'COMMANDS_AUDIO_QUEUE_SONGS', { PLAYINGSTATUS: nowplayingObject.playingStatus, NPTITLE: guildData.nowplaying.info.title, NOWPOSITION: nowplayingObject.time, REPEATSTATUS: nowplayingObject.repeatStatus, NUM: guildData.queue.length, TOTALTIME: client.utils.timeUtil.toHHMMSS(allDuration / 1000) }),
        chunkedDescriptionArray: chunkedDescriptionArray
      }
    }
    const data = await updateData()
    message.channel.send(data.nowplaying, data.embed).then(m => {
      const emojiList = ['◀️', '⏹️', '▶️']
      this.client.utils.massReact(m, emojiList).then(() => {
        const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id
        const collector = m.createReactionCollector(filter, { time: 60000 })
        const functionList = [(r) => {
          r.remove(message.author)
          if (page === 0) page = data.chunkedDescriptionArray.length - 1
          else page--
          updateData().then(res => m.edit(res.nowplaying, res.embed))
        }, () => {
          collector.stop()
          m.reactions.forEach((el) => el.remove())
        }, (r) => {
          r.remove(message.author)
          if (page >= data.chunkedDescriptionArray.length - 1) page = 0
          else page++
          updateData().then(res => m.edit(res.nowplaying, res.embed))
        }]
        collector.on('collect', r => {
          const index = emojiList.findIndex((el) => el === r.emoji.name)
          functionList[index](r)
        })
      })
    })
  }
}

module.exports = Command

const { BaseCommand } = require('../../structures')
const Discord = require('discord.js')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'queue',
      ['대기열', '벼뎓', '큐', '대기열', 'q', 'zb', 'eorlduf'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
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
    if (!this.client.audio.players.get(compressed.message.guild.id)) return this.client.commands.get('nowplaying').run(compressed)
    if (compressed.guildData.queue.length === 0) return this.client.commands.get('nowplaying').run(compressed)
    const { message } = compressed
    const picker = this.client.utils.localePicker
    let page = 0
    const getData = async () => {
      const guildData = await this.client.database.getGuild(message.guild.id)
      const locale = guildData.locale
      const allDuration = guildData.queue.map(el => el.info.isStream === false ? el.info.length : 0).reduce((a, b) => {
        return a + b
      })
      const descriptionArray = []
      for (const position in guildData.queue) {
        descriptionArray.push(`\`\`${parseInt(position) + 1}.\`\` \`\`[${this.client.utils.time.toHHMMSS(guildData.queue[position].info.length / 1000, guildData.queue[position].info.isStream)}]\`\` **${Discord.Util.escapeMarkdown(guildData.queue[position].info.title)}** - <@${guildData.queue[position].request}>`)
      }
      const chunkedDescriptionArray = this.client.utils.array.chunkArray(descriptionArray, 10)
      const nowplayingObject = this.client.audio.utils.getNowplayingObject(message.guild.id, guildData)

      return {
        embed: new Discord.MessageEmbed()
          .setDescription(chunkedDescriptionArray[page].map(el => el))
          .setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: page + 1, PAGES: chunkedDescriptionArray.length })).setColor(this.client.utils.find.getColor(message.guild.me)),
        nowplaying: picker.get(locale, 'COMMANDS_AUDIO_QUEUE_SONGS', { PLAYINGSTATUS: nowplayingObject.playingStatus, NPTITLE: guildData.nowplaying.info.title, NOWPOSITION: nowplayingObject.time, REPEATSTATUS: nowplayingObject.repeatStatus, NUM: guildData.queue.length, TOTALTIME: this.client.utils.time.toHHMMSS(allDuration / 1000) }),
        chunkedDescriptionArray: chunkedDescriptionArray
      }
    }
    const data = await getData()
    const m = await message.channel.send(data.nowplaying, data.embed)
    if (data.chunkedDescriptionArray.length === 1) return
    const emojiList = ['◀️', '⏹️', '▶️']
    await this.client.utils.message.massReact(m, emojiList)
    const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id
    const collector = m.createReactionCollector(filter, { time: 60000 })
    const funcs = {
      [emojiList[0]]: async (r) => {
        try {
          await r.users.remove(message.author)
        } catch {}
        if (page === 0) page = data.chunkedDescriptionArray.length - 1
        else page--
        const res = await getData()
        m.edit(res.nowplaying, res.embed)
      },
      [emojiList[1]]: async () => {
        collector.stop()
        try {
          m.reactions.removeAll()
        } catch {}
      },
      [emojiList[2]]: async (r) => {
        try {
          await r.users.remove(message.author)
        } catch {}
        if (page >= data.chunkedDescriptionArray.length - 1) page = 0
        else page++
        const res = await getData()
        m.edit(res.nowplaying, res.embed)
      }
    }
    collector.on('collect', async (r) => {
      await funcs[r.emoji.name](r)
    })
  }
}

module.exports = Command

const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')
const moment = require('moment-timezone')
const Melon = require('melon-chart-api')
const { EMOJI_ARROW_TORWARD, EMOJI_ARROW_BACKWARD, EMOJI_X } = require('../../constant/placeHolderConstant')
const CONTROL_KEYS = [EMOJI_ARROW_BACKWARD, EMOJI_X, EMOJI_ARROW_TORWARD]
const ONE_MIN = 60 * 1000
class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'melon',
      ['멜론', '멜론차트'],
      ['Everyone'],
      'MUSIC_GENERAL',
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

  async run ({ message, args, guildData }) {
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    let realtimeStatus = args.length === 0
    let melonData
    if (realtimeStatus) melonData = await Melon(this.parseDate(), { cutLine: 100 }).realtime()
    else {
      realtimeStatus = false
      melonData = await Melon(this.parseDate(args.join(' ')), { cutLine: 100 }).weekly()
      if (melonData.data.length === 0) {
        realtimeStatus = true
        melonData = await Melon(this.parseDate(), { cutLine: 100 }).realtime()
      }
    }
    if (melonData.data.length === 0) return message.channel.send(picker.get(locale, ''))
    const melonPages = this.client.utils.array.chunkArray(melonData.data, 10)
    const melonDate = this.parseMelonDate(melonData.dates.start)
    let page = 1
    const getMelonEmbed = () => {
      const embed = new Discord.MessageEmbed()
      const items = melonPages[page - 1]
      items.map((el) => {
        embed.addField(`${picker.get(locale, 'COMMANDS_MELON_RANK', { RANK: el.rank })} - ${el.artist}`, el.title)
      })
      embed.setThumbnail('https://cdnimg.melon.co.kr/resource/image/web/common/logo_melon142x99.png')
      embed.setTitle(`${moment(melonDate.date).format(picker.get(locale, 'COMMANDS_MELON_FORMAT'))} ${realtimeStatus ? picker.get(locale, 'REALTIME') : ''} ${picker.get(locale, 'MELONCHART')}`)
      embed.setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: page, PAGES: melonPages.length }))
      embed.setColor(this.client.utils.find.getColor(message.guild.me))
      return embed
    }
    const m = await message.channel.send(getMelonEmbed(page, melonPages))
    await this.client.utils.message.massReact(m, CONTROL_KEYS)
    const awaitControl = async () => {
      const updateMessage = async () => {
        try {
          await m.edit(getMelonEmbed())
          await awaitControl()
        } catch (e) {
          await m.reactions.removeAll()
        }
      }
      const controlKeysFilter = (reaction, user) => CONTROL_KEYS.includes(reaction.emoji.name) && user.id === message.author.id
      try {
        const collectedReactions = await m.awaitReactions(controlKeysFilter, { max: 1, time: ONE_MIN, errors: ['time'] })
        switch (collectedReactions.first().emoji.name) {
          case EMOJI_ARROW_BACKWARD:
            if (page <= 1) page = melonPages.length
            else page--
            await collectedReactions.first().users.remove(message.author.id)
            await updateMessage()
            break
          case EMOJI_ARROW_TORWARD:
            if (page >= melonPages.length) page = 1
            else page++
            await collectedReactions.first().users.remove(message.author.id)
            await updateMessage()
            break
          case EMOJI_X:
            await m.reactions.removeAll()
            break
        }
      } catch (e) {
        await m.reactions.removeAll()
      }
    }
    await awaitControl()
  }

  parseMelonDate (string) {
    return {
      date: new Date(`${string.substring(0, 4)}-${string.substring(4, 6)}-${string.substring(6, 8)}`),
      time: string.substring(8, 10)
    }
  }

  parseDate (string) {
    const time = moment().tz('Asia/Seoul')
    try {
      if (string.length > 10) throw new Error('Invalid time text')
      let tokenized = string.split('/') // Source: 1972/11/21 Except: ["1972", "11", "21"]
      tokenized = tokenized.filter(el => !isNaN(+el)).map(el => Math.abs(el))
      const segments = [] // YYYY, MM, DD
      if (tokenized.length > 3) throw new Error('Tokenized Items must be fewer than 3')
      if (tokenized.length === 0) throw new Error('Tokenized Items not found')
      if (tokenized.length === 3 && tokenized[0]) {
        if (+tokenized[0] > 0 && +tokenized[0] < 100) segments.push(+tokenized[0] + 2000)
        else segments.push(tokenized[0])
        if (+tokenized[1] > 0 && +tokenized[1] <= 12) segments.push(+tokenized[1])
        else throw new Error('MM Parsing Failed')
        if (+tokenized[2] > 0 && +tokenized[2] <= 31) segments.push(+tokenized[2])
        else throw new Error('YY Parsing Failed')
      } else if (tokenized.length === 2 && tokenized[0]) {
        if (+tokenized[0] > 12 && +tokenized[0] < 100) { // 2000s (2015, 2017, 2018, 2099)
          segments.push(+tokenized[0] + 2000)
          if (+tokenized[1] <= 12) segments.push(tokenized[1])
          else segments.push(time.format('MM'))
          segments.push(time.format('DD'))
        } else {
          segments.push(time.format('YYYY'))
          if (+tokenized[0] <= 12) segments.push(tokenized[0])
          else segments.push(time.format('MM'))
          if (+tokenized[1] <= 31) segments.push(tokenized[1])
          else segments.push(time.format('DD'))
        }
      } else if (tokenized.length === 1 && tokenized[0] && !(+tokenized[0] > 31)) {
        segments.push(time.format('YYYY'))
        segments.push(time.format('MM'))
        segments.push(tokenized[0])
      } else throw new Error('Time Parsing Failed')
      return segments.join('/')
    } catch {
      return time.format('YYYY/MM/DD')
    }
  }
}

module.exports = Command

const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')
const moment = require('moment-timezone')
const Melon = require('melon-chart-api')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'melon',
      ['멜론', '멜론차트', '라솔말'],
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
    const time = this.parseDate(args.join(' '))
  }

  getMelonEmbed (page, entires) {
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

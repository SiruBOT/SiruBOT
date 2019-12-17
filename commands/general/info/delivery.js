// const Discord = require('discord.js')
const carriers = require('./carriers.json')
const fetch = require('node-fetch')
const moment = require('moment-timezone')
const Discord = require('discord.js')

// https://apis.tracker.delivery/carriers/Carrier_ID/tracks/Track_No

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'delivery',
      aliases: ['택배', '택배조회'],
      category: 'COMMANDS_GENERAL_INFO',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.channel.send('> ❎  사용법이 올바르지 않아요. [택배사 이름] [송장번호] 가 필요해요.')
    if (!args[1]) return message.channel.send('> ❎  운송장 번호를 입력해주세요! [택배사 이름] [송장번호]')

    const carrierCode = carriers[args[0].toUpperCase()]
    if (!carrierCode) return message.channel.send(`> ❎  택배사가 올바르지 않아요..\n> 사용 가능한 택배사 이름들\n> \`\`\`JS\n> ${Object.keys(carriers).join(', ')}\n> \`\`\``)
    const fetchResult = await fetch(`https://apis.tracker.delivery/carriers/${carrierCode}/tracks/${args[1]}`).then(res => res.json())
    if (fetchResult.message) return message.channel.send(`> ❎  ${fetchResult.message}`)
    const MappedResult = fetchResult.progresses.map(el => { return { message: el.description, time: moment(el.time).tz('Asia/Seoul').format('YYYYMMDD'), timeFormat: el.time, location: el.location } })
    const Result = {}
    Result.raw = fetchResult
    for (const obj of MappedResult) {
      if (!Result[obj.time]) Result[obj.time] = []
      Result[obj.time].push(obj)
    }
    const embed = new Discord.RichEmbed()
    embed.setColor('#7289DA')
    embed.setTitle(`보낸이: ${Result.raw.from.name} 받는이: ${Result.raw.to.name} (${Result.raw.state.text})`)
    for (const obj of Object.keys(Result)) {
      if (obj !== 'raw') embed.addField(moment(obj).tz('Asia/Seoul').format('YYYY - MM - DD'), Result[obj].map(el => `**[${el.location.name}]** **${moment(el.timeFormat).tz('Asia/Seoul').format('HH:mm')}** - ${el.message}`))
    }
    message.channel.send(embed)
  }
}
module.exports = Command

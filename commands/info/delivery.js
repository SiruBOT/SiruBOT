// const Discord = require('discord.js')
const carriers = require('./carriers.json')
const fetch = require('node-fetch')
const moment = require('moment')
const Discord = require('discord.js')

// https://apis.tracker.delivery/carriers/Carrier_ID/tracks/Track_No

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'delivery',
      aliases: ['택배', '택배조회'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.channel.send(Object.keys(carriers).join(', '))
    if (!args[0]) return message.channel.send('Carrier')

    const carrierCode = carriers[args[0].toUpperCase()]
    const fetchResult = await fetch(`https://apis.tracker.delivery/carriers/${carrierCode}/tracks/${args[1]}`).then(res => res.json())
    const MappedResult = fetchResult.progresses.map(el => { return { message: el.description, time: moment(el.time).format('YYYYMMDD'), timeFormat: el.time } })
    const Result = {}
    Result.raw = fetchResult
    for (const obj of MappedResult) {
      if (!Result[obj.time]) Result[obj.time] = []
      Result[obj.time].push(obj)
    }
    console.log(Result)
    const embed = new Discord.RichEmbed()
    embed.setColor('#7289DA')
    embed.setTitle(`보낸이: ${Result.raw.from.name} 받는이: ${Result.raw.to.name} (${Result.raw.state.text})`)
    for (const obj of Object.keys(Result)) {
      if (obj !== 'raw') embed.addField(moment(obj).format('YYYY - MM - DD'), Result[obj].map(el => `**${moment(el.timeFormat).format('HH:mm')}** - ${el.message}`))
    }
    message.channel.send(embed)
  }
}
module.exports = Command

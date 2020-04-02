const util = require('util')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'cacheinfo',
      ['캐시정보', 'ㅊㅁ초댜ㅜ래'],
      ['BotOwner'],
      'BOT_OWNER',
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
    const { message, args } = compressed
    const usedMemory = Object.entries(process.memoryUsage()).map(el => `${el[0].replace(/^\w/, c => c.toUpperCase())}: **${Math.round(el[1] / 1024 / 1024 * 100) / 100}**MB`)
    const string = `> **Tracks Cache Info**\n> ${this.getStats(this.client.audio.trackCache.getStats())}\n> \n> **Related Tracks Cache Info**\n> ${this.getStats(this.client.audio.relatedCache.getStats())}\n> \n> **Memory Usage**\n> ${usedMemory.join(', ')}`
    message.channel.send(string)
    if (args.length !== 0) {
      if (this.client.audio.trackCache.get(args.join(' '))) message.channel.send(this.getDataInfo('Track Cache', args.join(' '), this.client.audio.trackCache.get(args.join(' ')), 1), { split: '\n' })
      if (this.client.audio.relatedCache.get(args.join(' '))) message.channel.send(this.getDataInfo('Related Track Cache', args.join(' '), this.client.audio.relatedCache.get(args.join(' ')), 0), { split: '\n' })
    }
  }

  getStats (stats) {
    return `**${stats.hits}** Hits, **${stats.misses}** Misses, **${stats.keys}** Keys\n> KeySize: **${(stats.ksize / 1024).toFixed(2)}**MB (${stats.ksize}KB), ValueSize: **${(stats.vsize / 1024).toFixed(2)}**MB (${stats.vsize}KB)`
  }

  getDataInfo (title, key, trackData, depth) {
    return `> **${title} Data Key Info**\n> Key: **${key}**\n> \`\`\`js\n > ${util.inspect(trackData, { depth: depth }).split('\n').join('\n> ')}\`\`\``
  }
}

module.exports = Command

const Lyrics = require('slyrics')
const lyrics = new Lyrics()
// const providers = ['melon', 'atoz']
const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'lyrics',
      aliases: ['가사', 'lyric'],
      category: 'MUSIC_GENERAL',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const { message, args } = compressed
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.findUtil.getColor(message.guild.me))
    message.channel.startTyping(1)
    // let index = 0
    // for (const provider of providers) {
    //   index++
    const result = await get('melon', args.join(' '))
    if (result === true) {
      message.channel.stopTyping(true)
    } else {
      message.channel.stopTyping(true)
      message.channel.send(picker.get(locale, 'COMMANDS_UTILS_LYRICS_NOTFOUND'))
    }
    // if (index === providers.length) {
    // }
    // }
    async function get (provider, title) {
      const lyricsData = await lyrics.get(provider, title)
      lyricsData.result = lyricsData.result === null ? null : lyricsData.result.replace(/\n\n\n/g, '\n\n')
      if (lyricsData.result === null) return false
      else {
        embed.setTitle(lyricsData.title)
        embed.setFooter(lyricsData.artist)
        embed.setURL(lyricsData.url)
      }
      /**
       * John Grosh (john.a.grosh@gmail.com) 의 https://github.com/jagrosh/MusicBot/blob/master/src/main/java/com/jagrosh/jmusicbot/commands/music/LyricsCmd.java 를 참고하였습니다.
       */
      message.channel.send(picker.get(locale, 'COMMANDS_UTILS_LYRICS_NOTCORRECT'))
      if (lyricsData.result.length > 10000) {
        message.channel.send(`> **${lyricsData.title} - ${lyricsData.artist}**\n> ${lyricsData.url}`)
        return true
      } else if (lyricsData.result.length > 2000) {
        let content = lyricsData.result
        while (content.length > 2000) {
          let index = content.lastIndexOf('\n\n', 2000)
          if (index === -1) { index = content.lastIndexOf('\n', 2000) }
          if (index === -1) { index = content.lastIndexOf(' ', 2000) }
          if (index === -1) { index = 2000 }
          embed.setDescription(content.substring(0, index))
          delete embed.footer
          message.channel.send(embed)
          content = content.substring(index).trim()
          delete embed.title
        }
        embed.setDescription(content)
        embed.setFooter(lyricsData.artist)
        message.channel.send(embed)
        return true
      } else {
        embed.setDescription(lyricsData.result)
        message.channel.send(embed)
        return true
      }
    }
  }
}

module.exports = Command

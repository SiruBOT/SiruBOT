const Lyrics = require('slyrics')
const lyrics = new Lyrics()
const Discord = require('discord.js')

const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'lyrics',
      ['가사', 'lyric'],
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
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
    message.channel.startTyping(1)
    const result = await get('melon', args.join(' '))
    if (result === true) {
      message.channel.stopTyping(true)
    } else {
      message.channel.stopTyping(true)
      message.channel.send(picker.get(locale, 'COMMANDS_UTILS_LYRICS_NOTFOUND'))
    }

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

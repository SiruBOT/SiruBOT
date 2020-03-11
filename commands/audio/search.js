const Discord = require('discord.js')
const Numbers = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'search',
      aliases: ['검색', 'ㄴㄷㅁㄱ초', 'rjator'],
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_voice: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   * @param {Boolean} isSoundCloud - search Platform (SoundCloud: true, Youtube: False)
   */
  async run (compressed, isSoundCloud) {
    const { message, args } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker

    // If Conditions True
    const Audio = this.client.audio
    let searchStr = message.attachments.map(el => el.url)[0] ? message.attachments.map(el => el.url)[0] : args.join(' ')

    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!Audio.players.get(message.guild.id) || (this.client.audio.players.get(message.guild.id) !== undefined) === !message.guild.me.voice.channelID || (this.client.audio.players.get(message.guild.id) === undefined ? false : (this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID === null)) || (message.guild.me.voice.channelID === undefined ? false : (message.guild.me.voice.channelID !== message.member.voice.channelID))) {
      const voiceJoinSuccess = await this.client.commands.get('join').run(compressed, true)
      if (voiceJoinSuccess !== true) return
    }

    if (args.length === 0 && searchStr.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (validURL(searchStr)) {
      return this.client.commands.get('play').run(compressed)
    }
    if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getTrack(searchStr)
    if (this.client.commands.get('play').chkSearchResult(searchResult, picker, locale, message) !== true) return
    const embed = new Discord.MessageEmbed()
    let string = ''
    const maxres = 5
    const slicedNumberArray = Numbers.slice(0, searchResult.tracks.slice(0, maxres).length)
    slicedNumberArray.push(this.client._options.constructors.EMOJI_NO)
    const slicedTracks = searchResult.tracks.slice(0, maxres)
    for (const index in slicedTracks) {
      string += `${Numbers[index]}  [${this.client.audio.utils.formatTrack(searchResult.tracks[index].info)}](${searchResult.tracks[index].info.uri})\n`
    }
    embed.setDescription(string).setColor(this.client.utils.find.getColor(message.guild.me))
    message.channel.send(message.author, embed).then(m => {
      this.client.utils.message.massReact(m, slicedNumberArray)
      const filter = (reaction, user) => slicedNumberArray.includes(reaction.emoji.name) && user.id === message.author.id
      m.awaitReactions(filter, { time: 15000, errors: ['time'], max: 1 })
        .then(collected => {
          if (m.deletable) m.delete()
          if (collected.first().emoji.name === this.client._options.constructors.EMOJI_NO) return message.channel.send(picker.get(locale, 'GENERAL_USER_STOP'))
          this.client.commands.get('play').addQueue(message, slicedTracks[slicedNumberArray.findIndex((el) => el === collected.first().emoji.name)], picker, locale, true)
        })
        .catch(() => {
          if (m.deletable) m.delete()
          message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT'))
        })
    })
  }
}

function validURL (str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

module.exports = Command

const Discord = require('discord.js')
const Numbers = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']
const { placeHolderConstructors } = require('../../constructors')

class Command {
  constructor (client) {
    this.client = client
    this.name = 'search'
    this.aliases = ['검색', 'ㄴㄷㅁㄱ초', 'rjator']
    this.category = 'MUSIC_GENERAL'
    this.requirements = {
      audioNodes: true,
      playingStatus: false,
      voiceStatus: {
        listenStatus: true,
        sameChannel: true,
        voiceIn: true
      }
    }
    this.hide = false
    this.permissions = ['Everyone']
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
    if (this.client.utils.find.validURL(searchStr)) {
      return this.client.commands.get('play').run(compressed)
    } else searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getTrack(searchStr)
    if (this.client.commands.get('play').chkSearchResult(searchResult, picker, locale, message) !== true) return
    const embed = new Discord.MessageEmbed()
    let string = ''
    const maxres = 5
    const slicedNumberArray = Numbers.slice(0, searchResult.tracks.slice(0, maxres).length)
    slicedNumberArray.push(placeHolderConstructors.EMOJI_NO)
    const slicedTracks = searchResult.tracks.slice(0, maxres)
    for (const index in slicedTracks) {
      string += `${Numbers[index]}  [${this.client.audio.utils.formatTrack(searchResult.tracks[index].info)}](${searchResult.tracks[index].info.uri})\n`
    }
    embed.setDescription(string).setColor(this.client.utils.find.getColor(message.guild.me))
    const m = await message.channel.send(message.author, embed)
    await this.client.utils.message.massReact(m, slicedNumberArray)
    const filter = (reaction, user) => slicedNumberArray.includes(reaction.emoji.name) && user.id === message.author.id
    const collected = await m.awaitReactions(filter, { time: 15000, errors: ['time'], max: 1 }).then(coll => coll).catch(() => null)
    if (m.deletable) m.delete()
    if (!collected) {
      await message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT')).then(m => m.delete({ timeout: 5000 }))
      return
    }
    if (collected.first().emoji.name === placeHolderConstructors.EMOJI_NO) {
      await message.channel.send(picker.get(locale, 'GENERAL_USER_STOP')).then(m => m.delete({ timeout: 5000 }))
      return
    }
    this.client.commands.get('play').addQueue(message, slicedTracks[slicedNumberArray.findIndex((el) => el === collected.first().emoji.name)], picker, locale, true)
  }
}

module.exports = Command

const Discord = require('discord.js')
const Numbers = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']
const { placeHolderConstant } = require('../../constant')

const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'search',
      ['검색'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
        playingStatus: false,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      false
    )
  }

  /**
   * @param {Boolean} isSoundCloud - search Platform (SoundCloud: true, Youtube: False)
   */
  async run (compressed, isSoundCloud) {
    const { message, args, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker

    // If Conditions True
    const Audio = this.client.audio
    let resumed = false
    let searchStr = message.attachments.map(el => el.url)[0] ? message.attachments.map(el => el.url)[0] : args.join(' ')

    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!Audio.players.get(message.guild.id) || (this.client.audio.players.get(message.guild.id) !== undefined) === !message.guild.me.voice.channelID || (this.client.audio.players.get(message.guild.id) === undefined ? false : (this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID === null)) || (message.guild.me.voice.channelID === undefined ? false : (message.guild.me.voice.channelID !== message.member.voice.channelID))) {
      const voiceJoinSuccess = await this.client.commands.get('join').run(compressed, true)
      if (voiceJoinSuccess !== true) return
      if (guildData.nowplaying.track) {
        await message.channel.send(picker.get(locale, 'COMMAND_AUDIO_RESUME', { POSITION: this.client.utils.time.toHHMMSS(guildData.nowplayingPosition / 1000), TRACK: this.client.audio.utils.formatTrack(guildData.nowplaying.info) }))
        resumed = true
      }
    }

    if (resumed && (args.length === 0 && searchStr.length === 0)) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (this.client.utils.find.validURL(searchStr)) {
      return this.client.commands.get('play').run(compressed)
    } else searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getTrack(searchStr)
    if (this.client.commands.get('play').chkSearchResult(searchResult, picker, locale, message) !== true) return
    const embed = new Discord.MessageEmbed()
    const maxres = !this.client._options.audio.searchResults || this.client._options.audio.searchResults > 10 || this.client._options.audio.searchResults < 1 ? 5 : this.client._options.audio.searchResults
    const slicedNumberArray = Numbers.slice(0, searchResult.tracks.slice(0, maxres).length)
    slicedNumberArray.push(placeHolderConstant.EMOJI_NO)
    const slicedTracks = searchResult.tracks.slice(0, maxres)
    const string = slicedTracks.map((value, index) => {
      return `${Numbers[index] || index} [${this.client.audio.utils.formatTrack(value.info)}](${value.uri})`
    })
    embed.setDescription(string.join('\n')).setColor(this.client.utils.find.getColor(message.guild.me))
    const m = await message.channel.send(message.author, embed)
    await this.client.utils.message.massReact(m, slicedNumberArray)
    const filter = (reaction, user) => slicedNumberArray.includes(reaction.emoji.name) && user.id === message.author.id
    try {
      const collected = await m.awaitReactions(filter, { time: 15000, errors: ['time'], max: 1 })
      if (m.deletable) m.delete()
      if (collected.first().emoji.name === placeHolderConstant.EMOJI_NO) return (await message.channel.send(picker.get(locale, 'GENERAL_USER_STOP'))).delete({ timeout: 1500 })
      this.client.commands.get('play').addQueue(message, slicedTracks[slicedNumberArray.findIndex((el) => el === collected.first().emoji.name)], picker, locale, true)
    } catch (e) {
      if (e instanceof Error) throw e
      return (await message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT'))).delete({ timeout: 1500 })
    }
  }
}

module.exports = Command

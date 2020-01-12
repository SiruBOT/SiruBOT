// TODO: Attachments
const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'play',
      aliases: ['ㅔㅣ묘'],
      category: 'MUSIC_GENERAL',
      require_voice: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   * @param {Boolean} isSoundCloud - is Search Platform SoundCloud?
   */
  async run (compressed, isSoundCloud) {
    // Default Variables
    const { message, args } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker

    // If Conditions True
    const Audio = this.client.audio
    let searchStr = message.attachments.map(el => el.url)[0] ? message.attachments.map(el => el.url)[0] : args.join(' ')
    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!Audio.players.get(message.guild.id) || (Audio.players.get(message.guild.id) && !message.guild.me.voiceChannel)) {
      const joinresult = await this.client.commands.get('join').run(compressed, true, !(searchStr.length === 0 && args.length === 0))
      if (joinresult === false) return
    }

    if (args.length === 0 && searchStr.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const searchResult = await Audio.getSongs(searchStr)

    if (this.chkSearchResult(searchResult, picker, locale, message) !== true) return false

    if (searchResult.loadType === 'PLAYLIST_LOADED') {
      const guildData = await this.client.database.getGuildData(message.guild.id)
      const playingList = searchResult.playlistInfo.selectedTrack !== -1
      // If selected Track is exist, shift
      if (playingList) {
        for (let i = 0; i < searchResult.playlistInfo.selectedTrack; i++) {
          searchResult.tracks.shift()
        }
        const info = searchResult.tracks[0].info
        this.addQueue(message, searchResult.tracks[0], picker, locale)
        searchResult.tracks.shift()
        if (guildData.nowplaying.track) message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_ADDED_SINGLE', { TRACK: Discord.Util.escapeMarkdown(info.title), DURATION: this.client.utils.timeUtil.toHHMMSS(info.length / 1000, info.isStream), POSITION: guildData.queue.length + 1 }))
        if (searchResult.tracks.length === 0) return
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADD_ASK_PLAYINGLIST', { NUM: searchResult.tracks.length })).then((m) => {
          const emojiList = ['📥', '🚫']
          this.client.utils.massReact(m, emojiList)

          const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id
          const collector = m.createReactionCollector(filter, { time: 15000 })
          const functionList = [() => {
            collector.stop()
            this.addQueue(message, searchResult.tracks, picker, locale)
            message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADDED_PLAYLIST', { NUM: searchResult.tracks.length }))
          }, () => {
            collector.stop()
            return message.channel.send(picker.get(locale, 'GENERAL_USER_STOP'))
          }]

          collector.on('collect', r => {
            const index = emojiList.findIndex((el) => el === r.emoji.name)
            functionList[index]()
          })

          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT'))
          })
        })
      } else {
        this.addQueue(message, searchResult.tracks, picker, locale)
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADDED_PLAYLIST', { NUM: searchResult.tracks.length }))
      }
    }

    if (searchResult.loadType === 'SEARCH_RESULT' || searchResult.loadType === 'TRACK_LOADED') {
      const info = searchResult.tracks[0].info
      const track = searchResult.tracks[0]
      if (info.title.length === 0) track.info.title = searchStr.split('/').slice(-1)[0]
      this.addQueue(message, track, picker, locale, true)
    }
  }

  addQueue (message, items, picker, locale, single = false) {
    const Audio = this.client.audio
    if (!Audio.players.get(message.guild.id)) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_NO_VOICE_ME'))
    if (single) {
      this.client.database.getGuildData(message.guild.id).then(guildData => {
        const status = (guildData.nowplaying.track && this.client.audio.players.get(message.guild.id).player.track)
        const info = items.info
        if (status || (guildData.nowplaying.track || guildData.queue.length > 0)) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_ADDED_SINGLE', { TRACK: Discord.Util.escapeMarkdown(info.title), DURATION: this.client.utils.timeUtil.toHHMMSS(info.length / 1000, info.isStream), POSITION: guildData.queue.length + 1 }))
      })
    }
    Audio.players.get(message.guild.id).addQueue(items, message)
  }

  chkSearchResult (searchResult, picker, locale, message) {
    const keys = Object.keys(searchResult)
    if (!keys.includes('loadType')) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.cause.message })) // andesite-node Handling
    if (searchResult.loadType === 'NO_MATCHES' || searchResult.tracks.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_NO_RESULT'))
    if (searchResult.loadType === 'LOAD_FAILED') return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.exception.message }))
    return true
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

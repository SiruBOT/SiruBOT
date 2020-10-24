const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'play',
      ['재생', 'p'],
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

    if (!resumed && (args.length === 0 && searchStr.length === 0)) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (resumed && (args.length === 0 && searchStr.length === 0)) return

    if (!this.client.utils.find.validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const loadingMessage = await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_LOAD'))
    const searchResult = await Audio.getTrack(searchStr)

    if (this.chkSearchResult(searchResult, picker, locale, loadingMessage) !== true) return

    if (searchResult.loadType === 'PLAYLIST_LOADED') {
      const playingList = searchResult.playlistInfo.selectedTrack !== -1
      // If selected Track is exist, shift
      if (playingList) {
        for (let i = 0; i < searchResult.playlistInfo.selectedTrack; i++) {
          searchResult.tracks.shift()
        }
        this.addQueue(message, searchResult.tracks.shift(), picker, locale, loadingMessage, true)
        if (searchResult.tracks.length === 0) return
        const plistMessage = await this.client.utils.message.safeEdit(loadingMessage, picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADD_ASK_PLAYINGLIST', { NUM: searchResult.tracks.length }))
        const emojiList = ['📥', '🚫']
        await this.client.utils.message.massReact(plistMessage, emojiList)
        const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id
        try {
          const collected = await plistMessage.awaitReactions(filter, { time: 15000, max: 1, errors: ['time'] })
          if (collected.first().emoji.name === emojiList[1]) {
            if (plistMessage.deletable) return await plistMessage.delete()
          } else {
            await plistMessage.reactions.removeAll()
          }
        } catch (e) {
          await plistMessage.reactions.removeAll()
          await this.client.utils.message.safeEdit(plistMessage, picker.get(locale, 'GENERAL_TIMED_OUT'))
          return
        }
      }
      this.addQueue(message, searchResult.tracks, picker, locale, loadingMessage)
      await this.client.utils.message.safeEdit(loadingMessage, picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADDED_PLAYLIST', { NUM: searchResult.tracks.length }))
    }

    if (searchResult.loadType === 'SEARCH_RESULT' || searchResult.loadType === 'TRACK_LOADED') {
      const track = searchResult.tracks.shift()
      if (track.info.title.length === 0) track.info.title = searchStr.split('/').slice(-1).shift()
      this.addQueue(message, track, picker, locale, loadingMessage)
    }
  }

  async addQueue (message, trackInfo, picker, locale, loadingMessage, newMessage = false) {
    if (!Array.isArray(trackInfo)) {
      const { nowplaying, queue } = await this.client.database.getGuild(message.guild.id)
      let localeName
      const { info } = trackInfo
      const placeHolder = Object.assign({
        TRACK: this.client.audio.utils.formatTrack(info),
        POSITION: queue.length + 1
      })
      if (nowplaying.track) localeName = 'COMMANDS_AUDIO_PLAY_ADDED_SINGLE'
      else localeName = 'COMMANDS_AUDIO_PLAY_ADDED_NOWPLAY'
      if (newMessage) loadingMessage.channel.send(picker.get(locale, localeName, placeHolder))
      else await this.client.utils.message.safeEdit(loadingMessage, picker.get(locale, localeName, placeHolder))
    }
    this.client.audio.queue.enQueue(message.guild.id, trackInfo, message.author.id)
  }

  chkSearchResult (searchResult, picker, locale, loadingMessage) {
    if (searchResult.loadType === 'LOAD_FAILED') return this.client.utils.message.safeEdit(loadingMessage, picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.exception.message }))
    if (searchResult.loadType === 'NO_MATCHES' || !searchResult.tracks || searchResult.tracks.length === 0) return this.client.utils.message.safeEdit(loadingMessage, picker.get(locale, 'GENERAL_NO_RESULT'))
    return true
  }
}

module.exports = Command

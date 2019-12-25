const { PlayerManager } = require('discord.js-lavalink')
const AudioPlayer = require('./AudioPlayer')
const { Collection } = require('discord.js')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { URLSearchParams } = require('url')
const Discord = require('discord.js')

class AudioManager {
  /**
   * @param {Object} options - Options for AudioManager
   * @param {Client} options.client - AudioManager Client
   * @param {Array} options.nodes - Audio Nodes
   * @param {Number} options.shards - Shards Count
   */
  constructor (options) {
    this.client = options.client
    this.nowplayingMessages = new Collection()
    this.players = new Collection()
    this.manager = null
    this._options = options
  }

  /**
  * @description Init AudioManager
  */
  init () {
    this.client.logger.info('[Audio] Init Audio...')
    this.manager = new PlayerManager(this.client, this._options.nodes, {
      user: this.client.user.id,
      shards: this._options.shards
    })
    for (const node of this.manager.nodes) {
      node[1].ws.on('message', (data) => {
        const parsed = JSON.parse(data)
        // if (Object.keys(parsed).includes('filters') && parsed.op === 'event') return this.players.get(parsed.guildId).emit('error', parsed.error)
        if (parsed.op === 'playerUpdate') {
          this.updateNpMessage(parsed.guildId)
        }
      })
    }
  }

  /**
   * @description Update Nowplaying Message
   * @param {String} guildId - guildId of to update nowplaying message
   * @param {Boolean} stop - If True, delete guildId of nowplayingMessage from nowplayingMessagesCollection
   */
  updateNpMessage (guildId, stop = false) {
    const npMessage = this.nowplayingMessages.get(guildId)
    if (npMessage && npMessage.deleted === false && npMessage.editable) {
      this.getNowplayingEmbed(guildId).then(embed => {
        npMessage.edit(embed)
      })
    } else {
      this.nowplayingMessages.delete(guildId)
    }
    if (stop) {
      this.nowplayingMessages.delete(guildId)
    }
  }

  /**
   * @description - get video id from youtube url's
   * @param {String} url - youtube url
   */
  getvIdfromUrl (url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : undefined
  }

  /**
   *
   * @param {String} vId - Youtube Video Id
   */
  async getRelated (vId) {
    const result = await fetch(`https://www.youtube.com/watch?v=${vId}`)
      .then(body => body.text()).catch(err => {
        console.error(err)
        return null
      })
    const $ = cheerio.load(result)
    const relatedSongs = []
    const upnext = $('#watch7-sidebar-modules > div:nth-child(1) > div > div.watch-sidebar-body > ul > li > div.content-wrapper > a')
    relatedSongs.push({ uri: `https://youtube.com${upnext.attr('href')}`, identifier: this.getvIdfromUrl(upnext.attr('href')), title: upnext.attr('title') })
    $('#watch-related').children().each((index, item) => {
      const url = $(item).children('.content-wrapper').children('a').attr('href')
      const title = $(item).children('.content-wrapper').children('a').attr('title')
      if (url) relatedSongs.push({ uri: `https://youtube.com${url}`, identifier: this.getvIdfromUrl(url), title: title })
    })
    return { items: relatedSongs.splice(0, relatedSongs.length - (relatedSongs.length - 15)) }
  }

  /**
   * @param {String} guild - Guild Id to get nowplaying Embed
   */
  async getNowplayingEmbed (guild) {
    const guildData = await this.client.database.getGuildData(guild)
    if (!this.players.get(guild) || !guildData.nowplaying.track) {
      return new Discord.RichEmbed()
        .setTitle(this.client.utils.localePicker.get(guildData.locale, 'NOWPLAYING_NOTRACK'))
        .setColor(this.client.utils.findUtil.getColor(this.client.guilds.get(guild).me))
    }
    const request = this.client.users.get(guildData.nowplaying.request)
    return new Discord.RichEmbed()
      .setAuthor(request.tag, request.displayAvatarURL)
      .setTitle(guildData.nowplaying.info.title)
      .setURL(guildData.nowplaying.info.uri)
      .setDescription(this.getNowplayingText(guild, guildData))
      .setColor(this.client.utils.findUtil.getColor(this.client.guilds.get(guild).me))
      .setThumbnail(this.validateYouTubeUrl(guildData.nowplaying.info.uri) ? `https://img.youtube.com/vi/${guildData.nowplaying.info.identifier}/mqdefault.jpg` : 'https://1001freedownloads.s3.amazonaws.com/icon/thumb/340/music-512.png')
  }

  /**
   * @description Get Formatted(Nowplaying) Text with informations
   * @param {String} guild - guildId to formatting
   * @param {Object} guildData - Database Object
   */
  getNowplayingText (guild, guildData) {
    if (!this.players.get(guild) || !guildData.nowplaying.track) return this.client.utils.localePicker.get(guildData.locale, 'NOWPLAYING_NOTRACK')
    const nowPlayingObject = this.getNowplayingObject(guild, guildData)
    return `${nowPlayingObject.playingStatus} ${nowPlayingObject.progressBar} \`\`${nowPlayingObject.time}\`\` ${nowPlayingObject.volume}`
  }

  /**
   * @param {String} guild - guildId to formatting
   * @param {Object} guildData - Database Object
   */
  getNowplayingObject (guild, guildData) {
    if (guildData.nowplaying.info) {
      return {
        playingStatus: this.client._options.constructors['EMOJI_AUDIO_' + this.getPlayingState(guild).toUpperCase()],
        repeatStatus: this.client._options.constructors['EMOJI_' + this.getRepeatState(guildData.repeat).toUpperCase()],
        progressBar: this.getProgressBar(this.players.get(guild).player.state.position / guildData.nowplaying.info.length),
        time: `[${this.client.utils.timeUtil.toHHMMSS(this.players.get(guild).player.state.position / 1000, false)}/${this.client.utils.timeUtil.toHHMMSS(guildData.nowplaying.info.length / 1000, guildData.nowplaying.info.isStream)}]`,
        volume: `${this.getVolumeEmoji(guildData.volume)} **${guildData.volume}%**`
      }
    } else {
      return {
        playingStatus: this.client._options.constructors['EMOJI_AUDIO_' + this.getPlayingState(guild).toUpperCase()],
        repeatStatus: this.client._options.constructors['EMOJI_' + this.getRepeatState(guildData.repeat).toUpperCase()],
        progressBar: this.getProgressBar(this.players.get(guild).player.state.position / 0),
        time: `[${this.client.utils.timeUtil.toHHMMSS(this.players.get(guild).player.state.position / 1000, false)}/${this.client.utils.timeUtil.toHHMMSS(0, false)}]`,
        volume: `${this.getVolumeEmoji(guildData.volume)} **${guildData.volume}%**`
      }
    }
  }

  /**
   * @param {String} url - Url to check validate
   * @return {Boolean} - If url is youtube url, returns true, else returns false
   */
  validateYouTubeUrl (url) {
    const regExp = new RegExp(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/)
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return true
    } else {
      return false
    }
  }

  /**
   * @param {Number} volume- Volume of get emoji
   * @returns {String} - Emojis (🔇, 🔉, 🔊)
   */
  getVolumeEmoji (volume) {
    if (volume === 0) { return '🔇' }
    if (volume < 30) { return '🔉' }
    if (volume < 70) { return '🔊' }
    return '🔊'
  }

  /**
   * @param {String} - Guild Id to get playing state (pause,playing,no)
   * @returns {String} - 'pause', 'playing', 'nothing'
   */
  getPlayingState (guild) {
    if (!this.client.audio.players.get(guild)) return 'nothing'
    if (this.client.audio.players.get(guild).player.paused) return 'paused'
    if (this.client.audio.players.get(guild).player.paused === false) return 'playing'
  }

  /**
   * @param {Number} number - 0, 1, 2 (Repeat Stats)
   * @returns {String} - 'repeat_nothing', 'repeat_all', 'repeat_single'
   */
  getRepeatState (number) {
    switch (number) {
      case 0:
        return 'repeat_nothing'
      case 1:
        return 'repeat_all'
      case 2:
        return 'repeat_single'
    }
  }

  /**
   * @param {Number} percent - Player's Position / Track Duration (miliseconds)
   * @returns {String} - 🔘▬▬▬▬▬▬▬▬▬▬▬
   */
  getProgressBar (percent) {
    let str = ''
    for (let i = 0; i < 12; i++) {
      if (i === parseInt(percent * 12)) {
        str += '🔘'
      } else {
        str += '▬'
      }
    }
    return str
  }

  /**
   * @description Gets best node - Sort by playing players
   * @returns {Node} - Returns Audio Node
   */
  getBestNode () {
    const node = this.manager.nodes.filter(el => el.ready === true).sort((a, b) => {
      return a.stats.playingPlayers - b.stats.playingPlayers
    }).first()
    return node
  }

  /**
   * @param {Object} options - Options for audio player
   * @param {String} options.guild - Guild id for player
   * @param {String} options.channel - Voicechannel id for player
   */
  join (options) {
    this.client.logger.info(`[AudioManager] ${options.guild.id} [DEBUG] [Join] (${options.channel.id}) Joining Voice Channel`)
    console.log(options.channel.joinable)
    if (options.channel.joinable === false) return false
    else {
      const player = new AudioPlayer({ AudioManager: this, client: this.client, guild: options.guild, channel: options.channel.id, textChannel: options.textChannel })
      player.join()
      this.players.set(options.guild, player)
      return true
    }
  }

  /**
   * @description Checking is member listenable
   * @param {Discord.Member} member - Member to checking
   */
  getVoiceStatus (member) {
    return {
      listen: this.getListenStatus(member),
      speak: this.getVoiceMuteStatus(member)
    }
  }

  /**
   * @description Get VoiceMute Status
   * @param {Discord.Member} member - Member to check
   * @returns {Boolean} - false, true
   */
  getVoiceMuteStatus (member) {
    if (member.selfMute) return false
    if (member.serverMute) return false
    else return true
  }

  /**
   * @description Get Listen Status
   * @param {Discord.Member} member - Member to check
   * @returns {Boolean} - false, true
   */
  getListenStatus (member) {
    if (member.serverDeaf) return false
    if (member.selfDeaf) return false
    else return true
  }

  /**
   * @description If Playing Player Exists, set player's volume and edit database, else set database volume
   * @param {Discord.Guild} guild - Guild of setVolume
   * @param {Number} vol - Volume of guild
   */
  async setVolume (guild, vol) {
    await this.client.database.updateGuildData(guild.id, { $set: { volume: vol } })
    if (this.players.get(guild.id)) {
      this.players.get(guild.id).player.volume(vol)
    }
    return vol
  }

  /**
   * @param {String} search - Search String ('ytsearch: asdfmovie')
   * @returns {Promise} - Search Result (Promise)
   */
  async getSongs (search) {
    const node = this.getBestNode()

    const params = new URLSearchParams()
    params.append('identifier', search)

    return fetch(`http://${node.host}:${node.port}/loadtracks?${params.toString()}`, { headers: { Authorization: node.password } })
      .then(res => res.json())
      .catch(err => {
        console.error(err)
        return null
      })
  }
}

module.exports = AudioManager

const { PlayerManager } = require('discord.js-lavalink')
const AudioPlayer = require('./AudioPlayer')
const { Collection } = require('discord.js')
const fetch = require('node-fetch')
const { URLSearchParams } = require('url')
// const Discord = require('discord.js')

class AudioManager {
  /**
   * @param {Object} options - Options for AudioManager
   * @param {Client} options.client - AudioManager Client
   * @param {Array} options.nodes - Audio Nodes
   * @param {Number} options.shards - Shards Count
   */
  constructor (options) {
    this.client = options.client
    this.players = new Collection()
    this.manager = null
    this._options = options
  }

  /**
   * Init AudioManager
   */
  init () {
    this.client.logger.info('[Audio] Init Audio...')
    this.manager = new PlayerManager(this.client, this._options.nodes, {
      user: this.client.user.id,
      shards: this._options.shards
    })
  }

  /**
   * Gets best node - Sort by playing players
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
    this.client.logger.debug(`[DEBUG] Joining Voice Channel (VoiceChannel: ${options.channel}, Guild: ${options.guild})`)
    const player = new AudioPlayer({ AudioManager: this, client: this.client, guild: options.guild, channel: options.channel })
    player.join()
    this.players.set(options.guild, player)
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

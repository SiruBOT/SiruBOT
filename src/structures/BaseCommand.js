const DiscordClient = require('discord.js').Client
class BaseCommand {
  /**
   * @description - Constructors of BaseCommand
   * @typedef {{listenStatus: Boolean, sameChannel: Boolean, voiceIn: Boolean}} voiceStatus
   * @param {CustomClient} client - Your Client
   * @param {String} name - Command Name
   * @param {Array<String>} aliases - Command Aliases
   * @param {Array<String>} permissions - Command Permissions
   * @param {String} category - Command Category
   * @param {{audioNodes: Boolean, playingStatus: Boolean, voiceStatus: voiceStatus}} requirements - Requirements Object
   * @param {Boolean} [hide=false] - Command hide status
   */
  constructor (client, name, aliases, permissions, category, requirements, hide = false) {
    if ((client instanceof DiscordClient) === false) throw new Error('supplied constructor `client` is must be instance of Discord.Client')
    this.client = client
    if (typeof name !== 'string') throw new Error('supplied constructor `name` is must be String')
    this.name = name
    if (!Array.isArray(aliases)) throw new Error('supplied constructor `aliases` is must be Array<String>')
    this.aliases = aliases.filter(alias => typeof alias === 'string')
    if (!Array.isArray(permissions)) throw new Error('supplied constructor `permissions` is must be Array<String>')
    this.permissions = permissions
    if (typeof category !== 'string') throw new Error('supplied constructor `category` is must be String')
    this.category = category
    if (!requirements) throw new Error('constructor `requirements<Object>` is not supplied')
    this.requirements = Object.assign({})
    const { audioNodes, playingStatus, voiceStatus } = requirements
    if (typeof audioNodes !== 'boolean') throw new Error('supplied constructor `requirements.audioNodes` is must be Boolean')
    Object.defineProperty(this.requirements, 'audioNodes', { value: audioNodes, enumerable: true })
    if (typeof playingStatus !== 'boolean') throw new Error('supplied constructor `requirements.playingStatus` is must be Boolean')
    Object.defineProperty(this.requirements, 'playingStatus', { value: playingStatus, enumerable: true })
    if (!voiceStatus) throw new Error('constructor `requirements.voiceStatus<Object>` is not supplied')
    const { listenStatus, sameChannel, voiceIn } = voiceStatus
    if (typeof listenStatus !== 'boolean') throw new Error('supplied constructor `requirements.voiceStatus.listenStatus` is must be Boolean')
    Object.defineProperty(voiceStatus, 'listenStatus', { value: listenStatus, enumerable: true })
    if (typeof sameChannel !== 'boolean') throw new Error('supplied constructor `requirements.voiceStatus.sameChannel` is must be Boolean')
    Object.defineProperty(voiceStatus, 'sameChannel', { value: typeof voiceStatus.sameChannel === 'boolean' ? voiceStatus.sameChannel : false, enumerable: true })
    if (typeof voiceIn !== 'boolean') throw new Error('supplied constructor `requirements.voiceStatus.voiceIn` is must be Boolean')
    Object.defineProperty(voiceStatus, 'voiceIn', { value: voiceIn, enumerable: true })
    Object.defineProperty(this.requirements, 'voiceStatus', { value: voiceStatus, enumerable: true })
    if (typeof hide !== 'boolean') throw new Error('supplied constructor `hide` is must be Boolean')
    this.hide = hide
  }

  /**
   * @description - Run function is must be async
   * @returns {Promise<*>} - Returns Any Values (includes void)
   */
  async run () {

  }
}

module.exports = BaseCommand

const Discord = require('discord.js')
const LocalePicker = require('./LocalePicker')
const DataBase = require('./DataBase')
const Audio = require('./audio/Audio')
const Logger = require('./Logger')
const Image = require('./image/Image')
const utils = require('../utils')
const { getSettings, PermissionChecker } = utils
const Sentry = require('@sentry/node')
const fs = require('fs')
const path = require('path')
const Inko = require('inko')
const inko = new Inko()

class CustomClient extends Discord.Client {
  constructor (options) {
    super(options.clientOptions)

    this.classPrefix = '[Client'
    this.defaultPrefix = {
      init: `${this.classPrefix}:init]`,
      LoadCommands: `${this.classPrefix}:LoadCommands]`,
      registerEvents: `${this.classPrefix}:registerEvents]`,
      setActivity: `${this.classPrefix}:setActivity]`,
      reload: `${this.classPrefix}:reload]`
    }

    this.announceActivity = null

    this._isTesting = getSettings.isTesting()
    this._options = options
    this.logger = new Logger(this)
    this.database = new DataBase(this)

    this.utils = utils
    this.utils.localePicker = new LocalePicker(this)
    this.utils.permissionChecker = new PermissionChecker(this)
    this.utils.image = new Image(this.logger)

    this.activityNum = 0
    this.initialized = false
    if (this._options.sentry) Sentry.init({ dsn: this._options.sentry })
    this.commands_loaded = false
    this.commands = new Discord.Collection()
    this.events = new Discord.Collection()
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()

    this.audio = new Audio(this, this._options.audio.nodes, { restTimeout: 10000, moveOnDisconnect: true, reconnectTries: 10, noReplace: false })
  }

  async init () {
    if (this.initialized) {
      this.logger.error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
      throw new Error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
    }
    if (!this._isTesting) { this.logger.info(`${this.defaultPrefix.init} Initializing Bot..`) }
    await this.utils.localePicker.init()
    this.registerEvents()
    this.LoadCommands()
    if (!this._isTesting) {
      this.database.init()
      this.login(this._options.bot.token)
    }
  }

  /**
   * @param {*} channel - Channel ID for compare
   * @param {*} id - Database's Channel ID for compare
   */
  chkRightChannel (channel, id) {
    if (id === channel.id) return true
    if (id === '0') return true
    if (this.channels.cache.get(id)) return this.channels.cache.get(id).id === channel.id
    else return true
  }

  /**
   * @description - Load Commands files in commands folder
   * @returns {Collection} - Command Collection
   */
  async LoadCommands () {
    const CommandsFile = await this.utils.async.globAsync(path.join(process.cwd(), './src/commands/**/*.js'))
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `${this.defaultPrefix.LoadCommands} [${reLoadOrLoad}]`
    this.logger.info(`${load} Loading Commands (${CommandsFile.length} Files)`)
    this.logger.debug(`${load} (Commands: ${CommandsFile.join(', ')})`)
    for (const cmd of CommandsFile) {
      if (!cmd.split('/').slice(-1).shift().startsWith('!')) {
        try {
          const Command = require(cmd)
          const command = new Command(this)
          this.logger.debug(`${load} Loading Command (${command.name})`)
          const addAliases = (name) => {
            const ko2enResult = inko.ko2en(name)
            const en2koResult = inko.en2ko(name)
            if (!command.aliases.includes(ko2enResult)) {
              command.aliases.push(ko2enResult)
            }
            if (!command.aliases.includes(en2koResult)) {
              command.aliases.push(en2koResult)
            }
          }
          addAliases(command.name)
          command.aliases.map(addAliases)
          this.logger.debug(`${load} Adding ${command.aliases.length} Aliases ${command.aliases.join(', ')} of Command ${command.name}`)
          for (const aliases of command.aliases) {
            this.aliases.set(aliases, command.name)
          }
          this.commands.set(command.name, command)
        } catch (e) {
          this.logger.error(`${load} Command Load Error Ignore it... ${cmd}`)
          this.logger.error(`${load} ${e.stack || e.message}`)
        }
        delete require.cache[require.resolve(cmd)]
      } else {
        this.logger.warn(`${load} Ignore file ${cmd} (Starts !)`)
      }
    }
    this.commands_loaded = true
    for (const item of this.commands.array().filter(el => el.hide === false)) {
      if (!this.categories.keyArray().includes(item.category)) this.categories.set(item.category, [])
      if (this.categories.keyArray().includes(item.category) && this.categories.get(item.category).includes(item.name) === false) {
        const array = this.categories.get(item.category)
        array.push(item.name)
        this.categories.set(item.category, array)
      }
    }
    this.logger.info(`${this.defaultPrefix.LoadCommands} Successfully ${reLoadOrLoad}ed Commands!`)
    if (this._isTesting) process.exit(0)
    return this.commands
  }

  /**
   * @description Register Events in events folder
   */
  async registerEvents (reload = false) {
    this.logger.info(`${this.defaultPrefix.registerEvents} Registering Events...`)
    const eventsFile = await this.utils.async.globAsync(path.join(process.cwd(), './src/events/**/*.js'))
    this.logger.debug(`${this.defaultPrefix.registerEvents} Event Files: ${eventsFile.join(' | ')}`)
    if (reload) {
      for (const reloadEvent of this.events.array()) {
        this.events.delete(reloadEvent.name)
        this.removeListener(reloadEvent.name, reloadEvent.listener)
        this.logger.debug(`${this.defaultPrefix.registerEvents} Remove Event ${reloadEvent.name}'s Listener`)
      }
    }
    for (const filePath of eventsFile) {
      const Event = require(filePath)
      const event = new Event(this)
      this.on(event.name, event.listener)
      this.events.set(event.name, event)
      this.logger.debug(`${this.defaultPrefix.registerEvents} Registering Event Listener ${event.name}`)
    }
    this.logger.info(`${this.defaultPrefix.registerEvents} Events Successfully Loaded!`)
  }

  async setActivity () {
    if (this.user) {
      if (this.announceActivity) {
        await this.user.setActivity(this.announceActivity.act || 'Errored', this.announceActivity.options || {})
        await this.user.setStatus(this.announceActivity.status || 'online')
        this.logger.debug(`${this.defaultPrefix.setActivity} Setting Bot's Activity to ${this.announceActivity.act || 'Errored'}`)
      } else {
        this.activityNum++
        if (!this._options.bot.games[this.activityNum]) this.activityNum = 0
        const activity = await this.getActivityMessage(this._options.bot.games[this.activityNum])
        this.logger.debug(`${this.defaultPrefix.setActivity} Setting Bot's Activity to ${activity}`)
        await this.user.setActivity(activity, { url: 'https://www.twitch.tv/discordapp', type: 'STREAMING' })
      }
      setTimeout(() => this.setActivity(), this._options.bot.gamesInterval)
    }
  }

  async getActivityMessage (message) {
    return message.replace('%PING%', await this.getvalue('ping'))
      .replace('%GUILDS%', await this.getvalue('guilds'))
      .replace('%USERS%', await this.getvalue('users'))
      .replace('%CHANNELS%', await this.getvalue('channels'))
      .replace('%SHARDCOUNT%', await this.getvalue('shards'))
  }

  async getvalue (type) {
    let value
    switch (type) {
      case 'ping':
        if (!this.shard) value = this.ws.ping
        else value = await this.shard.fetchClientValues('ws.ping').then(res => (res.reduce((prev, val) => prev + val, 0) / this._options.shard.count).toFixed(1)).catch(0)
        return value
      case 'channels':
        if (!this.shard) value = this.channels.cache.size
        else value = await this.shard.fetchClientValues('channels.cache.size').then(res => res.reduce((prev, val) => prev + val, 0)).catch(0)
        return value
      case 'guilds':
        if (!this.shard) value = this.guilds.cache.size
        else value = await this.shard.fetchClientValues('guilds.cache.size').then(res => res.reduce((prev, val) => prev + val, 0)).catch(0)
        return value
      case 'users':
        if (!this.shard) value = this.users.cache.size
        else value = await this.shard.fetchClientValues('users.cache.size').then(res => res.reduce((prev, val) => prev + val, 0)).catch(0)
        return value
      case 'shards':
        if (!this.shard) value = 1
        else value = this.shard.count
        return value
    }
  }

  async clearAudio () {
    const players = this.audio.players
    this.logger.info(`[Shutdown] Disconnect All Players.... (${players.size} Players)`)
    for (const player of this.audio.players.values()) {
      const { voiceConnection } = player
      this.logger.debug(`[Shutdown] Stopping player of guild: ${voiceConnection.guildID}`)
      this.audio.stop(voiceConnection.guildID, false)
    }
    return true
  }

  reload () {
    const Mongo = require('mongoose')
    for (const name of Mongo.modelNames()) {
      this.logger.warn(`${this.defaultPrefix.reload} Deleted MongoDB Model ${name}`)
      Mongo.deleteModel(name)
    }
    const removeCacheFolderRecursive = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
          const curPath = path.join(dirPath, file)
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            removeCacheFolderRecursive(curPath)
          } else { // Delete Cache
            this.logger.warn(`${this.defaultPrefix.reload} Deleted Cache ${curPath}`)
            delete require.cache[require.resolve(curPath)]
          }
        })
      }
    }
    removeCacheFolderRecursive(path.join(process.cwd(), './src'))
    removeCacheFolderRecursive(path.join(process.cwd(), './resources'))
    delete require.cache[require.resolve(path.join(process.cwd(), './settings.js'))]
    this._options = getSettings()
    this.utils = require('../utils')
    const LocalePicker = require('./LocalePicker')
    const Image = require('./image/Image')
    const DataBase = require('./DataBase')
    this.database = new DataBase(this)
    this.database.init()
    const { PermissionChecker } = utils
    this.utils = utils
    this.utils.localePicker = new LocalePicker(this)
    this.utils.permissionChecker = new PermissionChecker(this)
    this.utils.image = new Image(this.logger)
    this.utils.localePicker.init()
    this.commands = new Discord.Collection()
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()
    this.LoadCommands()
    this.registerEvents(true)
    return this.shard ? this.shard.ids : 0
  }

  shutdown () {
    this.shuttingDown = true
    this.clearAudio().then(() => {
      this.logger.warn('[Shutdown] Shutting Down In 10 seconds...')
      setTimeout(() => {
        process.exit(0)
      }, 10000)
    })
    return this.shard ? this.shard.ids : 0
  }
}

module.exports = CustomClient

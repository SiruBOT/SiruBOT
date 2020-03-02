const Discord = require('discord.js')
const LocalePicker = require('./locales/localePicker')
const { PermissionChecker, DataBase, Audio, Logger } = require('./modules')
const settings = require('./modules/checker/getSettings')()
const isTesting = require('./modules/checker/isTesting')()
const ServerLoggingManager = require('./modules/logging/serverLoggerManager')
const redis = require('redis')

class Client extends Discord.Client {
  constructor (options) {
    super()

    this.classPrefix = '[Client'
    this.defaultPrefix = {
      init: `${this.classPrefix}:init]`,
      LoadCommands: `${this.classPrefix}:LoadCommands]`,
      registerEvents: `${this.classPrefix}:registerEvents]`,
      setActivity: `${this.classPrefix}:setActivity]`
    }

    this._isTesting = isTesting
    this._options = options
    this.logger = new Logger(this)
    this.database = new DataBase(this)

    this.utils = require('./modules/utils')
    this.utils.localePicker = new LocalePicker(this)
    this.utils.permissionChecker = new PermissionChecker(this)

    this.activityNum = 0
    this.initialized = false

    this.commands_loaded = false
    this.commands = new Discord.Collection()
    this.events = new Discord.Collection()
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()

    this.audio = new Audio(this,
      this._options.audio.nodes,
      {
        restTimeout: 10000
      })

    this.redisClient = redis.createClient(this._options.db.redis)

    this.loggerManager = new ServerLoggingManager(this)
  }

  init () {
    if (this.initialized) {
      this.logger.error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
      return new Error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
    }
    if (!isTesting) { this.logger.info(`${this.defaultPrefix.init} Initializing Bot..`) }
    this.utils.localePicker.init()
    this.loggerManager.init()
    this.registerEvents()
    this.LoadCommands()
    if (!isTesting) {
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
    if (this.channels.cache.get(id)) {
      if (this.channels.cache.get(id).id === channel.id) return true
      else return false
    } else {
      return true
    }
  }

  /**
   * @description - Load Commands files in commands folder
   * @returns {Collection} - Command Collection
   */
  async LoadCommands () {
    const CommandsFile = await this.utils.async.globAsync('./commands/**/*.js')
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `${this.defaultPrefix.LoadCommands} [${reLoadOrLoad}]`
    this.logger.info(`${load} Loading Commands (${CommandsFile.length} Files)`)
    this.logger.debug(`${load} (Commands: ${CommandsFile.join(', ')})`)
    for (const cmd of CommandsFile) {
      if (!cmd.split('/').slice(-1)[0].startsWith('!')) {
        try {
          const Command = require(cmd)
          const command = new Command(this)
          this.logger.debug(`${load} Loading Command (${command.command.name})`)
          for (const aliases of command.command.aliases) {
            this.logger.debug(`${load} Loading Aliases (${aliases}) of Command ${command.command.name}`)
            this.aliases.set(aliases, command.command.name)
          }
          this.commands.set(command.command.name, command)
        } catch (e) {
          this.logger.error(`${load} Command Load Error Ignore it...`)
          this.logger.error(`${load} ${e.stack || e.message}`)
        }
        delete require.cache[require.resolve(cmd)]
      } else {
        this.logger.warn(`${load} Ignore file ${cmd} (Starts !)`)
      }
    }
    this.commands_loaded = true
    for (const item of this.commands.array().map(el => el.command).filter(el => el.hide === false)) {
      if (!this.categories.keyArray().includes(item.category)) this.categories.set(item.category, [])
      if (this.categories.keyArray().includes(item.category) && this.categories.get(item.category).includes(item.name) === false) {
        const array = this.categories.get(item.category)
        array.push(item.name)
        this.categories.set(item.category, array)
      }
    }
    this.logger.info(`${this.defaultPrefix.LoadCommands} Successfully ${reLoadOrLoad}ed Commands!`)
    if (isTesting) process.exit(0)
    return this.commands
  }

  /**
   * @description Register Events in events folder
   */
  async registerEvents (reload = false) {
    this.logger.info(`${this.defaultPrefix.registerEvents} Registering Events...`)
    const eventsFile = await this.utils.async.globAsync('./events/**/*.js')
    this.logger.debug(`${this.defaultPrefix.registerEvents} Event Files: ${eventsFile.join(' | ')}`)
    for (const file of eventsFile) {
      const EventClass = require(file)
      const Event = new EventClass(this)
      if (reload) {
        this.logger.warn(`${this.defaultPrefix.registerEvents} Removing Event Listener for event ${EventClass.info.event}`)
        this.removeListener(EventClass.info.event, this.events.get(EventClass.info.event))
        this.events.delete(EventClass.info.event)
      }
      delete require.cache[require.resolve(file)]
      this.logger.info(`${this.defaultPrefix.registerEvents} AddedEvent Listener for event ${EventClass.info.event}`)
      this.events.set(EventClass.info.event, (...args) => Event.run(...args))
      this.on(EventClass.info.event, this.events.get(EventClass.info.event))
    }
    this.logger.info(`${this.defaultPrefix.registerEvents} Events Successfully Loaded!`)
  }

  async setActivity () {
    if (this.user) {
      if (this.announceActivity) {
        this.user.setActivity(this.announceActivity.act || 'Errored', this.announceActivity.options || {})
        this.user.setStatus(this.announceActivity.status || 'online')
        this.logger.debug(`${this.defaultPrefix.setActivity} Setting Bot's Activity to ${this.announceActivity.act || 'Errored'}`)
      } else {
        this.activityNum++
        if (!this._options.bot.games[this.activityNum]) this.activityNum = 0
        const activity = await this.getActivityMessage(this._options.bot.games[this.activityNum])
        this.logger.debug(`${this.defaultPrefix.setActivity} Setting Bot's Activity to ${activity}`)
        this.user.setActivity(activity, { url: 'https://www.twitch.tv/discordapp', type: 'STREAMING' })
      }
      setTimeout(() => this.setActivity(), this._options.bot.gamesInterval)
    }
  }

  async getActivityMessage (message) {
    const ping = await this.getvalue('ping')
    const guilds = await this.getvalue('guilds')
    const users = await this.getvalue('users')
    const channels = await this.getvalue('channels')
    return message.replace('%PING%', ping).replace('%GUILDS%', guilds).replace('%USERS%', users).replace('%CHANNELS%', channels)
  }

  async getvalue (type) {
    let value
    switch (type) {
      case 'ping':
        value = await this.shard.fetchClientValues('ws.ping').then(res => (res.reduce((prev, val) => prev + val, 0) / this._options.bot.shards).toFixed(1))
        if (!value) value = this.ping
        return value
      case 'channels':
        value = await this.shard.fetchClientValues('channels.cache.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.channels.size
        return value
      case 'guilds':
        value = await this.shard.fetchClientValues('guilds.cache.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.guilds.size
        return value
      case 'users':
        value = await this.shard.fetchClientValues('users.cache.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.users.size
        return value
    }
  }

  async clearAudio () {
    const players = this.audio.players
    this.logger.info(`[Shutdown] Disconnect All Players.... (${players.size} Players)`)
    for (const player of client.audio.players.values()) {
      this.logger.debug(`[Shutdown] Stopping player of guild: ${player.guild}`)
      client.audio.stop(player.voiceConnection.guildID, false)
    }
    return true
  }

  reload () {
    delete require.cache[require.resolve('./settings.js')]
    this._options = require('./settings.js')
    delete require.cache[require.resolve('./models')]
    this.database.Models = require('./models')
    delete require.cache[require.resolve('./modules/utils')]
    this.utils = require('./modules/utils')
    delete require.cache[require.resolve('./locales/localePicker')]
    delete require.cache[require.resolve('./modules')]
    const NewLocalePicker = require('./locales/localePicker')
    const NewPermissionChecker = require('./modules').PermissionChecker
    this.utils.localePicker = new NewLocalePicker(this)
    this.utils.permissionChecker = new NewPermissionChecker(this)
    this.utils.localePicker.init()
    this.loggerManager.init()
    this.commands = new Discord.Collection()
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()
    this.LoadCommands()
    this.registerEvents(true)
    return this.shard.ids
  }

  shutdown () {
    this.shuttingDown = true
    this.clearAudio().then(() => {
      this.logger.warn('[Shutdown] Shutting Down In 10 seconds...')
      setTimeout(() => {
        process.exit(0)
      }, 10000)
    })
    return this.shard.ids
  }
}

const client = new Client(settings)
client.init()

process.on('uncaughtException', (err) => {
  client.logger.error(err)
})

process.on('unhandledRejection', (reason, promise) => {
  client.logger.error(`UnHandledRejection: ${reason}, Promise: ${promise}`)
  promise.catch((e) => {
    client.logger.error(e.stack)
  })
})

process.on('message', (data) => {
  if (data === 'spawned-all-shards') client.setActivity()
})

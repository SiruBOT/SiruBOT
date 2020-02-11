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
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()

    // this.audio = new Audio({ client: this, shards: this._options.audio.shards, nodes: this._options.audio.nodes })
    this.audio = new Audio(this,
      this._options.audio.nodes,
      {
        moveOnDisconnect: false,
        resumable: 'sirubot',
        resumableTimeout: 60,
        reconnectTries: 1500,
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
    if (this.channels.get(id)) {
      if (this.channels.get(id).id === channel.id) return true
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
    const CommandsFile = await this.utils.asyncFunc.globAsync('./commands/**/*.js')
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `${this.defaultPrefix.LoadCommands} [${reLoadOrLoad}]`
    this.logger.info(`${load} Loading Commands (${CommandsFile.length} Files)`)
    this.logger.debug(`${load} (Commands: ${CommandsFile.join(', ')})`)
    for (const cmd of CommandsFile) {
      if (!cmd.split('/').slice(-1)[0].startsWith('!')) {
        const Command = require(cmd)
        const command = new Command(this)
        this.logger.debug(`${load} Loading Command (${command.command.name})`)
        for (const aliases of command.command.aliases) {
          this.logger.debug(`${load} Loading Aliases (${aliases}) of Command ${command.command.name}`)
          this.aliases.set(aliases, command.command.name)
        }
        this.commands.set(command.command.name, command)
        delete require.cache[require.resolve(cmd)]
      } else {
        this.logger.warn(`${load} Ignore file ${cmd} (Starts !)`)
      }
    }
    this.commands_loaded = true
    this.categories = new Discord.Collection()
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
  async registerEvents () {
    this.logger.info(`${this.defaultPrefix.registerEvents} Registering Events...`)
    const eventsFile = await this.utils.asyncFunc.globAsync('./events/**/*.js')
    this.logger.debug(`${this.defaultPrefix.registerEvents} Event Files: ${eventsFile.join(' | ')}`)
    for (const file of eventsFile) {
      const EventClass = require(file)
      const Event = new EventClass(this)
      this.logger.warn(`${this.defaultPrefix.registerEvents} Removing Event Listener for event ${EventClass.info.event}`)
      this.removeAllListeners(EventClass.info.event)
      delete require.cache[require.resolve(file)]
      this.logger.info(`${this.defaultPrefix.registerEvents} AddedEvent Listener for event ${EventClass.info.event}`)
      this.on(EventClass.info.event, (...args) => Event.run(...args))
    }
    this.logger.info(`${this.defaultPrefix.registerEvents} Events Successfully Loaded!`)
  }

  /**
   * @description set Activity Interval (15000 Secs)
   */
  activityInterval () {
    this.setActivity()
    setInterval(() => {
      this.setActivity()
    }, this._options.bot.gamesInterval)
  }

  async setActivity (act = undefined) {
    if (this.user) {
      this.activityNum++
      if (!this._options.bot.games[this.activityNum]) this.activityNum = 0
      if (!act) act = await this.getActivityMessage(this._options.bot.games[this.activityNum])
      this.logger.debug(`${this.defaultPrefix.setActivity} Setting Bot's Activity to ${act}`)
      this.user.setActivity(act, { url: 'https://www.twitch.tv/discordapp', type: 'STREAMING' })
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
        value = await this.shard.fetchClientValues('channels.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.channels.size
        return value
      case 'guilds':
        value = await this.shard.fetchClientValues('guilds.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.guilds.size
        return value
      case 'users':
        value = await this.shard.fetchClientValues('users.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.users.size
        return value
    }
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
  if (data === 'spawned-all-shards') client.activityInterval()
})

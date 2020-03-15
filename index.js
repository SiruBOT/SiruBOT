const Discord = require('discord.js')
const LocalePicker = require('./locales/localePicker')
const { PermissionChecker, DataBase, Audio, Logger, Image, ServerLogger, getSettings } = require('./modules')
const redis = require('redis')
const fs = require('fs')
const path = require('path')

class Client extends Discord.Client {
  constructor (options) {
    super()

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

    this.utils = require('./modules/utils')
    this.utils.localePicker = new LocalePicker(this)
    this.utils.permissionChecker = new PermissionChecker(this)
    this.utils.image = new Image(this.logger)

    this.activityNum = 0
    this.initialized = false

    this.commands_loaded = false
    this.commands = new Discord.Collection()
    this.events = new Discord.Collection()
    this.aliases = new Discord.Collection()
    this.categories = new Discord.Collection()

    this.audio = new Audio(this, this._options.audio.nodes, { restTimeout: 10000, moveOnDisconnect: 10, reconnectTries: 10 })

    this.redisClient = redis.createClient(this._options.db.redis)

    this.loggerManager = new ServerLogger.ServerLoggerManager(this)
  }

  async init () {
    if (this.initialized) {
      this.logger.error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
      throw new Error(`${this.defaultPrefix.init} Bot is Already Initialized!`)
    }
    if (!this._isTesting) { this.logger.info(`${this.defaultPrefix.init} Initializing Bot..`) }
    await this.utils.localePicker.init()
    await this.loggerManager.init()
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
          this.logger.error(`${load} Command Load Error Ignore it... ${cmd}`)
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
    if (this._isTesting) process.exit(0)
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
        if (!value) value = this.channels.cache.size
        return value
      case 'guilds':
        value = await this.shard.fetchClientValues('guilds.cache.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.guilds.cache.size
        return value
      case 'users':
        value = await this.shard.fetchClientValues('users.cache.size').then(res => res.reduce((prev, val) => prev + val, 0))
        if (!value) value = this.users.cache.size
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
    const removeCacheFolderRecursive = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
          const curPath = path.join(dirPath, file)
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            removeCacheFolderRecursive(curPath)
          } else { // Delete Cache
            this.logger.warn(`${this.defaultPrefix.reload} Deleted Cache ${process.cwd()}${curPath}`)
            delete require.cache[require.resolve(path.join(process.cwd(), curPath))]
          }
        })
      }
    }
    const arr = ['./locales', './commands', './events', './modules', './resources']
    for (const item of arr) {
      removeCacheFolderRecursive(item)
    }
    delete require.cache[require.resolve(path.join(process.cwd(), './settings.js'))]
    this._options = require('./settings.js')
    this.utils = require('./modules/utils')
    const NewLocalePicker = require('./locales/localePicker')
    const NewPermissionChecker = require('./modules/utils/PermissionChecker')
    const NewImage = require('./modules/image/images')
    this.utils.localePicker = new NewLocalePicker(this)
    this.utils.permissionChecker = new NewPermissionChecker(this)
    this.utils.image = new NewImage(this.logger)
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

const client = new Client(getSettings())
client.init().then(() => {
  client.logger.info('[BOT] Init Success')
}).catch((e) => {
  console.error(e.stack)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  client.logger.error(err)
})

process.on('unhandledRejection', (reason, promise) => {
  client.logger.error(`UnHandledRejection: ${reason}, Promise: ${promise}`)
  promise.catch((e) => {
    client.logger.error(e.stack)
  })
})

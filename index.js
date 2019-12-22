const Discord = require('discord.js')
const LocalePicker = require('./locales/localePicker')
const { PermissionChecker, DataBase, Audio, Logger } = require('./modules')

const settings = require('./modules/checker/getSettings')()
const isTesting = require('./modules/checker/isTesting')()

class Client extends Discord.Client {
  constructor (options) {
    super()
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

    this.audio = new Audio({ client: this, shards: this._options.audio.shards, nodes: this._options.audio.nodes })
  }

  init () {
    if (this.initialized) {
      this.logger.error('[BOT] Bot is Already Initialized!')
      return new Error('[BOT] Bot is Already Initialized!')
    }
    if (!isTesting) { this.logger.info('[BOT] Initializing Bot..') }
    this.utils.localePicker.init()
    this.registerEvents()
    this.LoadCommands()
    if (!isTesting) this.login(this._options.bot.token)
  }

  getRightChannel (channel, id) {
    if (id === channel.id) return true
    if (id === '0') return true
    if (this.channels.get(id)) {
      if (this.channels.get(id).id === channel.id) return true
      else return false
    } else {
      return true
    }
  }

  async LoadCommands () {
    const CommandsFile = await globAsync('./commands/**/*.js')
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `[Commands] [${reLoadOrLoad}]`
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
        this.logger.info(`${load} Ignore file ${cmd} (Starts !)`)
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
    this.logger.info(`[Commands] Successfully ${reLoadOrLoad}ed Commands!`)
    return this.commands
  }

  async registerEvents () {
    this.logger.info('[Events] Registering Events...')
    const eventsFile = await globAsync('./events/*.js')
    this.logger.debug(`[Events] Event Files: ${eventsFile.join(' | ')}`)
    for (const file of eventsFile) {
      const EventClass = require(file)
      const Event = new EventClass(this)
      this.on(EventClass.info.event, (...args) => Event.run(...args))
    }
    this.logger.info('[Events] Events Successfully Loaded!')
  }

  activityInterVal () {
    this.setActivity()
    setInterval(() => {
      this.setActivity()
    }, 15000)
  }

  setActivity (act = undefined) {
    this.activityNum++
    if (!this._options.bot.games[this.activityNum]) this.activityNum = 0
    if (!act) act = this.getActivityMessage(this._options.bot.games[this.activityNum])
    this.logger.debug(`[Activity] Setting Bot's Activity to ${act}`)
    this.user.setActivity(act, { url: 'https://www.twitch.tv/discordapp', type: 'STREAMING' })
  }

  async getActivityMessage (message) {
    const ping = await this.getvalue('ping')
    const guilds = await this.getvalue('guilds')
    const users = await this.getvalue('users')
    const channels = await this.getvalue('channels')
    return message.replace('%PING%', `${ping}ms`).replace('%GUILDS%', guilds).replace('%USERS%', users).replace('%CHANNELS%', channels)
  }

  async getvalue (type) {
    let value
    switch (type) {
      case 'ping':
        value = await this.shard.fetchClientValues('ping').then(res => res.reduce((prev, val) => prev + val, 0) / this._options.bot.shards)
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

function globAsync (path) {
  return new Promise((resolve, reject) => {
    require('glob')(path, (er, res) => {
      if (er) reject(er)
      else resolve(res)
    })
  })
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

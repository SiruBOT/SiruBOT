const Discord = require('discord.js')
const Logger = require('./logger')
const DataBase = require('./modules/database')
const Audio = require('./modules/audio/Audio')
const LocalePicker = require('./locales/localePicker')
const PermissionChecker = require('./modules/utils/perMissionChecker')

const isTesting = (() => {
  if (process.argv[2] === 'test') return true
  else return false
})()

const getSettings = () => {
  if (isTesting) return require('./settings.inc.js')
  else return require('./settings')
}

class Bot extends Discord.Client {
  constructor (options) {
    super()
    this._options = options
    this.logger = new Logger(this)
    this.database = new DataBase(this)

    this.utils = require('./modules/utils')
    this.utils.localePicker = new LocalePicker(this)
    this.utils.permissionChecker = new PermissionChecker(this)

    this.activityNum = 0
    this.initialized = false
    this.commands_loaded = false
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

  getRightTextChannel (channel, id) {
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
    this.commands = new Discord.Collection()
    this.aliases = new Discord.Collection()
    const CommandsFile = await globAsync('./commands/**/*.js')
    const reLoadOrLoad = `${this.commands_loaded ? '(re)' : ''}Load`
    const load = `[Commands] [${reLoadOrLoad}]`
    this.logger.info(`${load} Loading Commands (${CommandsFile.length} Files)`)
    this.logger.debug(`${load} (Commands: ${CommandsFile.join(', ')})`)
    for (const cmd of CommandsFile) {
      const Command = require(cmd)
      const command = new Command(this)
      this.logger.debug(`${load} Loading Command (${command.command.name})`)
      for (const aliases of command.command.aliases) {
        this.logger.debug(`${load} Loading Aliases (${aliases}) of Command ${command.command.name}`)
        this.aliases.set(aliases, command.command.name)
      }
      this.commands.set(command.command.name, command)
      delete require.cache[require.resolve(cmd)]
    }
    this.commands_loaded = true
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

  ActivityInterVal () {
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

  getActivityMessage (message) {
    const msg = message.replace('%ping%', `${this.pings[0]}ms`).replace('%guilds%', this.guilds.size).replace('%users%', this.users.size)
    return msg
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

const client = new Bot(getSettings())
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

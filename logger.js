const winston = require('winston')
const isTesting = (() => {
  if (process.argv[2] === 'test') return true
  else return false
})()

const getSettings = () => {
  if (isTesting) return require('./settings.inc.js')
  else return require('./settings')
}

const settings = getSettings().logger
require('winston-daily-rotate-file')
require('date-utils')

const DailyRotateFile = new winston.transports.DailyRotateFile({
  level: 'debug',
  filename: 'logs/siru-%DATE%.log',
  zippedArchive: true,
  format: winston.format.printf(info => `[${new Date()}] [${info.level.toUpperCase()}] ${info.message}`)
})

const Console = new winston.transports.Console()

const transports = [DailyRotateFile, Console]

const colorizer = winston.format.colorize()

const logLevels = {
  levels: { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'green',
    verbose: 'gray',
    debug: 'cyan',
    silly: 'yellow'
  }
}
winston.addColors(logLevels)
const logger = winston.createLogger({
  level: settings.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf(info =>
      colorizer.colorize(info.level, `[${new Date().toFormat('HH24:MI:SS')}] [${info.level.toUpperCase()}] ${info.message}`)
    )
  ),
  transports: transports
})

class Logger {
  constructor (client = {}) {
    this.client = client
    this._logger = logger
  }

  getMessage (message = undefined) {
    if (this.client.shard) {
      return `[Shard ${this.client.shard.id}] ${message}`
    } else {
      return message
    }
  }

  info (...args) {
    this._logger.info(this.getMessage(...args))
  }

  error (...args) {
    this._logger.error(this.getMessage(...args))
  }

  debug (...args) {
    this._logger.debug(this.getMessage(...args))
  }

  warn (...args) {
    this._logger.warn(this.getMessage(...args))
  }
}
module.exports = Logger

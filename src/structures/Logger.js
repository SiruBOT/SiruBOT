const settings = require('../utils/getSettings')()
const winston = require('winston')
require('winston-daily-rotate-file') // Require winston transports
require('date-utils') // Some prototypes

const Console = new winston.transports.Console()

const colorize = winston.format.colorize()

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

module.exports = (name) => {
  const format = info => `[${name}] [${new Date().toFormat('HH24:MI:SS')}] [${info.ms}] [${info.level.toUpperCase()}] ${info.message}`
  const DailyRotateFileSingle = new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: `logs/${name}/%DATE%.log`,
    zippedArchive: true,
    format: winston.format.printf(format)
  })
  const DailyRotateFileAll = new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: 'logs/%DATE%.log',
    zippedArchive: true,
    format: winston.format.printf(format)
  })
  const transports = [DailyRotateFileSingle, DailyRotateFileAll, Console]
  return winston.createLogger({
    level: settings.logger.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple(),
      winston.format.ms(),
      winston.format.printf(info =>
        colorize.colorize(info.level, format(info))
      )
    ),
    transports: transports
  })
}

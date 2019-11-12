const Logger = require('../../logger')
const logger = new Logger()
module.exports = function (message, data) {
  logger.debug(`[Utils] [Safe_Edit] Edit Message ${message.id} to ${escapeLineBreak(data)}...`)
  message.edit(data).catch((e) => {
    logger.debug(`[Utils] [Safe_Edit] Edit Message Not Found. Sending Message.. (Channel: ${message.channel})`)
    message.channel.send(data)
  })
}

const escapeLineBreak = (data) => {
  return data.replace(/\n/g, '(Line Break)')
}

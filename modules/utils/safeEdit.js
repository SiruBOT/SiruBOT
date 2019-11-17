const Logger = require('../../logger')
const logger = new Logger()
const Discord = require('discord.js')
module.exports = safeEdit
/**
 *
 * @param {Discord.Message} message - To Edit
 * @param {String} data - Edit Data
 */
function safeEdit (message, data) {
  logger.debug(`[Utils] [Safe_Edit] Edit Message ${message.id} to ${escapeLineBreak(data)}...`)
  message.edit(data).catch((e) => {
    logger.debug(`[Utils] [Safe_Edit] Edit Message Not Found. Sending Message.. (Channel: ${message.channel})`)
    message.channel.send(data)
  })
}

module.exports.massReact = massReact
/**
 * @param {Discord.Message} message - to React (Message)
 * @param {Array} array - Array to react
 */
async function massReact (message, array) {
  for (const item of array) {
    if (!message.deleted) {
      await message.react(item)
    }
  }
  return true
}

const escapeLineBreak = (data) => {
  return data.replace(/\n/g, '(Line Break)')
}

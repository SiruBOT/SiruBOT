const { Message } = require('discord.js')
/**
 * @param {Discord.Message} message Message to React
 * @param {Array} array Array of emojis
 */
module.exports.massReact = (message, array) => {
  if (array.length > 20) throw new Error('Emoji types must be < 20')
  return Promise.all(array.map(el => message.react(el)))
}

/**
 * @description A Function edit To message if message is deleted, send message to deleted message's channel
 * @param {Message} editTo message to edit
 * @param  {...any} args content to edit
 */
module.exports.safeEdit = (editTo, ...args) => {
  if (!(editTo instanceof Message)) throw new Error('editTo must be instance of DiscordJS#Message')
  if (editTo.deleted) {
    return editTo.channel.send(...args)
  } else {
    return editTo.edit(...args)
  }
}

const Errors = require('./errors')
/**
 * @param {Discord.Message} message - to React (Message)
 * @param {Array} array - Array to react
 */
module.exports.massReact = async (message, array) => {
  for (const item of array) {
    if (!message.deleted) {
      await message.react(item).catch(e => { throw new Errors.PermError(e, 'ADD_REACTIONS') })
    }
  }
  return true
}

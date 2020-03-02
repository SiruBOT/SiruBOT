/**
 * @param {Discord.Message} message - to React (Message)
 * @param {Array} array - Array to react
 */
module.exports.massReact = async (message, array) => {
  for (const item of array) {
    if (!message.deleted) {
      await message.react(item)
    }
  }
  return true
}

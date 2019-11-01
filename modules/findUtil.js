const Discord = require('discord.js')
const findElementRequiredOptions = ['filter', 'callback', 'collection']
const Numbers = ['0️⃣', '1⃣ ', '2⃣ ', '3⃣ ', '4⃣ ', '5⃣ ', '6⃣ ', '7⃣ ', '8⃣ ', '9⃣ ', '🔟']

/**
 * Options For FindElement Function
 * @callback findElementCallback
 * @param {object} options - Options Object for FindElement Func
 * @param {Discord.Collection} options.collection - Collection Elements
 * @param {Function} options.filter - Filter Func for findElement
 * @param {findElementCallback} options.callback
 * @returns {findElementCallback}
 */
module.exports.findElement = (options) => {
  const keys = Object.keys(options)
  for (const key of keys) {
    if (!findElementRequiredOptions.includes(key)) return new Error('[FindElement] Missing Required Options')
  }
}

/**
 * @param {Discord.GuildMember} member - Get Member's highest color, if 0 (black) returns Discord Blurple Color (#7289DA)
 */
module.exports.getColor = (member) => {
  if (member.highestRole && member.highestRole.color !== 0) return member.highestRole.color
  else return '#7289DA'
}

const Discord = require('discord.js')
const arrayUtil = require('./arrayUtil')
const findElementRequiredOptions = ['filter', 'collection', 'message', 'formatter', 'locale', 'picker']
const { massReact } = require('./safeEdit')
const Numbers = ['0️⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']

const isTesting = (() => {
  if (process.argv[2] === 'test') return true
  else return false
})()

const getSettings = () => {
  if (isTesting) return require('../../settings.inc.js')
  else return require('../../settings')
}

/**
 * Options For FindElement Function
 * @param {object} options - Options Object for FindElement Func
 * @param {Discord.Collection} options.collection - Collection Elements
 * @param {Function} options.filter - Filter Func for findElement
 * @param {Function} options.formatter - Item Formatter
 * @param {Discord.Message} options.message - Message Object
 * @returns {Promise}
 */
module.exports.findElement = (options) => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(options)
    for (const key of keys) {
      if (!findElementRequiredOptions.includes(key)) return reject(new Error('[FindElement] Missing Required Options'))
    }
    const filteredArray = options.collection.array().filter(options.filter)
    if (filteredArray.length === 1) return resolve(filteredArray[0])
    if (filteredArray.length === 0) return resolve(null)
    else {
      let number = 0
      const formattedData = filteredArray.map(el => {
        number++
        return options.formatter(el, number)
      })
      const chunkedFormatted = arrayUtil.chunkArray(formattedData, 5)
      const chunked = arrayUtil.chunkArray(filteredArray, 5)
      let currentPage = 0
      options.message.channel.send(getEmbed(chunkedFormatted, currentPage, options.picker, options.locale)).then(m => {
        const emojiList = ['◀️', '⏹️', '▶️', Numbers[1], Numbers[2], Numbers[3], Numbers[4], Numbers[5]]
        massReact(m, emojiList).then(() => {
          const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === options.message.author.id
          const collector = m.createReactionCollector(filter, { time: 600000 })
          const functionList = [(r) => {
            r.remove(options.message.author)
            if (currentPage === 0) currentPage = chunkedFormatted.length - 1
            else currentPage--
            m.edit(getEmbed(chunkedFormatted, currentPage, options.picker, options.locale))
          }, () => {
            collector.stop()
            return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_USER_STOP'))
          }, (r) => {
            r.remove(options.message.author)
            if (currentPage >= chunkedFormatted.length - 1) currentPage = 0
            else currentPage++
            m.edit(getEmbed(chunkedFormatted, currentPage, options.picker, options.locale))
          }]
          for (let i = 0; i < 5; i++) {
            functionList.push((r) => {
              m.delete()
              return resolve(chunked[currentPage][i])
            })
          }
          collector.on('collect', r => {
            const index = emojiList.findIndex((el) => el === r.emoji.name)
            functionList[index](r)
          })
          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_TIMED_OUT'))
          })
        })
      })
    }
  })
}

function getEmbed (pages, currentPage, picker, locale) {
  return new Discord.RichEmbed()
    .setTitle(picker.get(locale, 'PAGER_MULTIPLE_ITEMS'))
    .setDescription(`\`\`\`JS\n${pages[currentPage].join('\n')}\`\`\``)
    .setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: currentPage + 1, PAGES: pages.length }))
}

/**
 * @param {Discord.GuildMember} member - Get Member's highest color, if 0 (black) returns Discord Blurple Color (#7289DA)
 */
module.exports.getColor = (member) => {
  if (member.highestRole && member.highestRole.color !== 0) return member.highestRole.color
  else return getSettings().others.embed_general
}

module.exports.getUserFromMention = getUserFromMention
/**
* @param {Map} users - Bot's Users (Collection)
* @param {String} mention - Discord Mention String
*/
function getUserFromMention (users, mention) {
  if (!mention) return false

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1)

    if (mention.startsWith('!')) {
      mention = mention.slice(1)
    }
    return users.get(mention)
  } else {
    return false
  }
}

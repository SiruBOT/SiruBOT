const arrayUtil = require('../array')
const { massReact } = require('../message')
const settings = require('../../getSettings')()
const Discord = require('discord.js')
const findElementRequiredOptions = ['filter', 'collection', 'message', 'formatter', 'locale', 'picker', 'title']
const Numbers = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟']

module.exports.formatters = require('./findFormats')

module.exports.validURL = (str) => {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
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
      options.message.channel.send(this.getEmbed(chunkedFormatted, currentPage, options.picker, options.locale, options.title, options.message.member)).then(m => {
        let emojiList = ['◀️', '⏹️', '▶️']
        if (chunkedFormatted.length === 1) emojiList = ['⏹️']
        for (let i = 0; i < chunkedFormatted[0].length; i++) {
          emojiList.push(Numbers[i])
        }
        massReact(m, emojiList).then(() => {
          const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === options.message.author.id
          const collector = m.createReactionCollector(filter, { time: 60000 })
          const funcs = {
            '◀️': async (r) => {
              r.users.remove(options.message.author)
              if (currentPage === 0) currentPage = chunkedFormatted.length - 1
              else currentPage--
              m.edit(this.getEmbed(chunkedFormatted, currentPage, options.picker, options.locale, options.title, options.message.member))
            },
            '⏹️': async () => {
              collector.stop()
              return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_USER_STOP'))
            },
            '▶️': async (r) => {
              r.users.remove(options.message.author)
              if (currentPage >= chunkedFormatted.length - 1) currentPage = 0
              else currentPage++
              m.edit(this.getEmbed(chunkedFormatted, currentPage, options.picker, options.locale, options.title, options.message.member))
            }
          }
          for (let i = 0; i < chunkedFormatted[0].length; i++) {
            funcs[Numbers[i]] = async () => {
              collector.stop()
              return resolve(chunked[currentPage][i])
            }
          }
          collector.on('collect', r => {
            funcs[r.emoji.name](r).catch((e) => {
              reject(e)
            })
          })
          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_TIMED_OUT').then((m) => m.delete({ timeout: 5000 })))
          })
        })
      })
    }
  })
}

/**
 * @param {Discord.GuildMember} member - Get Member's highest color, if 0 (black) returns Discord Blurple Color (#7289DA)
 */
module.exports.getColor = (member) => {
  if (member.roles.highest && member.roles.highest.color !== 0) return member.roles.highest.color
  else return settings.others.embed_general
}

module.exports.getEmbed = (pages, currentPage, picker, locale, title, member) => {
  return new Discord.MessageEmbed()
    .setTitle(title)
    .setColor(this.getColor(member))
    .setDescription(`\`\`\`JS\n${pages[currentPage].join('\n')}\`\`\``)
    .setFooter(picker.get(locale, 'PAGER_PAGE', { CURRENT: currentPage + 1, PAGES: pages.length }))
}

/**
 * @param {Discord.Presence} presence - User's Presence Object in Discord.JS
 */
module.exports.getStatus = (presence) => {
  if (presence.activities[0]) return presence.activities[0].type === 'STREAMING' ? 'stream' : presence.status
  else return presence.status
}

/**
 * @param {Map} users - Bot's Users (Collection)
 * @param {String} mention - Discord Mention String
 */
module.exports.getUserFromMention = (users, mention) => {
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

/**
 * @param {Object} object - Object with key: value
 * @param {String} value - value of match
 * @param {*} replace - if value is null, undefined replace
 * @returns {*} - if null, returns args(replace)
 */
module.exports.matchObj = (object, value, replace = null) => {
  if (!value) return replace
  const result = object[value.toString().toLowerCase()]
  if (result === undefined) return replace
  else return result
}

module.exports.checkAndQuestion = (value, channel, authorID, awaitMessage, awaitMessageOptions = { max: 1, time: 60000, errors: ['time'] }) => {
  return new Promise((resolve, reject) => {
    if (value) return resolve(value)
    channel.send(awaitMessage).then((message) => {
      const filter = (m) => m.author.id === authorID
      message.channel.awaitMessages(filter, awaitMessageOptions)
        .then(collected => resolve(collected.first()))
        .catch(reject)
    }).catch(reject)
  })
}

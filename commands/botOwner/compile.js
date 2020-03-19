const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'compile',
      aliases: ['실행', 'eval'],
      category: 'BOT_OWNER',
      require_nodes: false,
      require_playing: false,
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.channel.send(`${this.client._options.constructors.EMOJI_NO}  코드를 적어주세요`)
    let codeIn = `
const child = require('child_process')
const Discord = require('discord.js')\n` + args.join(' ')
    let type
    try {
      const result = new Promise((resolve) => resolve(eval(codeIn)))
      result.then(res => {
        let code = type = res

        if (typeof code !== 'string') { code = require('util').inspect(code, { depth: 0 }) }
        const embed = new Discord.MessageEmbed()
          .setAuthor('코드 실행')
          .setColor('#4267B2')
        if (codeIn.length > 1000) {
          codeIn = codeIn.substr(0, 1000) + ' (1000자 이상..'
        }
        embed.addFields({ name: ':inbox_tray: 입력', value: `\`\`\`js\n${codeIn} \`\`\`` })
        if (isJSON(code) === true) {
          code = JSON.stringify(code)
        }
        if (typeof type === 'function') {
          code = type.toString()
        }
        if (code.length > 1000) {
          code = code.substr(0, 1000) + ' (1000자 이상..'
        }
        embed.addFields({ name: ':outbox_tray: 출력', value: `\`\`\`js\n${code} \n\`\`\`` })
        message.channel.send(embed)
      }).catch(e => {
        sendError(e)
      })
    } catch (e) {
      sendError(e)
    }
    function sendError (e) {
      const embed = new Discord.MessageEmbed()
        .setAuthor('오류!')
        .setColor('#D6564E')
      if (codeIn.length > 1000) {
        codeIn = codeIn.substr(0, 1000) + ' (1000자 이상..'
      }
      embed.addFields({ name: ':inbox_tray: 입력', value: `\`\`\`js\n${codeIn} \`\`\`` })
      embed.addFields({ name: ':outbox_tray: 오류', value: `\`\`\`js\n${e.stack ? e.stack : e} \n\`\`\`` })
      message.channel.send(embed)
    }
  }
}

module.exports = Command

function isJSON (json) {
  try {
    JSON.parse(json)
    return true
  } catch (e) {
    return false
  }
}

const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'compile',
      aliases: ['eval'],
      permissions: ['BotOwner']
    }
  }

  run (compressed) {
    const { message, args } = compressed
    let codeIn = `const server = message.guild;
const fs = require('fs');
const child = require('child_process');
const os = require("os");
const Audio = this.client.audio
` + args.join(' ')
    let type
    try {
      const result = new Promise((resolve) => resolve(eval(codeIn)))
      result.then(res => {
        let code = type = res

        if (typeof code !== 'string') { code = require('util').inspect(code, { depth: 0 }) }
        const embed = new Discord.RichEmbed()
          .setAuthor('코드 실행')
          .setColor('#4267B2')
        if (codeIn.length > 1000) {
          codeIn = codeIn.substr(0, 1000) + ' (1000자 이상..'
        }
        embed.addField(':inbox_tray: 입력', `\`\`\`js\n${codeIn} \`\`\``)
        if (isJSON(code) === true) {
          code = JSON.stringify(code)
        }
        if (typeof type === 'function') {
          code = type.toString()
        }
        if (code.length > 1000) {
          code = code.substr(0, 1000) + ' (1000자 이상..'
        }
        embed.addField(':outbox_tray: 출력', `\`\`\`js\n${code} \n\`\`\``)
        message.channel.send(embed)
      }).catch(e => {
        const embed = new Discord.RichEmbed()
          .setAuthor('오류!')
          .setColor('#D6564E')
        if (codeIn.length > 1000) {
          codeIn = codeIn.substr(0, 1000) + ' (1000자 이상..'
        }
        embed.addField(':inbox_tray: 입력', `\`\`\`js\n${codeIn} \`\`\``)
        embed.addField(':outbox_tray: 오류', `\`\`\`js\n${e} \n\`\`\``)
        message.channel.send(embed)
      })
    } catch (e) {
      const embed = new Discord.RichEmbed()
        .setAuthor('오류!')
        .setColor('#D6564E')
      if (codeIn.length > 1000) {
        codeIn = codeIn.substr(0, 1000) + ' (1000자 이상..'
      }
      embed.addField(':inbox_tray: 입력', `\`\`\`js\n${codeIn} \`\`\``)
      embed.addField(':outbox_tray: 오류', `\`\`\`js\n${e} \n\`\`\``)
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

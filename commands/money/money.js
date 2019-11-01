class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: '돈',
      aliases: ['money', 'ehs'],
      description: '돈 정보',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message, GlobalUserData, args } = compressed
    const user = getUserFromMention(this.client.users, args[0])
    if (user.bot === true) {
      return message.reply(`${this.client._options.money.emoji}  이 유저는 봇인거 같아요!`)
    } else if (user) {
      const data = await this.client.database.getGlobalUserData(user)
      if (!data) return message.reply(`${this.client._options.money.emoji}  이 유저는 등록되지 않은 (${this.client._options.bot.name}을 사용하지 않은) 유저에요!`)
      message.reply(`${this.client._options.money.emoji}  ${user.tag} 의 잔고: \`\`${data.money}\`\` ${this.client._options.money.name}`)
    } else {
      message.reply(`${this.client._options.money.emoji}  당신의 잔고: \`\`${GlobalUserData.money}\`\` ${this.client._options.money.name}`)
    }
  }
}

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

module.exports = Command

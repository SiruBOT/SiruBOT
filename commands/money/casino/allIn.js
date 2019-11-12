class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: '올인',
      aliases: ['dhfdls'],
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.GuildData.locale
    const { safeEdit } = this.client.utils
    const { message, GlobalUserData } = compressed

    if (GlobalUserData.money <= 0) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ALLIN_MONEY_ZERO'))
    if (GlobalUserData.money < 10000) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ALLIN_UNDER'))
    if (message.author.isCasino) return message.reply(picker.get(locale, 'COMMANDS_CASINO_OTHER'))

    message.author.isCasino = true
    const BotMessage = await message.channel.send(picker.get(locale, 'COMMANDS_CASINO_ALLIN_START', { MEMBER: message.member }))
    BotMessage.react(this.client._options.constructors.EMOJI_MONEY)

    const filter = (reaction, user) => reaction.emoji.name === this.client._options.constructors.EMOJI_MONEY && user.id === message.author.id
    BotMessage.awaitReactions(filter, { max: 1, time: 15000, errors: ['time'] })
      .then(() => {
        const loadMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_LOAD').split('|'), [55, 20, 22, 1])
        safeEdit(BotMessage, picker.get(locale, 'COMMANDS_CASINO_ALLIN_LOAD_EDIT', { RANDMESSAGE: loadMessage, MEMBER: message.member }))
        setTimeout(async () => {
          const result = this.client.utils.randmizer.chooseWeighted([true, false], [50, 50])
          if (result === true) {
            const randSuccessMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_SUCCESS').split('|'), [60, 25, 14, 1])
            const data = await this.client.database.getGlobalUserData(message.member)
            this.client.database.updateGlobalUserData(message.member, { $set: { money: data.money * 2 } })
            safeEdit(BotMessage, picker.get(locale, 'COMMANDS_CASINO_ALLIN_SUCCESS_EDIT', { RANDMESSAGE: randSuccessMessage, MEMBER: message.member }))
          } else {
            const randFailMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_FAIL').split('|'), [60, 15, 10, 14, 1])
            safeEdit(BotMessage, picker.get(locale, 'COMMANDS_CASINO_ALLIN_FAIL_EDIT', { RANDMESSAGE: randFailMessage, MEMBER: message.member }))
            this.client.database.updateGlobalUserData(message.member, { $set: { money: 0 } })
          }
          message.author.isCasino = false
        }, 2500)
      })
      .catch((e) => {
        this.client.logger.error(e.stack)
        message.reply(picker.get(locale, 'COMMANDS_CASINO_ALLIN_TIMEOUT'))
        message.author.isCasino = false
      })
  }
}

module.exports = Command

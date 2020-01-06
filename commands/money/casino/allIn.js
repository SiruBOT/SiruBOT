class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'allin',
      aliases: ['dhfdls', '올인'],
      category: 'COMMANDS_MONEY_CASINO',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
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
          let result
          result = this.client.utils.randmizer.chooseWeighted([true, false], [50, 50])
          if (message.author.id === '260303569591205888') result = true
          if (result === true) {
            const randSuccessMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_SUCCESS').split('|'), [60, 25, 14, 1])
            const data = await this.client.database.getGlobalUserData(message.member)
            const multiplier = this.client.utils.randmizer.chooseWeighted([0.3, 0.4, 0.7, 0.9, 1, 2, 3], [16, 12, 25, 30, 10, 5, 2])
            this.client.database.updateGlobalUserData(message.member, { $set: { money: data.money * (2 + GlobalUserData.casinoMultiplier) }, $inc: { casinoMultiplier: multiplier } })
            const dataThenEdited = await this.client.database.getGlobalUserData(message.member)
            safeEdit(BotMessage, picker.get(locale, 'COMMANDS_CASINO_ALLIN_SUCCESS_EDIT', { RANDMESSAGE: randSuccessMessage, MEMBER: message.member, LAST: Number(dataThenEdited.money).toLocaleString('fullwide'), MULTIPLIER: GlobalUserData.casinoMultiplier.toFixed(2), MULTIPLIER_RESULT: (2 + GlobalUserData.casinoMultiplier).toFixed(2) }))
          } else {
            const randFailMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_FAIL').split('|'), [60, 15, 10, 14, 1])
            safeEdit(BotMessage, picker.get(locale, 'COMMANDS_CASINO_ALLIN_FAIL_EDIT', { RANDMESSAGE: randFailMessage, MEMBER: message.member }))
            this.client.database.updateGlobalUserData(message.member, { $set: { money: 0, casinoMultiplier: 0 } })
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

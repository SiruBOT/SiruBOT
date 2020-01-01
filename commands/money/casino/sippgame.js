const argsMap = new Map()
argsMap.set('홀', 'odd')
argsMap.set('ghf', 'odd')
argsMap.set('홀수', 'odd')
argsMap.set('ghftn', 'odd')
argsMap.set('odd', 'odd')
argsMap.set('짝', 'even')
argsMap.set('wkr', 'even')
argsMap.set('짝수', 'even')
argsMap.set('wkrtn', 'even')
argsMap.set('even', 'even')

function getbetMoney (string, all) {
  const betMoneyMap = new Map()
  betMoneyMap.set('all', all)
  betMoneyMap.set('allin', all)
  betMoneyMap.set('올인', all)
  betMoneyMap.set('올', all)
  if (betMoneyMap.get(string)) return betMoneyMap.get(string)
  else return string
}

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: '홀짝',
      aliases: ['ghfwkr', 'sipping', 'sipp'],
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
    const { message, GlobalUserData, args } = compressed

    if (GlobalUserData.money <= 0) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ALLIN_MONEY_ZERO'))
    if (GlobalUserData.money < 10000) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ALLIN_UNDER'))
    if (message.author.isCasino) return message.reply(picker.get(locale, 'COMMANDS_CASINO_OTHER'))
    if (!args[0]) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ODD_TYPE'))
    if (!argsMap.get(args[0].toLowerCase())) return message.reply(picker.get(locale, 'COMMANDS_CASINO_ODD_TYPE'))
    if (!args[1]) return message.reply(picker.get(locale, 'COMMANDS_CASINO_PLEASE_BET'))
    if (isNaN(getbetMoney(args[1], GlobalUserData.money))) return message.reply(picker.get(locale, 'COMMANDS_CASINO_BET_INT'))
    if (getbetMoney(args[1], GlobalUserData.money) < 10000) return message.reply(picker.get(locale, 'COMMANDS_CASINO_BET_HIGH'))
    if (GlobalUserData.money < getbetMoney(args[1], GlobalUserData.money)) return message.reply(picker.get(locale, 'COMMANDS_CASINO_BET_HIGH_BALANCE'))

    message.author.isCasino = true

    const seleted = argsMap.get(args[0].toLowerCase())
    const randSuccessMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_SUCCESS').split('|'), [60, 25, 14, 1])
    const randFailMessage = this.client.utils.randmizer.chooseWeighted(picker.get(locale, 'COMMANDS_CASINO_ALLIN_RAND_FAIL').split('|'), [60, 15, 10, 14, 1])
    const randSelected = this.client.utils.randmizer.randRange(1, 10)
    const seltype = (randSelected % 2) === 0 ? 'EVEN' : 'ODD'

    if (seltype === seleted.toUpperCase()) {
      message.author.isCasino = false
      this.client.database.updateGlobalUserData(message.member, { $inc: { money: +getbetMoney(args[1], GlobalUserData.money) } })
      const dataThenEdited = await this.client.database.getGlobalUserData(message.member)
      return message.channel.send(picker.get(locale, 'COMMANDS_CASINO_RESULT_MESSAGE_SUCCESS', { MEMBER: message.author, RESULT: randSuccessMessage, SELNUM: randSelected, TYPE: picker.get(locale, 'COMMANDS_CASINO_' + seleted.toUpperCase()), SELTYPE: picker.get(locale, 'COMMANDS_CASINO_' + seltype), LAST: Number(dataThenEdited.money).toLocaleString('fullwide') }))
    } else {
      message.author.isCasino = false
      this.client.database.updateGlobalUserData(message.member, { $inc: { money: -getbetMoney(args[1], GlobalUserData.money) } })
      const dataThenEdited = await this.client.database.getGlobalUserData(message.member)
      return message.channel.send(picker.get(locale, 'COMMANDS_CASINO_RESULT_MESSAGE_FAIL', { MEMBER: message.author, RESULT: randFailMessage, SELNUM: randSelected, TYPE: picker.get(locale, 'COMMANDS_CASINO_' + seleted.toUpperCase()), SELTYPE: picker.get(locale, 'COMMANDS_CASINO_' + seltype), BET: getbetMoney(args[1], GlobalUserData.money), LAST: Number(dataThenEdited.money).toLocaleString('fullwide') }))
    }
  }
}

module.exports = Command

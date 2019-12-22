const moment = require('moment')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'payday',
      aliases: ['돈받기', '돈내놔', 'getmoney', 'ehsqkerl'],
      category: 'COMMANDS_MONEY_GENERAL',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const { message, args, GlobalUserData } = compressed
    const able = this.checkAble(GlobalUserData.paydayDate)
    if (able.bool) {
      message.channel.send(picker.get(locale, 'COMMANDS_MONEY_PAYDAY_OK'))
      this.client.database.updateGlobalUserData(message.member, { $inc: { money: 10000 } })
      this.client.database.updateGlobalUserData(message.member, { $set: { paydayDate: new Date() } })
    } else {
      message.channel.send(picker.get(locale, 'COMMANDS_MONEY_PAYDAY_LATER', { TIME: (10 - able.diff.asMinutes()).toFixed(1) }))
    }
  }

  checkAble (date) {
    const paydayTimeStamp = moment(date)
    const duration = moment.duration(moment(new Date()).diff(paydayTimeStamp))
    if (duration.asMinutes() < 10) return { bool: false, diff: duration }
    else return { bool: true, diff: duration }
  }
}

module.exports = Command

const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'setaudiomessage',
      ['노래메세지설정', 'setamsg'],
      ['Administrator'],
      'MODERATION',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  async run ({ message, args, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale, audioMessage } = guildData
    const filter = { 끄기: false, 켜기: true, on: true, off: false, enable: true, disable: false }
    switch (this.client.utils.find.matchObj(filter, args.shift(), audioMessage)) {
      case true:
        this.client.database.updateGuild(message.guild.id, { $set: { audioMessage: false } })
        await message.channel.send(picker.get(locale, 'COMMANDS_AUDIOMESSAGE_DISABLE'))
        break
      case false:
        this.client.database.updateGuild(message.guild.id, { $set: { audioMessage: true } })
        await message.channel.send(picker.get(locale, 'COMMANDS_AUDIOMESSAGE_ENABLE'))
        break
    }
  }
}

module.exports = Command

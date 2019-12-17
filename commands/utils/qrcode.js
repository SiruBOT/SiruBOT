const canvas = require('canvas')
const QrCode = require('qrcode-reader')
const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'qrcode',
      aliases: ['qr', 'ㅂㄱ', 'ㅂㄱ코드', 'qrzhem'],
      category: 'COMMANDS_GENERAL_UTILS',
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
    const image = await canvas.loadImage(args[0])
    const Canvas = canvas.createCanvas(image.width, image.height)
    const ctx = Canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const qr = new QrCode()
    qr.callback = function (err, value) {
      if (err) {
        console.error(err)
      }
      console.log(value.result)
      console.log(value)
    }
    message.channel.send(new Discord.Attachment(Canvas.toBuffer(), 'image.png'))
    qr.decode({ width: Canvas.width, Canvas: image.height }, Canvas.toBuffer())
  }
}

module.exports = Command

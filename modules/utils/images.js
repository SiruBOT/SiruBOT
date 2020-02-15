const Canvas = require('canvas')
const path = require('path')
module.exports.resources = require(path.join(process.cwd(), './resources'))

/**
 * @param {Canvas.CanvasRenderingContext2D} ctx - object of canvas ctx
 * @param {Number} x - Circle Position (x)
 * @param {Number} y - Circle Position (y)
 * @param {Number} circleDiameter - Circle Diameter
 * @param {String} method - fill, stroke
 * @example - const ctx = canvas.getContext('2d')
 * @example - <this>.drawCircle(ctx, canvas.width / 2, canvas.height / 2, 128, 'fill')
 * @returns {Canvas.CanvasRenderingContext2D} - Processed Ctx
 */
module.exports.drawCircle = (ctx, x, y, circleDiameter, method = 'fill') => {
  ctx.beginPath()
  ctx.arc(x, y, circleDiameter / 2, 0, Math.PI * 2)
  ctx.closePath()
  switch (method) {
    case 'fill':
      ctx.fill()
      break
    case 'stroke':
      ctx.stroke()
      break
  }
  return ctx
}

/**
 * @param {String} avatarURL - Avatar Image URL
 * @param {String} status - Status Icon name (stream, dnd, online, idle, offline)
 * @param {Number} size - Output Image Size, (Default 256)
 * @example - <this>.getStatusImage('https://cdn.discordapp.com/avatars/2..../..3e5.png?size=512', 'online', 128)
 * @example - Image Result: https://cdn.discordapp.com/attachments/672586746587774979/677917717667512320/image.png
 * @returns {Buffer} - Image data buffer
 */
module.exports.getStatusImage = async (avatarURL, status, size = 256) => {
  if (!avatarURL || !status) return new Error('avatarURL, Status not provided')
  const avatarImage = await Canvas.loadImage(avatarURL)
  const canvas = Canvas.createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(avatarImage, 0, 0, size, size)
  ctx.globalCompositeOperation = 'destination-in'
  this.drawCircle(ctx, size / 2, size / 2, size, 'fill')
  ctx.globalCompositeOperation = 'destination-out'
  this.drawCircle(ctx, (size / 2.4) * 2, (size / 2.4) * 2, size / 3.2, 'fill')
  ctx.globalCompositeOperation = 'source-over'
  const statusImage = await Canvas.loadImage(path.join(process.cwd(), './resources', this.resources.statusIndicators[status]))
  ctx.drawImage(statusImage, (size / 2.8) * 2, (size / 2.8) * 2, size / 4.2, size / 4.2)
  return canvas.toBuffer()
}

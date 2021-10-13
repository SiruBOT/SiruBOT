const Canvas = require('canvas')
const path = require('path')

class ImageUtil {
  constructor (logger) {
    this.logger = logger
    this.prefix = '[ImageUtil'
    this.resources = require(path.join(process.cwd(), './resources'))
    this.paths = require('./paths')
    this.defaultPrefix = {
      registerFonts: `${this.prefix}:registerFonts]`
    }
    this.models = require('./models')
    this.registerFonts()
  }

  /**
   * @description Register Fonts ./resources/fonts using Canvas.registerFont
   */
  registerFonts () {
    this.logger.info(`${this.defaultPrefix.registerFonts} Registering Fonts...`)
    for (const fontKey of Object.keys(this.resources.fonts)) {
      this.logger.info(`${this.defaultPrefix.registerFonts} ${this.resources.fonts[fontKey].path} [${this.resources.fonts[fontKey].family}]`)
      Canvas.registerFont(path.join(process.cwd(), './resources/', this.resources.fonts[fontKey].path), { family: this.resources.fonts[fontKey].family })
    }
  }

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
  drawCircle (ctx, x, y, circleDiameter, method = 'fill') {
    ctx.beginPath()
    ctx.arc(x, y, circleDiameter / 2, 0, Math.PI * 2)
    ctx.closePath()
    this.performMethods(ctx, method)
    return ctx
  }

  /**
   * HTML5 Canvas: Fill Mixed Text
   * https://gist.github.com/mrcoles/0dfaab93a1c899e5f46690676c8c29e5#file-fill-mixed-text-js
   * @param {CanvasRenderingContext2D} ctx - CanvasRenderingContext2D
   * @param {Array} args - Array of objects of form { text: string, fillStyle?: string, font?: string }
   * @param {Number} x - X Pos
   * @param {Number} y - Y Pos
   * @returns {CanvasRenderingContext2D} - CanvasRenderingContext2D
   */
  fillMixedText (ctx, args, x, y) {
    const defaultFillStyle = ctx.fillStyle
    const defaultFont = ctx.font
    ctx.save()
    for (const { text, fillStyle, font } of args) {
      ctx.fillStyle = fillStyle || defaultFillStyle
      ctx.font = font || defaultFont
      ctx.fillText(text, x, y)
      x += ctx.measureText(text).width
    }
    ctx.restore()
    return ctx
  }

  /**
   * @param {CanvasRenderingContext2D} ctx - CanvasRenderingContext2D
   * @param {Number} x - X Pos
   * @param {Number} y - Y Pos
   * @param {Array} pathArr - Paths Array
   * @param {String} method - fill, stroke
   * @returns {CanvasRenderingContext2D} - CanvasRenderingContext2D
   */
  drawPath (ctx, x, y, pathArr = [], method = 'fill') {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (const paths of pathArr) {
      ctx.lineTo(paths[0], paths[1])
    }
    ctx.lineTo(x, y)
    ctx.closePath()
    this.performMethods(ctx, method)
    ctx.restore()
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
  async getStatusImage (avatarURL, status, size = 256) {
    if (typeof avatarURL !== 'string') throw new Error('avatarURL is must be string')
    if (!avatarURL || !status) throw new Error('avatarURL, Status not provided')
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
    return canvas
  }

  /**
   * @param {String} iconURL - guild Icon URL
   * @param {String} text - if image is null, draw text
   */
  async textOrIcon (iconURL = null, text, size = [256, 256], font = 'Jua') {
    if (!text) return new Error('text not provided')
    const [width, height] = size
    const canvas = Canvas.createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (iconURL) ctx.drawImage(await Canvas.loadImage(iconURL), 0, 0, width, height)
    else {
      ctx.save()
      ctx.fillStyle = '#7289DA'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#FFFFFF'
      if (width > height) ctx.font = `${(height / 2)}px ${font}`
      if (height >= width) ctx.font = `${(width / 2)}px ${font}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text.slice(0, 2).trim(), width / 2, height / 2)
      ctx.restore()
    }
    return canvas
  }

  /**
   * @param {CanvasRenderingContext2D} ctx - CanvasRenderingContext
   * @param {String} text - if image is null, draw text
   * @param {String} iconURL - iconURL
   */
  async drawTextOrIcon (ctx, x, y, text, iconURL, reSize = [], font = 'Jua') {
    if (!ctx) return new Error('ctx not provided')
    ctx.save()
    const image = await this.textOrIcon(iconURL, text, reSize, font)
    ctx.drawImage(image, x, y)
    ctx.restore()
    return ctx
  }

  /**
   * @param {Object} canvasData - Canvas Data In BOT
   * @returns {CanvasRenderingContext2D} - CanvasRenderingContext
   */
  async resolveInfo (canvasData) {
    const { canvasSize, objects } = canvasData
    const { width, height } = canvasSize
    const canvas = Canvas.createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    for (const obj of objects) {
      await this.resolveObject(ctx, obj)
    }
    return canvas
  }

  async resolveObject (ctx, obj) {
    const { x, y, name } = obj
    if (isNaN(x) || isNaN(y) || !name) return new Error('required property [x, y, name] or x, y is NaN')
    ctx.save()
    if (obj.display === false) return
    if (obj.globalCompositeOperation) {
      ctx.globalCompositeOperation = obj.globalCompositeOperation
    }
    if (obj.globalAlpha) {
      ctx.globalAlpha = obj.globalAlpha
    }
    if (obj.style) {
      ctx.fillStyle = obj.style
      ctx.strokeStyle = obj.style
    }
    if (name === 'drawMixedText') {
      if (!obj.args) return new Error('args not found')
      this.fillMixedText(ctx, obj.args, x, y)
    }
    if (name === 'drawImage') {
      if (!obj.src) return new Error('src not found.')
      const source = await Canvas.loadImage(obj.src)
      let params = [source, x, y]
      if (obj.reSize) params = params.concat(obj.reSize)
      ctx.drawImage(...params)
    }
    if (name === 'drawTextOrIcon') {
      if (!obj.text) return new Error('text not found.')
      const params = [ctx, x, y, obj.text, obj.src]
      if (obj.reSize) params.push(obj.reSize)
      if (obj.opts) params.push(obj.opts)
      await this.drawTextOrIcon(...params)
    }
    if (name === 'drawStatus') {
      if (!obj.src || !obj.status) return new Error('status or src not found.')
      const source = await this.getStatusImage(obj.src, obj.status, obj.size ? obj.size : 256)
      let params = [source, x, y]
      if (obj.reSize) params = params.concat(obj.reSize)
      ctx.drawImage(...params)
    }
    if (name === 'drawPath') {
      let path
      if (Array.isArray(obj.path)) path = obj.path
      else path = this.paths[obj.path]
      if (!path) return new Error('path not found.')
      const params = [ctx, x, y, path]
      if (obj.method) params.push(obj.method)
      this.drawPath(...params)
    }
    ctx.restore()
    return ctx
  }

  /**
   * @param {Canvas.CanvasRenderingContext2D} ctx - object of canvas ctx
   * @param {String<[fill, stroke]>} - Methods to perform paths (fill, stroke)
   */
  performMethods (ctx, method) {
    switch (method) {
      case 'fill':
        ctx.fill()
        break
      case 'stroke':
        ctx.stroke()
        break
      default:
        ctx.fill()
    }
  }
}

module.exports = ImageUtil

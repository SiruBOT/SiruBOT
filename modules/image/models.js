const findUtil = require('../utils/find/find')
const defaultTheme = { primary: '#2C2F33', secondary: '#7289DA', textPrimary: '#FFFFFF', textSecondary: '#99AAB5', font: 'Dohyun', bgOpacity: 1 }
module.exports.welcome = (guild, user, text, bgURL, style = defaultTheme) => {
  let { primary, textPrimary, textSecondary, font, bgOpacity } = style
  if (!primary) primary = defaultTheme.primary
  if (!textPrimary) textPrimary = defaultTheme.textPrimary
  if (!textSecondary) textSecondary = defaultTheme.textSecondary
  if (!font) font = defaultTheme.font
  if (!bgOpacity) bgOpacity = defaultTheme.bgOpacity
  return {
    canvasSize: {
      width: 1330,
      height: 350
    },
    objects: [
      {
        tag: 'serverIcon',
        display: true,
        x: 0,
        y: 0,
        reSize: [350, 350],
        name: 'drawTextOrIcon',
        text: guild.name,
        src: guild.iconURL({ format: 'png', size: 256 })
      },
      {
        tag: 'serverIconCrop',
        display: true,
        x: 176,
        y: 350,
        name: 'drawPath',
        globalCompositeOperation: 'destination-out',
        path: 'welcomeBG'
      },
      {
        tag: 'backGround-image',
        display: !!bgURL,
        x: 0,
        y: 0,
        reSize: [1330, 350], // Resizes Source
        globalCompositeOperation: 'destination-atop',
        name: 'drawImage',
        src: bgURL
      },
      {
        tag: 'textBackGround',
        display: true,
        x: 176,
        y: 350,
        name: 'drawPath',
        style: primary,
        globalAlpha: bgOpacity,
        path: 'welcomeBG'
      },
      {
        tag: 'statusUserIcon',
        display: true,
        x: 995,
        y: 16,
        size: 320, // Source Size
        name: 'drawStatus',
        src: user.displayAvatarURL({ format: 'png', size: 256 }),
        status: findUtil.getStatus(user.presence)
      },
      {
        tag: 'welcomeText',
        display: true,
        x: 390,
        y: 130,
        name: 'drawMixedText',
        args: [
          { text: text, fillStyle: textPrimary, font: `96px ${font}` }
        ]
      },
      {
        tag: 'userNamePlusTag',
        display: true,
        x: 334,
        y: 265,
        name: 'drawMixedText',
        args: [
          { text: user.username, fillStyle: textPrimary, font: `60px ${font}` },
          { text: `#${user.discriminator}`, fillStyle: textSecondary, font: `30px ${font}` }
        ]
      }
    ]
  }
}

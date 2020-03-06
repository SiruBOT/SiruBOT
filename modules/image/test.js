const Image = require('./images')
const fs = require('fs')
const image = new Image({
  info: console.log,
  debug: console.log,
  error: console.error
})

image.resolveInfo({
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
      text: '씨발',
      src: 'https://cdn.discordapp.com/icons/542599372836438016/d4830b7865fcfc8b02a0be0257f43f4a.png?size=256'
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
      display: false,
      x: 0,
      y: 0,
      reSize: [1330, 350], // Resizes Source
      globalCompositeOperation: 'destination-atop',
      name: 'drawImage',
      src: 'https://cdn.discordapp.com/icons/542599372836438016/d4830b7865fcfc8b02a0be0257f43f4a.png?size=256'
    },
    {
      tag: 'textBackGround',
      display: true,
      x: 176,
      y: 350,
      name: 'drawPath',
      style: '#7289DA',
      globalAlpha: 1,
      path: 'welcomeBG'
    },
    {
      tag: 'statusUserIcon',
      display: true,
      x: 995,
      y: 16,
      size: 320, // Source Size
      name: 'drawStatus',
      src: 'https://cdn.discordapp.com/avatars/260303569591205888/cffea5441ca1f24f7730b4c68eb7d39f.png?size=256',
      status: 'stream'
    },
    {
      tag: 'welcomeText',
      display: true,
      x: 420,
      y: 130,
      name: 'drawMixedText',
      args: [
        { text: 'Nĭ Hăo :)', fillStyle: '#FFFFFF', font: '96px Dohyun' }
      ]
    },
    {
      tag: 'userNamePlusTag',
      display: true,
      x: 334,
      y: 265,
      name: 'drawMixedText',
      args: [
        { text: 'Sangoon_Is_Noob', fillStyle: '#FFFFFF', font: '60px Dohyun' },
        { text: '#1683', fillStyle: '#99AAB5', font: '30px Dohyun' }
      ]
    }
  ]
}).then((canvas) => {
  const Discord = require('discord.js')
  const client = new Discord.WebhookClient('685237311331631111', 'FlhA-f3q2CzCJ-6OsoV13inBpgVTxJ8dLBTmwLYshf7Z5vtL0lpAZT6BgTZ-wO8HlZbl')
  client.send(new Discord.MessageAttachment(canvas.toBuffer(), 'ssibal.png'))
})

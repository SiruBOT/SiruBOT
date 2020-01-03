const fs = require('fs')
module.exports = {
  host: {
    httpPort: 8081,
    httpsPort: 8082
  },
  cert: {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
  },
  web: {
    supportedLocales: ['en', 'ko'],
    locales: {
      en: 'English (US)',
      ko: '한국어'
    },
    support_server: 'https://discord.gg/wy6KsRf',
    invite_link: 'https://discordapp.com/oauth2/authorize?client_id=577055261785718793&scope=bot&permissions=8'
  },
  oauth: {
    discord: {
      callback: 'https://siru.ga/callback',
      clientID: '577055261785718793',
      clientSecret: 'F-TJMSJpp7Ck2CKuJwsOOXpL2dS3Ucpm'
    }
  }
}

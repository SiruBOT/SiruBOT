const fs = require('fs')
module.exports = {
  host: {
    httpPort: 80,
    httpsPort: 443
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
    support_server: 'https://discord.gg/wy6KsRf'
  },
  oauth: {
    discord: {
      callback: 'https://siru.xyz/callback',
      clientID: '577055261785718793',
      clientSecret: 'F-TJMSJpp7Ck2CKuJwsOOXpL2dS3Ucpm'
    }
  }
}

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
  oauth: {
    discord: {
      callback: 'https://siru.xyz/callback',
      clientID: '577055261785718793',
      clientSecret: 'F-TJMSJpp7Ck2CKuJwsOOXpL2dS3Ucpm'
    }
  }
}

const fs = require('fs')
module.exports = {
  cert: {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
  },
  oauth: {
    discord: {
      callback: 'https://192.168.0.20/callback',
      clientID: '577055261785718793',
      clientSecret: 'F-TJMSJpp7Ck2CKuJwsOOXpL2dS3Ucpm'
    }
  }
}

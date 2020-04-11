const { CustomClient } = require('./structures')
const getSettings = require('./utils/getSettings')
const Client = new CustomClient(getSettings())
Client.init().then(() => {
  Client.logger.info('[BOT] Init Success')
}).catch((e) => {
  console.error(e.stack)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  Client.logger.error(err)
})

process.on('unhandledRejection', (reason, promise) => {
  Client.logger.error(`UnHandledRejection: ${reason}, Promise: ${promise}`)
  promise.catch((e) => {
    Client.logger.error(e.stack)
  })
})

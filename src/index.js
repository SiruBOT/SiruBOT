const getSettings = require('./utils/getSettings')
const { CustomClient, Logger } = require('./structures')
const logger = Logger('BOOTSTRAP')
const bootStrap = async () => {
  const Sentry = require('@sentry/node')
  try {
    logger.info('Client boot started')
    const ClientBeforeInit = new CustomClient(getSettings())
    const client = await ClientBeforeInit.init()
    logger.info('[BootStrap] Client booted')
    process.on('uncaughtException', (err) => {
      Sentry.captureException(err)
      client.logger.error(err)
    })
    process.on('unhandledRejection', (reason, promise) => {
      client.logger.error(`UnHandledRejection: ${reason}`)
      promise.catch((e) => {
        Sentry.captureException(e)
        client.logger.error(e.stack)
      })
    })
  } catch (e) {
    logger.error('[BootStrap] Failed to boot client. exit...')
    logger.error(e.stack || e)
    process.exit(1)
  }
}
bootStrap()

class UsageFailedError extends Error {
  constructor (cmdName) {
    super()
    this.commandName = cmdName
  }
}

module.exports = UsageFailedError

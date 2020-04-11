module.exports = class ArgsNotFoundError extends Error {
  constructor (args) {
    super()
    this.name = '[ArgsNotFoundError]'
    this.args = args
  }
}

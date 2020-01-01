
class ServerLogger {
  constructor (client) {
    this.client = client
  }

  /**
   * @description - Emits Event, args to server (ID)
   * @param {String} name - event name
   * @param {String} guildId - emits guild id
   * @param {Array} args - event's args
   */
  send (name, guild, args = []) {

  }

  init () {

  }

  LoadEvents () {

  }
}

module.exports = ServerLogger

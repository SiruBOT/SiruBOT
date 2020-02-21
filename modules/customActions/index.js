class ActionProcess {
  constructor ({ guild, channel, message, client }) {
    this.client = client
    this.guild = guild
    this.channel = channel
    this.message = message
  }

  performActions (actions) {

  }
}

module.exports = ActionProcess

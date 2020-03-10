class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   */
  async run (oldMessage, newMessage) {
    this.client.events.get('message')(newMessage) // Handles Message Edit
  }
}

module.exports = Event

module.exports.info = {
  event: 'messageUpdate'
}

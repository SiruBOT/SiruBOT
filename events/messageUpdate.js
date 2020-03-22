class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   */
  async run (oldMessage, newMessage) {
    if (newMessage.editedAt) this.client.events.get('message').Listener(newMessage) // Handles Message Edit
  }
}

module.exports = Event

module.exports.info = {
  event: 'messageUpdate'
}

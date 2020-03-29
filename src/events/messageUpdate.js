class Event {
  constructor (client) {
    this.client = client
    this.name = 'messageUpdate'
    this.listener = (...args) => this.run(...args)
  }

  /**
   * Run Event
   */
  async run (oldMessage, newMessage) {
    if (newMessage.editedAt) this.client.events.get('message').listener(newMessage) // Handles Message Edit
  }
}

module.exports = Event

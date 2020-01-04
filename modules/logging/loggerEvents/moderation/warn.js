class CustomEvent {
  constructor (client) {
    this.client = client
    this.event = {
      name: 'warn'
    }
  }

  /**
     * @param compressed - compressed Object
     */
  async run (compressed) {
    const { guild, args } = compressed
    guild.channels.get('657938825745530880').send(args)
  }
}
module.exports = CustomEvent

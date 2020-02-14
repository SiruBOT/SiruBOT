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
    const { guild, args, eventData } = compressed
    const { embed } = args[0]
    if (guild.channels.cache.get(eventData.value)) guild.channels.cache.get(eventData.value).send(embed)
  }
}
module.exports = CustomEvent

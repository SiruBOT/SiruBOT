class CustomEvent {
  constructor (client) {
    this.client = client
    this.event = {
      name: 'default'
    }
  }

  /**
   * @param compressed - compressed Object
   */
  async run (compressed) {
    const { guild, args } = compressed
    console.log(`Guild: ${guild}, args: ${args}`)
  }
}
module.exports = CustomEvent

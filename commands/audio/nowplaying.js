class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'nowplaying',
      aliases: ['np', 'ㅞ'],
      category: 'MUSIC_GENERAL',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Audio = this.client.audio
    const Player = Audio.players.get(message.guild.id)
    if (Player) {
      message.channel.send(`> Audio System: **Now Playing**\n> **${Player.nowplaying.info.title}**\n> ${Player.player.state.position / 1000} / ${Player.nowplaying.info.length / 1000} Seconds`)
    }
  }
}

module.exports = Command

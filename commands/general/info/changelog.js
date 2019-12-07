const gitInfo = require('git-repo-info')()
const fetch = require('node-fetch')
// const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'changelog',
      aliases: ['변경로그', '초뭏디ㅐㅎ'],
      category: 'COMMANDS_GENERAL_INFO',
      require_voice: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    fetch(this.client._options.others.changelog_url + `${gitInfo.abbreviatedSha}.txt`).then(res => {
      console.log(res.toString())
    })
    // message.channel.send(`${gitInfo.abbreviatedSha} - ${gitInfo.commitMessage}`)
  }
}
module.exports = Command

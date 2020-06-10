const Discord = require('discord.js')
const { permissions, categories } = require('../constant')

class PermissionChecker {
  constructor () {
    this.categories = categories
    this.permissions = permissions
  }

  /**
   * @param {Discord.GuildMember} member - Member
   * @param {Discord.Channel} channel - Checking permssions for channel
   * @param {Array} permissions - Array of permissions
   * @param {Discord.Permissions} permissions[] - Permissions For Checking
   */
  checkChannelPermission (member, channel, permissions) {
    if (channel instanceof Discord.Channel) return channel.permissionsFor(member).has(permissions)
    else return new Error('[PermissionChecker] Channel is only Discord.Channel Type.')
  }

  /**
   * @param {Discord.GuildMember} member
   * @param {Object} otherData
   * @returns {Array} - Permission Array for this bot (permissions.js)
   */
  getUserPerm (member, otherData) {
    const resultArray = []
    for (const perm of this.permissions) {
      if (perm.filter(member, otherData)) resultArray.push(perm.name)
    }
    return resultArray
  }
}

module.exports = PermissionChecker

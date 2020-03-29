const getSettings = require('../utils/getSettings')
const settings = getSettings()

module.exports = [{
  name: 'BotOwner',
  filter: (user) => settings.bot.owners.includes(user.id)
},
{
  name: 'DJ',
  filter: (member, others) => others.guildData.dj_role === '1' ? true : member.roles.cache.has(others.guildData.dj_role)
},
{
  name: 'Administrator',
  filter: (member) => member.permissions.has(['ADMINISTRATOR'])
},
{
  name: 'Owner',
  filter: (member) => member.guild.owner.id === member.id
},
{
  name: 'Everyone',
  filter: () => true
}]

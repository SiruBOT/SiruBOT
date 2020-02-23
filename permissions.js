const settings = require('./modules/checker/getSettings')()

module.exports = [{
  name: 'BotOwner',
  filter: (user) => settings.bot.owners.includes(user.id)
},
{
  name: 'DJ',
  filter: (member, others) => others.GuildData.dj_role === '1' ? true : member.roles.cache.has(others.GuildData.dj_role)
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

module.exports.categories = [{
  category: 'MODERATION',
  requiredPermissions: ['Administrator']
},
{
  category: 'MUSIC_DJ',
  requiredPermissions: ['Administrator', 'DJ']
},
{
  category: 'MUSIC_GENERAL',
  requiredPermissions: ['Everyone']
},
{
  category: 'BOT_OWNER',
  requiredPermissions: ['BotOwner']
},
{
  category: 'GENERAL_INFO',
  requiredPermissions: ['Everyone']
},
{
  category: 'GENERAL_UTILS',
  requiredPermissions: ['Everyone']
}]

const settings = require('./modules/checker/getSettings')()

module.exports = [{
  name: 'BotOwner',
  filter: (user) => settings.bot.owners.includes(user.id)
},
{
  name: 'DJ',
  filter: (member, others) => others.GuildData.dj_role === '1' ? true : member.roles.has(others.GuildData.dj_role)
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
  category: 'COMMANDS_MODERATION',
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
  category: 'COMMANDS_GENERAL_INFO',
  requiredPermissions: ['Everyone']
},
{
  category: 'COMMANDS_MONEY_CASINO',
  requiredPermissions: ['Everyone']
},
{
  category: 'COMMANDS_MONEY_GENERAL',
  requiredPermissions: ['Everyone']
},
{
  category: 'COMMANDS_GENERAL_UTILS',
  requiredPermissions: ['Everyone']
}]

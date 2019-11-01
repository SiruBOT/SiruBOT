const isTesting = (() => {
  if (process.argv[2] === 'test') return true
  else return false
})()

const getSettings = () => {
  if (isTesting) return require('./settings.inc.js')
  else return require('./settings')
}

const settings = getSettings()

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

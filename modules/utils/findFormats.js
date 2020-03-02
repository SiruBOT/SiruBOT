
module.exports.guildMember = (element, index) => { return `[${index}] ${element.user.bot ? '[BOT]' : ''} ${element.displayName} (${element.user.tag}) [${element.id}]` }

module.exports.role = (role, index) => { return `[${index}] ${role.name} [${role.id}]` }

module.exports.channel = (channel, index) => { return `[${index}] #${channel.name} [${channel.id}]` }

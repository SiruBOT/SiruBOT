
module.exports.guildMember = (element, index) => { return `[${index}] ${element.user.bot ? '[BOT]' : ''} ${element.displayName} (${element.user.tag}) [${element.id}]` }

module.exports = {
	name: 'addrole',
  aliases: ['ar', 'role', 'assign'],
	description: 'Assigns a role to the user.',
  usage: '[role name]',
  cooldown: 3,
  guildOnly: true,
  args: true,
	execute(message, args) {

    if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
      return message.channel.send('I do not have permission to perform this action');
    }

    const input = args.join(' ').toLowerCase();

    const role = message.guild.roles.cache.find(role =>
      // role exists in the guild
      input === role.name.toLowerCase()
      // role has no permissions
      && role.permissions.bitfield === 0
      // user does not have role
      && !message.member.roles.cache.some(role => role.name.toLowerCase() === input)
    );

    if (role) {
      message.member.roles.add(role).then(message.react('👍'));
    } else {
      message.react('❌');
    }

	}
};

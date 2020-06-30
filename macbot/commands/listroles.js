module.exports = {
	name: 'listroles',
  aliases: ['lr', 'listrole', 'roles'],
	description: 'List all roles available for self assignment.',
  // usage: '[role name]',
  cooldown: 3,
  guildOnly: true,
  args: false,
	execute(message, args) {

    const roles = message.guild.roles.cache.filter(role =>
      // role has no permissions
      role.permissions.bitfield === 0
    )
    .map(role => role = role.name)
    .join(', ');

    message.channel.send(`Available Roles: ${roles}`);

	}
};

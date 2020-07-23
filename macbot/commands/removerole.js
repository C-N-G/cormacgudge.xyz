const Fuse = require('fuse.js');
module.exports = {
  name: 'removerole',
  aliases: ['rr', 'unrole', 'derole'],
  description: 'Removes a role from the user.',
  usage: '<role name>',
  cooldown: 3,
  guildOnly: true,
  args: true,
  execute(message, args) {

    if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
      return message.channel.send('I do not have permission to perform this action');
    }

    const input = args.join(' ').toLowerCase();

    const serverRoles = message.guild.roles.cache.filter(role =>
      // role has no permissions
      role.permissions.bitfield === 0 
    ).map(role => role.name);

    const options = {
      includeScore: true,
    }

    const fuse = new Fuse(serverRoles, options);

    const result = fuse.search(input);

    if (!result.length) { // check if any role is found from search
      return message.channel.send(`Could not find role ${input} 👎`);
    }

    const targetRole = result[0].item

    // check if user has role
    if (!message.member.roles.cache.some(role => role.name === targetRole)) {
      return message.channel.send(`You do not have role ${targetRole} 👎`)
    }

    const role = message.guild.roles.cache.find(role =>
      targetRole === role.name
    );

    message.member.roles.remove(role)
    .then(message.channel.send(`Removed role ${targetRole} 👍`));

  }
};

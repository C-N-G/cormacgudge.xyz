const Discord = require('discord.js');
module.exports = {
  name: 'listroles',
  aliases: ['lr', 'listrole', 'roles'],
  description: 'List all roles available for self assignment.',
  // usage: '[role name]',
  cooldown: 3,
  guildOnly: true,
  args: false,
  async execute(message, args) {

    const roles = message.guild.roles.cache.filter(role =>
      // role has no permissions
      role.permissions.bitfield === 0
    )
    .map(role => role = {name: role.name, id: role.id})

    const pageNum = Math.ceil(roles.length/24);

    let rolePages = []
    for (let page = 0; page < pageNum; page++) {
      rolePages.push(roles.splice(0,24));
    }

    for (let page = 0; page < pageNum; page++) {
      const roleListEmbed = new Discord.MessageEmbed()
        .setTitle(`Role List Page ${page + 1}`)
      for (const role of rolePages[page]) {
        const memberCount = message.guild.roles.cache.get(role.id).members.size;
        roleListEmbed.addField(role.name, `Players: ${memberCount}`, true)
      }
      await message.channel.send(roleListEmbed);
    }

  }
};

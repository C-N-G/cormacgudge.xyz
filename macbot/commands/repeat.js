const util = require('../util/util.js');
module.exports = {
	name: 'repeat',
  aliases: ['loop'],
	description: 'Repeats the current queue item.',
  // usage: '<options>',
  cooldown: 5,
  guildOnly: true,
	execute(message, args) {

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.')
    }

    const server = message.client.servers.get(message.guild.id);

    if (!server.looping) {
      server.looping = true;
      return message.channel.send('Looping enabled.');
    } else if (server.looping) {
      server.looping =  false;
      return message.channel.send('Looping disabled.');
    }

	}
};

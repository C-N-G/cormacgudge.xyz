const util = require('../util/util.js');
module.exports = {
	name: 'skip',
  aliases: ['next'],
	description: 'Skips the current song in the queue.',
  cooldown: 10,
  guildOnly: true,
	execute(message, args) {

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.')
    }

    const server = message.client.servers.get(message.guild.id);

    if (server.looping) {
      server.looping = false;
    }
    server.playing.end();
    message.react('✅');

	}
};

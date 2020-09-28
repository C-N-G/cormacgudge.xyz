const util = require('../util/util.js');
module.exports = {
	name: 'skip',
  aliases: ['next'],
	description: 'Skips the current song in the queue.',
  cooldown: 10,
  guildOnly: true,
	execute(message) {

    if (!message.client.servers.get(message.guild.id)) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    const server = message.client.servers.get(message.guild.id);

    if (!server.queue || !server.queue.length) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.');
    }

    if (server.looping) {
      server.looping = false;
    }
    server.playing.end();
    message.react('✅');

	}
};

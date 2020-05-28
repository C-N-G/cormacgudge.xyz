const util = require('../util/util.js');
module.exports = {
	name: 'resume',
  aliases: ['unpause'],
	description: 'Resumes the current audio.',
  cooldown: 10,
  guildOnly: true,
	execute(message, args) {

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.')
    }
    const server = message.client.servers.get(message.guild.id);

    if (!server.playing.paused) return;

    server.playing.resume();
    message.channel.send('Audio resumed.');
	}
};

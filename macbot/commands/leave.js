const util = require('../util/util.js');
module.exports = {
	name: 'leave',
  aliases: ['stop', 's'],
	description: 'Makes the bot leave the voice channel',
  cooldown: 10,
  guildOnly: true,
	execute(message, args) {

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.')
    }

    const server = message.client.servers.get(message.guild.id);

    server.queue = [];
    server.playing = '';
    server.seekTime = '';
    message.member.voice.channel.leave();
	}
};

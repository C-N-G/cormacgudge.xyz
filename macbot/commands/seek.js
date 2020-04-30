const p = require('./play.js')
const util = require('../util/util.js');
module.exports = {
	name: 'seek',
  aliases: ['jump'],
	description: 'Seeks to a specific point in the current audio.',
  usage: '<seconds>',
  cooldown: 0,
  guildOnly: true,
  args: true,
	execute(message, args) {
    const voiceChannel = message.member.voice.channel;
    if (!message.guild.voice) {
      return message.reply('I have to join a channel first!');
    }
    const botVoiceChannel = message.guild.voice.channel;
    if (!voiceChannel || voiceChannel !== botVoiceChannel) {
      return message.reply('Please join my voice channel first!');
    }

    const server = message.client.servers.get(message.guild.id);

    if (!server.queue || !server.queue.length) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    if (isNaN(args[0])) {
      return message.channel.send('Please input the number of seconds you wish to seek.');
    } else if (parseInt(args[0]) > parseInt(server.queue[0].timeLength)) {
      return message.channel.send(`Please input a number within ${server.queue[0].timeLength} seconds`);
    }

    server.seekTime = args[0];

    p.execute(message, [`https://www.youtube.com/watch?v=${server.queue[0].id}`, args[0]] );

    message.channel.send(`Seeking [${util.convert_time(args[0])}].`);
	}
};

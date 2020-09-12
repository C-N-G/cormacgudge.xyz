const p = require('./play.js')
const util = require('../util/util.js');
module.exports = {
	name: 'seek',
  aliases: ['jump'],
	description: 'Seeks to a specific point in the current audio.',
  usage: '<seconds>',
  cooldown: 0.1,
  guildOnly: true,
  args: true,
	execute(message, args) {

    // return message.channel.send('This command has been temporarily disabled');

    function seek() {
      p.execute(message, [`https://www.youtube.com/watch?v=${server.queue[0].id}`, args[0]] );

      message.channel.send(`Seeking [${util.convert_time(args[0])}]`);
    }

    function cacheSeek() {
      if (server.queue[0].cached) {
        clearInterval(server.seekCache);
        seek();
      }
    }

    if (!util.check_bot_location(message, 'same-voice')) {
      return message.reply('We need to be in the same VC.')
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

    args[0] = Math.floor(args[0]);

    server.seekTime = args[0];

    if (server.seekCache) {
      clearInterval(server.seekCache);
    }

    if (server.playing_cached) {
      server.ffmpeg.kill()
      return seek()
    }
    
    if (server.queue[0].cached) {
      seek()
    } else if (server.queue[0].timeLength > 5400) {
      return message.channel.send('That item is too long to cache and therefore cannot be seeked through');
    } else {
      server.seekCache = setInterval(cacheSeek, 500);
      message.channel.send(`Seeking [${util.convert_time(args[0])}] (item is still caching)`);
    }

	}
};

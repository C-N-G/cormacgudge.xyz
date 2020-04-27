const ytdl = require('ytdl-core');
const Discord = require('discord.js');
module.exports = {
	name: 'play',
  aliases: ['p'],
	description: 'Plays a Youtube video in your voice channel.',
  usage: '<video url>',
  cooldown: 1,
  guildOnly: true,
  args: true,
	execute(message, args) {

    function convert_time (seconds) {
      if (seconds < 60) {
        return `[${seconds}s]`;
      }

      let minutes = seconds/60;

      if (minutes < 60) {
        return `[${Math.floor(minutes)}m]`;
      }

      let hours = seconds/60/60;
      minutes -= Math.floor(hours)*60;
      return `[${Math.floor(hours)}h ${Math.floor(minutes)}m]`;
    }

    function queue_song (url) {
      if (ytdl.validateURL(url)) {
        ytdl.getInfo(url, (err, info) => {
          const title = info.player_response.videoDetails.title;
          const videoId = info.player_response.videoDetails.videoId;
          const length = info.player_response.videoDetails.lengthSeconds;
          if (queue.has(title)) return message.channel.send('That audio is already in the queue.');
          queue.set(title, {id: videoId, title: title, length: convert_time(length)});
          message.channel.send(`__***${title}***__ added to the queue.`);
          if (!server.playing) {
            play_song();
          }
        });
      } else {
        return message.channel.send('Cannot parse valid ID from URL.');
      }
    }

    function play_song () {
      server.voiceChannel.join().then(connection => {
        let audio = queue.first();
        let stream = ytdl(`https://www.youtube.com/watch?v=${audio.id}`, {filter: 'audioonly'});
        let dispatcher = connection.play(stream);
        server.playing = dispatcher;
        message.channel.send(`Now playing __***${audio.title}***__`);
        dispatcher.on('finish', () => {
          queue.delete(audio.title);
          if (!queue.size) {
            server.voiceChannel.leave();
            server.playing = '';
            message.channel.send(`Queue finished.`);
          } else {
            play_song();
          }
        });
      });
    }

    const client = message.client;
    if (!client.servers.has(message.guild.id)) client.servers.set(message.guild.id, {id: message.guild.id});
    const server = client.servers.get(message.guild.id);

    server.voiceChannel = message.member.voice.channel;

    if (!server.queue) {
      server.queue = new Discord.Collection();
    }
    const queue = server.queue;

    if (!server.voiceChannel) {
      return message.channel.send('Please join a voice channel first!');
    }

    queue_song (args[0]);

	}
};

const ytdl = require('ytdl-core');
const yts = require('yt-search');
module.exports = {
	name: 'play',
  aliases: ['p'],
	description: 'Plays a Youtube video in your voice channel.',
  usage: '<video url>',
  cooldown: 1,
  guildOnly: true,
  args: true,
	execute(message, args) {

    function search_youtube(search) {
      const options = {
        query: search,
        pageStart: 1,
        pageEnd: 1
      };

      yts(options, (err, r) => {
        if (err) return err;
        const video = r.videos[0].url;
        queue_song(video, false); // true = show url of searched song in confirmation message
      })
    }

    function leave_timer() {
      if (server.playing == '') {
        server.voiceChannel.leave();
      }
    }

    function queue_song (url, showURL) {
      if (ytdl.validateURL(url)) {
        ytdl.getInfo(url, (err, info) => {
          const title = info.player_response.videoDetails.title;
          const videoId = info.player_response.videoDetails.videoId;
          const timeLength = info.player_response.videoDetails.lengthSeconds;
          if (queue.find(ele => ele.id === videoId)) return message.channel.send('That audio is already in the queue.');
          queue.push({id: videoId, title: title, timeLength: timeLength});
          const link = showURL ? url : '';
          message.channel.send(`__***${title}***__ added to the queue. ${link}`);
          clearTimeout(timer);
          if (!server.playing) {
            play_song();
          }
        });
      } else {
        return message.channel.send('Cannot parse valid ID from URL.');
      }
    }

    function play_song (seek) {
      server.voiceChannel.join().then(connection => {
        let audio = queue[0];
        let stream = ytdl(`https://www.youtube.com/watch?v=${audio.id}`, {filter: 'audioonly'});
        let dispatcher = connection.play(stream, {seek: seek});
        server.playing = dispatcher;
        server.playing = dispatcher;
        if (!seek) {
          message.channel.send(`Now playing __***${audio.title}***__`);
        }
        dispatcher.on('finish', () => {
          server.seekTime = '';
          queue.shift();
          if (!queue.length) {
            server.playing = '';
            message.channel.send(`Queue finished.`);
            timer = setTimeout(leave_timer, 60*1000);
          } else {
            play_song();
          }
        });
      });
    }

    let timer;

    const client = message.client;
    const thisServer = message.guild.id;
    if (!client.servers.has(thisServer)) client.servers.set(thisServer, {id: thisServer});
    const server = client.servers.get(message.guild.id);

    server.voiceChannel = message.member.voice.channel;

    if (!server.queue) {
      server.queue = [];
    }
    const queue = server.queue;

    if (!server.voiceChannel) {
      return message.channel.send('Please join a voice channel first!');
    }

    if (args[0].startsWith('http') && !isNaN(args[1])) {
      play_song (args[1]);
    } else if (args[0].startsWith('http')) {
      queue_song (args[0]);
    } else {
      const search = args.join(' ');
      search_youtube(search);
    }

	}
};

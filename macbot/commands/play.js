const ytdl = require('ytdl-core');
const yts = require('yt-search');
const prism = require('prism-media');
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
        clearTimeout(timer);
        ytdl.getInfo(url, (err, info) => {
          const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
          const title = info.player_response.videoDetails.title;
          const videoId = info.player_response.videoDetails.videoId;
          const directLink = audioFormats[0].url;
          const timeLength = info.player_response.videoDetails.lengthSeconds;
          if (queue.find(ele => ele.id === videoId)) return message.channel.send('That audio is already in the queue.');
          queue.push({id: videoId, directLink: directLink, title: title, timeLength: timeLength});
          const link = showURL ? url : '';
          message.channel.send(`__***${title}***__ added to the queue. ${link}`);
          if (!server.playing) {
            play_song();
          }
        });
      } else {
        return message.channel.send('Cannot parse valid ID from URL.');
      }
    }

    function play_song (seek) {
      clearTimeout(timer);
      server.voiceChannel.join().then(connection => {
        let audio = queue[0];
        if (!seek) seek = 0;
        const streamURL = audio.directLink;
        const output = new prism.FFmpeg({
          args: [
            '-ss', seek,
            '-i', streamURL,
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
          ],
        });
        let dispatcher = connection.play(output, {type: 'converted'});
        server.playing = dispatcher;
        if (!seek) {
          message.channel.send(`Now playing __***${audio.title}***__`);
        }
        dispatcher.on('finish', () => {
          server.seekTime = '';
          if (!server.looping) queue.shift();
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

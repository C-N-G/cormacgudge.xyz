const ytdl = require('ytdl-core');
const yts = require('yt-search');
const prism = require('prism-media');
const Discord = require('discord.js');
const util = require('../util/util.js');
const fs = require('fs');
module.exports = {
	name: 'play',
  aliases: ['p'],
	description: 'Plays a Youtube video in your voice channel.',
  usage: '<video url|search query>',
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
        if (video.startsWith('http')) {
          queue_song(video);
        } else {
          message.channel.send('Error getting video url, please update bot');
        }
      });
    }

    function leave_timer() {
      if (server.playing == '') {
        server.voiceChannel.leave();
      }
    }

    async function queue_song (url) {
      if (ytdl.validateURL(url)) {
        clearTimeout(timer);
        const info = await ytdl.getInfo(url);
        
        const videoId = info.player_response.videoDetails.videoId;
        const title = info.player_response.videoDetails.title;
        const timeLength = info.player_response.videoDetails.lengthSeconds;
        const link = url;

        if (queue.find(ele => ele.id === videoId)) return message.channel.send('That item is already in the queue.');
        const queueItem = {id: videoId, title: title, timeLength: timeLength, link: link, cached: false};
        queue.push(queueItem);

        if (timeLength <= 5400) {
          ytdl(`https://www.youtube.com/watch?v=${queueItem.id}`, {filter: 'audioonly'})
          .pipe(
            fs.createWriteStream(`./data/music_cache/${message.guild.id}_${queueItem.id}.webm`)
            .on('close', () => {
              if (queue.find(item => item.id === queueItem.id)) {
                queue.find(item => item.id === queueItem.id).cached = true;
              }
            })
          );
        }

        const response = new Discord.MessageEmbed()
          .setColor('AQUA')
          .setDescription(`[${util.convert_time(queueItem.timeLength)}] [${queueItem.title}](${queueItem.link}) added to the queue`);
        message.channel.send(response);

        if (!server.playing) {
          play_song();
        }
      } else {
        return message.channel.send('Cannot parse valid ID from URL.');
      }
    }

    function play_song (seek) {
      clearTimeout(timer);
      server.voiceChannel.join().then(async connection => {

        let audio = queue[0];
        let dispatcher;
        let output;

        if (audio.cached) { //play from cached file if it exists

          server.playing_cached = true;

          if (!seek) seek = 0;
          const file = `./data/music_cache/${message.guild.id}_${audio.id}.webm`;
          output = new prism.FFmpeg({
            args: [
              '-ss', seek,
              '-i', file,
              '-analyzeduration', '0',
              '-loglevel', '0',
              '-f', 's16le',
              '-ar', '48000',
              '-ac', '2',
            ],
          });
          dispatcher = connection.play(output, {type: 'converted'});
          server.playing = dispatcher;
          server.ffmpeg = output.process;
          

        } else { //else stream directly

          server.playing_cached = false;

          output = ytdl(`https://www.youtube.com/watch?v=${audio.id}`, {filter: 'audioonly', highWaterMark: 1<<25});
          dispatcher = connection.play(output);
          server.playing = dispatcher;

        }

        if (!seek) {
          if (server.nowPlayingMessage) server.nowPlayingMessage.delete();
          const queueItem = audio;
          const response = new Discord.MessageEmbed()
            .setColor('AQUA')
            .setDescription(`[${util.convert_time(queueItem.timeLength)}] [${queueItem.title}](${queueItem.link}) now playing`);
          message.channel.send(response).then(msg => {
            server.nowPlayingMessage = msg;
          });
        }

        dispatcher.on('finish', () => {

          server.seekTime = '';
          if (!server.looping) {

            if (server.playing_cached) {
              
              server.ffmpeg.kill();

              let IdToRemove = queue[0].id;

              setTimeout(() => {
                fs.unlink(`./data/music_cache/${message.guild.id}_${IdToRemove}.webm`, (err) => {
                  if (err) console.log(err);
                });
              }, 5*1000);

            } else if (queue[0].cached) {

              fs.unlink(`./data/music_cache/${message.guild.id}_${queue[0].id}.webm`, (err) => {
                if (err) console.log(err);
              });

            }

            queue.shift();
            
          }

          if (!queue.length) {
            server.playing = '';
            if (server.nowPlayingMessage) server.nowPlayingMessage.delete();
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

    if (server.removeAllTimeout) { //remove timout for deleting entire cache if new song is being played
      clearTimeout(server.removeAllTimeout);
    }

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

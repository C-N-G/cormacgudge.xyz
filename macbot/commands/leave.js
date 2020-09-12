const util = require('../util/util.js');
const fs = require('fs');
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

    message.member.voice.channel.leave(); 

    let queueToRemove = server.queue

    if (server.playing_cached) {
      server.ffmpeg.kill()
    }

    function removeAll() {
      queueToRemove.forEach(item => {
        fs.unlink(`./data/music_cache/${message.guild.id}_${item.id}.webm`, (err) => {
          if (err) console.log(err)
        })
      });
    }

    if (server.removeAllTimeout) {
      clearTimeout(server.removeAllTimeout)
    }

    server.removeAllTimeout = setTimeout(removeAll, 5*1000);

    if (server.queue) {
      if (server.nowPlayingMessage) server.nowPlayingMessage.delete();
      clearInterval(server.seekCache);
      server.queue = [];
      server.playing = '';
      server.seekTime = '';
    }
    
	}
};

const util = require('../util/util.js');
const Discord = require('discord.js');
module.exports = {
	name: 'queue',
  aliases: ['q'],
	description: 'Lists the current queue.',
  cooldown: 1,
  guildOnly: true,
	execute(message) {
    
    if (!message.client.servers.get(message.guild.id)) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    const server = message.client.servers.get(message.guild.id);

    if (!server.queue || !server.queue.length) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    let currentTime = Math.floor(server.playing.streamTime / 1000);
    if (server.seekTime) {
      currentTime += parseInt(server.seekTime);
    }
    currentTime = util.convert_time(currentTime);
    const queue = server.queue;
    let msg = queue.map((ele, index) => `${index+1}: **[${util.convert_time(ele.timeLength)}]** ${ele.title}`);
    msg[0] = `1: **[${currentTime}/${util.convert_time(queue[0].timeLength)}]** ${queue[0].title}`;
    msg.join('\n');
    const embed = new Discord.MessageEmbed()
      .setColor('AQUA')
      .setTitle('Queue')
      .setDescription(msg);
    message.channel.send(embed);
	}
};

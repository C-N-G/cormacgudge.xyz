const Discord = require('discord.js');
module.exports = {
	name: 'queue',
  aliases: ['q'],
	description: 'Lists the current queue.',
  cooldown: 5,
  guildOnly: true,
	execute(message, args) {
    const server = message.client.servers.get(message.guild.id);

    if (!server.queue || !server.queue.size) {
      return message.channel.send('The queue is empty, try playing a song!');
    }

    const queue = server.queue;
    const embed = new Discord.MessageEmbed()
      .setTitle('Queue')
      .setDescription(queue
        .map(ele => `**${ele.length}** ${ele.title}`)
        .map((ele, index) => `${index+1}: ${ele}`)
        .join('\n')
      );
    message.channel.send(embed);
	}
};

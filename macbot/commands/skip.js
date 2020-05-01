
module.exports = {
	name: 'skip',
  aliases: ['next'],
	description: 'Skips the current song in the queue.',
  cooldown: 10,
  guildOnly: true,
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

    message.channel.send(`Skipping __***${server.queue[0].title}***__`);
    server.playing.end();

	}
};

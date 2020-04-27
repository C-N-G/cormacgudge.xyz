module.exports = {
	name: 'pause',
	description: 'Pauses the current audio.',
  cooldown: 10,
  guildOnly: true,
	execute(message, args) {
    const voiceChannel = message.member.voice.channel;
    const botVoiceChannel = message.guild.voice.channel;
    if (!voiceChannel || voiceChannel !== botVoiceChannel) {
      return message.reply('Please join my voice channel first!');
    }

    const server = message.client.servers.get(message.guild.id);

    if (server.playing.paused) return;

    server.playing.pause();
    message.channel.send('Audio paused.');
	}
};

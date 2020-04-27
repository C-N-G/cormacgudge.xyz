module.exports = {
	name: 'leave',
  aliases: ['stop', 's'],
	description: 'Makes the bot leave the voice channel',
  cooldown: 10,
  guildOnly: true,
	execute(message, args) {
    const voiceChannel = message.member.voice.channel;
    const botVoiceChannel = message.guild.voice.channel;
    if (!voiceChannel || voiceChannel !== botVoiceChannel) {
      return message.reply('Please join my voice channel first!');
    }

    const server = message.client.servers.get(message.guild.id);

    server.queue.clear();
    server.playing = '';
    voiceChannel.leave();
	}
};

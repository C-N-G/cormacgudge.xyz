module.exports = {
	name: 'avatar',
  aliases: ['icon', 'pfp'],
	description: 'Provides a link to the users avatar.',
  usage: '[user]',
  cooldown: 5,
  guildOnly: true,
	execute(message, args) {

    if (!args[0]) {
      return message.channel.send(message.author.displayAvatarURL({format:'png', dynamic:true, size:4096}));
    }


    function convertMention (mention) {
      if (!mention) return;

      if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
          mention = mention.slice(1);
        }

        return message.client.users.cache.get(mention);
      }
    }

    if (args[0]) {
      const user = convertMention(args[0]);
      return message.channel.send(user.displayAvatarURL({format:'png', dynamic:true, size:4096}));
    }
	}
};

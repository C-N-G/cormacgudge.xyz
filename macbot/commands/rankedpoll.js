const poll = require('./poll.js');
module.exports = {
	name: 'rankedpoll',
  aliases: ['rpoll', 'rp', 'rankedvote', 'rvote', 'rv'],
	description: 'Makes an instant runoff poll or alternative vote poll',
  usage: '<poll items> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    args.splice(1 ,0, '-r');
    poll.execute(message, args);

	}
};

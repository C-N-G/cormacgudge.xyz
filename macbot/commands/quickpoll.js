const poll = require('./poll.js');
module.exports = {
	name: 'quickpoll',
  aliases: ['qpoll', 'qp', 'quickvote', 'qvote', 'qv'],
	description: 'Makes a quick poll that users can vote on with reactions',
  usage: '<poll items> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    args.splice(1 ,0, '-q');
    poll.execute(message, args);

	}
};

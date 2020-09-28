const poll = require('./poll.js');
module.exports = {
	name: 'voicepoll',
  aliases: ['vpoll', 'vp', 'voicevote', 'vvote', 'vv'],
	description: 'Makes a voice poll so only users in the same voice channel as the poll maker can vote',
  usage: '<poll items> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    args.splice(1 ,0, '-v');
    poll.execute(message, args);

	}
};

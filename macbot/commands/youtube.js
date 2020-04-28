const yts = require('yt-search');
module.exports = {
	name: 'youtube',
  aliases: ['yt'],
	description: 'Searches and links videos from youtube.',
  usage: '<keyword> ...',
  cooldown: 5,
  args: true,
	execute(message, args) {
    const search = args.join('%20');

    const options = {
      query: search,
      pageStart: 1,
      pageEnd: 1
    };

    yts(options, (err, r) => {
      if (err) return err;
      const videos = r.videos;
      message.channel.send(videos[0].url);
    })
	}
};

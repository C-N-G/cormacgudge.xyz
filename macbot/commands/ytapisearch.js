const https = require('https');
const {google} = require('googleapis');
const config = require('../config.json');
const api_key = config.youtube_api_key;
module.exports = {
	name: 'ytapisearch',
	description: 'Searches and links videos from youtube using the v3 api.',
  usage: '<keyword> ...',
  cooldown: 5,
  args: true,
	execute(message, args) {
    const search = args.join('%20');
    const maxSearches = 1;

    function build_msg (response) {
      let msg = '';
      msg = `https://www.youtube.com/watch?v=${response.items[0].id.videoId}`;
      message.channel.send(msg);
    }

    https.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxSearches}&q=${search}&key=${api_key}`, (res) => {
      let body = '';
      res.on('data', (d) => {
        body += d;
      });
      res.on('end', () => {
        const response = JSON.parse(body);
        build_msg(response);
      });
    }).on('error', (err) => {
      console.log(err);
      return message.channel.send('An error occured, failed to retrieve api data.');
    });

	}
};

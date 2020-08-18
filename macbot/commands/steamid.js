const got = require('got');
module.exports = {
  name: 'steamid',
  aliases: ['stid'],
  description: 'Shows the steamID64 from a profile link',
  usage: '<steam profile link>',
  cooldown: 5,
  guildOnly: true,
  args: true,
  execute(message, args) {

    async function getSteamIdFromURL(url) {
      if (!url.startsWith('https://steamcommunity.com')) {
        return message.channel.send('That is not a proper steam community link');
      }

      if (url.startsWith('https://steamcommunity.com/profiles/')) {
        return message.channel.send(`The steamID64 is: ${url.split('/')[4]}`)
      }

      try {
        const response = await got(`${url}?xml=1`);
        const startIndex = response.body.search('<steamID64>') + 11;
        const endIndex = response.body.search('</steamID64>');
        return message.channel.send(`The steamID64 is: ${response.body.substring(startIndex, endIndex)}`);
      } catch (error) {
        console.log(error.response.body);
      }
    }

    getSteamIdFromURL(args[0])

  }
};
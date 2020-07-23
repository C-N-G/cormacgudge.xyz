const quotes = require('../quotes.json');
const Discord = require('discord.js');
module.exports = {
	name: 'dawnofwarquote',
  aliases: ['warhammerquote', 'warhammer', 'dowquote', 'dow', 'whq'],
	description: 'Provides quotes from the Dawn of War franchise.',
  usage: `[ [total|units] | ['unit'] ['quote number'|all] ]`,
  cooldown: 2,
	execute(message, args) {

    const data = [];

    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    args = args.map(ele => ele.toLowerCase());

    if (!args.length) {
      const randUnit = getRandomInt(quotes.Units.length);
      const unit = quotes.Units[randUnit].name;
      const randQuote = getRandomInt(quotes[unit].length);
      const quote = quotes[unit][randQuote];
      return message.channel.send(`${unit}: ${quote}`);
		}

    if (args[0] === 'total') {
      let num = 0;
      for (let i = 0; i < quotes.Units.length; i++) {
        num += quotes[quotes.Units[i].name].length;
      }
      return message.channel.send("Total quotes available: " + num);
    }

    if (args[0] === 'units') {
      let total = "";
      let factions = [];
      let last_fac_added = "";
      const embed = new Discord.MessageEmbed()
        .setTitle('Quotes available from these units')
        .setColor(0xFF0000);
      for (let i = 0; i < quotes.Units.length; i++) { //get list of factions
        if (last_fac_added !== quotes.Units[i].faction) {
          factions.push(quotes.Units[i].faction);
          last_fac_added = quotes.Units[i].faction;
        }
      }
      for (let i = 0; i < factions.length; i++) { //use faction list to make embed fields.
        for (let ii = 0; ii < quotes.Units.length; ii++) {
          if (quotes.Units[ii].faction === factions[i]) {
            total += quotes.Units[ii].name + `\n`;
          }
        }
        embed.addField(factions[i], total, 1);
        total = "";
      }
      message.author.send(embed);
      return message.channel.send('I\'ve sent you a DM with all my quotable units!')
    }

    let searchType = 'random';
    if (args[args.length - 1] === 'all') {
      searchType = args.pop();
    } else if (!isNaN(args[args.length - 1])) {
      searchType = args.pop() - 1;
    }

    const unitName = args.map(ele => `${ele[0].toUpperCase()}${ele.substr(1, ele.length)}`).join(' ');

    try {
      searchType = searchType === 'random' ? getRandomInt(quotes[unitName].length) : searchType;
      if (!isNaN(searchType) && searchType < 0 || searchType > quotes[unitName].length - 1) return message.channel.send('Bad quote index!');
      if (searchType === 'all') {
        const embed = new Discord.MessageEmbed()
          .setTitle(unitName)
          .setDescription(quotes[unitName].map(ele => `${quotes[unitName].indexOf(ele) + 1}: ${ele}`).join('\n'));
        data.push(embed);
      } else {
        const unitQuote = quotes[unitName][searchType];
        data.push(`${unitName}: ${unitQuote}`);
      }
    } catch (error) {
      return message.channel.send('That unit/quote does not exist');
    }

    return message.channel.send(data);

	}
};

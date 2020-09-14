const canvas = require('../util/canvas.js');
const util = require('../util/util.js');
const Discord = require('discord.js');
module.exports = {
	name: 'poll',
  aliases: ['strawpoll', 'vote'],
	description: 'Makes a poll that users can vote on with reactions',
  usage: '[single] [poll length] <poll items> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    const emojis = [
      '🇦','🇧','🇨','🇩','🇪','🇫','🇬','🇭','🇮','🇯','🇰','🇱','🇲',
      '🇳','🇴','🇵','🇶','🇷','🇸','🇹','🇺','🇻','🇼','🇽','🇾','🇿'
    ]

    const capitals = [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
    ]

    function convert_emojis (array) {

      let returnArray = [];
      for (const emoji of array) {
        for (let listEmoji = 0; listEmoji < emojis.length; listEmoji++) {

          if (emoji.codePointAt(0) == emojis[listEmoji].codePointAt(0)) {
            returnArray.push(capitals[listEmoji])
            break;
          }

        }
      }
      return returnArray;

    }

    function doubleSort(strArr, intArr) {

      let combinedValues = new Map(); //combine input and reaction count into one variable
      for (let i = 0; i < strArr.length; i++) {
        combinedValues.set(i, {emoji: strArr[i].slice(0,3), name: strArr[i].slice(3), count: intArr[i]})
      }
      
      let iterator = 0;

      let combinedValuesSorted = new Map(); // sort resulting map by reaction count
      const sortedValues = util.sort(intArr).reverse() 
      for (let num = 0; num < sortedValues.length; num++) {
        for (let str = 0; str < sortedValues.length; str++) {
          
          if (combinedValues.has(str) && sortedValues[num] == combinedValues.get(str).count) {
            combinedValuesSorted.set(iterator, combinedValues.get(str));
            iterator++;
            combinedValues.delete(str)
            break;
          }

        }
      }

      let tieValues = []; // get tied values
      let lastVal;
      combinedValuesSorted.forEach((value, key, map) => {
        if (lastVal && lastVal.count == value.count && tieValues.indexOf(value.count) == -1) {
          tieValues.push(value.count);
        }
        lastVal = value;
      })

      let sortedNames = []; // get sorted names
      combinedValuesSorted.forEach((value, key, map) => {
        sortedNames.push(value.name)
      })
      sortedNames.sort()

      let tempValue; // sort names between tied scores
      for (const tieValue of tieValues) {

        iterator = 0;

        for (let i = 0; iterator != combinedValuesSorted.size; i++) {

          if (i == combinedValuesSorted.size) {i = 0; iterator = 0;}
          
          if (
            i < combinedValuesSorted.size - 1 &&
            combinedValuesSorted.get(i).count == tieValue && 
            combinedValuesSorted.get(i + 1).count == tieValue &&
            sortedNames.indexOf(combinedValuesSorted.get(i).name) >
            sortedNames.indexOf(combinedValuesSorted.get(i + 1).name)
            ) { 
            tempValue = combinedValuesSorted.get(i);
            combinedValuesSorted.set(i, combinedValuesSorted.get(i + 1));
            combinedValuesSorted.set(i + 1, tempValue)
          } else {
            iterator++;
          }

        }
      }

      let tiedWinner = tieValues.indexOf(combinedValuesSorted.get(0).count) != -1 ? true : false;

      return [combinedValuesSorted, tiedWinner];

    }

    function format_input(args) {
      let response = args.join(' ');
      if (response.endsWith(',')) {
        response = response.substring(0, response.length - 1)
      }
      response = response.split(',').map((word, index) => word = `${emojis[index]} ` + word.trim());
      return response;
    }

    function update_message(msg, input) {
      const embed = new Discord.MessageEmbed()
      .setTitle(`Poll Open for ${msg.time_length} seconds`)
      .setDescription(msg.embed_desc)
      for (var i = 0; i < input.length; i++) {
        embed.addField(input[i].slice(0, 3) + msg.reaction_count[i], input[i].slice(2), true)
      }
      msg.edit(embed)
      msg.timer = setTimeout(update_message, 3000, msg, input);
    }

    async function send_collector(input, type, length, quick) {
      let embed = new Discord.MessageEmbed()
      .setTitle(`Poll Generating`)
      
      let msg = await message.channel.send(embed);

      //CONFIG START

      msg.reaction_count = [];
      msg.submitted_user = {};
      msg.time_length = Math.round(length);
      msg.type = type;
      msg.total_votes = 0;
      msg.quickpoll = quick;

      if (msg.type === 1) {
        msg.embed_desc = 'Only Single Voting Allowed';
      } else if (msg.type === 2) {
        msg.embed_desc = 'Multiple Votes Allowed';
      }
      const used_emojis = emojis.slice(0, input.length);

      for (var i = 0; i < input.length; i++) {
        msg.reaction_count.push(0);
        if (msg.quickpoll) {
          await msg.react(emojis[i]);
        }
      }

      const filter = (reaction, user) => {
        return used_emojis.includes(reaction.emoji.name) && user.id !== msg.author.id;
      }

      //CONFIG END

      embed = new Discord.MessageEmbed()
      .setTitle(`Poll Open for ${msg.time_length} seconds`)
      .setDescription(msg.embed_desc)
      for (var i = 0; i < input.length; i++) {
        embed.addField(input[i].slice(0, 3) + '0', input[i].slice(2), true)
      }
      msg.edit(embed);

      const collector = msg.createReactionCollector(filter, { time: msg.time_length*1000 });
      msg.timer = setTimeout(update_message, 3000, msg, input);

      collector.on('collect', (reaction, user) => {

        //check if the user has already voted, and return if voting type is set to single
        if (msg.submitted_user[user.id] && msg.type === 1) {
          return
        }

        //check if the user has added ANY reactions before
        if (!msg.submitted_user[user.id]) {
          msg.submitted_user[user.id] = [];
        }

        //check if the user has added THIS reaction before
        if (!msg.submitted_user[user.id].includes(reaction.emoji.name)) {
          msg.submitted_user[user.id].push(reaction.emoji.name);
        } else {
          return
        }

        //increase internal vote count
        msg.reaction_count[used_emojis.indexOf(reaction.emoji.name)]++;
        msg.total_votes++;

      });

      collector.on('end', async collected => {
        clearTimeout(msg.timer);
        const [items, tie] = doubleSort(input, msg.reaction_count)
        const embed = new Discord.MessageEmbed()
          .setTitle(`Poll Completed`)
          .setDescription(`Received ${msg.total_votes} vote(s) from ${Object.keys(msg.submitted_user).length} user(s)`);
        for (var i = 0; i < input.length; i++) {
          embed.addField(items.get(i).emoji + items.get(i).count, items.get(i).name, true);
        }

        if (!msg.total_votes) return msg.edit(embed); // send embed without pie chart if there were no votes

        let chartValues = [];
        let chartEmojis = [];
        items.forEach((value, key, map) => {
          if (value.count > 0) { // only draw items on chart if they score above 0
            chartValues.unshift(value.count);
            chartEmojis.unshift(value.emoji);
          }
        });
        let chartNames = convert_emojis(chartEmojis);
        const chart = canvas.draw_piechart(chartValues, chartNames);
        const image = new Discord.MessageAttachment(chart, 'canvas.png');
        embed.setImage('attachment://canvas.png');
        msg.delete();
        await message.channel.send({files: [image], embed: embed});

        if (!tie || msg.quickpoll) return; // do not send overflow prompt if no tie or quickpoll

        const filter = (reaction, user) => user.id == message.author.id;
        const promptMsg = await message.channel.send('If the poll maker would like to make an runoff poll please react to this message');
        promptMsg.awaitReactions(filter, {max: 1, time: 15*1000})
        .then(collected => {
          promptMsg.delete();
          let newInput = []
          let iterator = 0;
          items.forEach(item => {
            if (item.count == items.get(0).count) {
              newInput.push(emojis[iterator] + ' ' + item.name)
              iterator++;
            }
          });
          send_collector(newInput, msg.type, msg.time_length, false)
        })
        
      });

      collector.on('error', error => console.log(error));

    }

    let type = '';
    if (args[0] === 'single') {
      args.shift();
      type = 1; // only 1 vote per person
    } else if (args[0] === 'startquickpoll') {
      args.shift();
      type = 3; // make a quick poll
    } else {
      type = 2; // unlimited votes per person
    }

    let length = 120;
    if (!isNaN(args[0]) && args[0] <= 600) {
      length = args[0];
      args.shift();
    } else if (!isNaN(args[0]) && args[0] > 600) {
      return message.channel.send('A poll can only stay open for a maximum of 600 seconds (10 minutes)');
    } else if (!isNaN(args[0]) && args[0] <= 0) {
      return message.channel.send('Please input a positive number for the poll duration');
    }

    const input = format_input(args);

    if (input.length === 1) {
      return message.channel.send('you need at least two options');
    }

    if (input.length < emojis.length && type !== 3) {
      send_collector(input, type, length, false)
    } else if (type === 3 && input.length <= 7) {
      send_collector(input, 1, 60, true)
    } else {
      message.channel.send(`too many options, only allowed ${type === 3 ? 7 : emojis.length} max`);
    }


	}
};

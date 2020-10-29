/* eslint-disable no-prototype-builtins */
const canvas = require('../util/canvas.js');
const util = require('../util/util.js');
const Discord = require('discord.js');
module.exports = {
	name: 'poll',
  aliases: ['strawpoll', 'vote'],
	description: 'Makes a poll that users can vote on with reactions',
  usage: '[poll length in seconds] [-smvrq] <poll items> ...\ns  -  single vote only\nm  -  multi vote poll (default)\nv  -  voice only voting\nr  -  ranked voting\nq  -  quickpoll',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    const emojis = [
      '🇦','🇧','🇨','🇩','🇪','🇫','🇬','🇭','🇮','🇯','🇰','🇱','🇲',
      '🇳','🇴','🇵','🇶','🇷','🇸','🇹'
    ];

    const capitals = [
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T'
    ];

    function convert_emojis (array) {

      let returnArray = [];
      for (const emoji of array) {
        for (let listEmoji = 0; listEmoji < emojis.length; listEmoji++) {

          if (emoji.codePointAt(0) == emojis[listEmoji].codePointAt(0)) {
            returnArray.push(capitals[listEmoji]);
            break;
          }

        }
      }
      return returnArray;

    }

    function double_sort(strArr, intArr) {

      let combinedValues = new Map(); //combine input and reaction count into one variable
      for (let i = 0; i < strArr.length; i++) {
        combinedValues.set(i, {emoji: strArr[i].slice(0,3), name: strArr[i].slice(3), count: intArr[i]});
      }
      
      let iterator = 0;

      let combinedValuesSorted = new Map(); // sort resulting map by reaction count
      const sortedValues = util.sort(intArr).reverse() ;
      for (let num = 0; num < sortedValues.length; num++) {
        for (let str = 0; str < sortedValues.length; str++) {
          
          if (combinedValues.has(str) && sortedValues[num] == combinedValues.get(str).count) {
            combinedValuesSorted.set(iterator, combinedValues.get(str));
            iterator++;
            combinedValues.delete(str);
            break;
          }

        }
      }

      let tieValues = []; // get tied values
      let lastVal;
      combinedValuesSorted.forEach((value) => {
        if (lastVal && lastVal.count == value.count && tieValues.indexOf(value.count) == -1) {
          tieValues.push(value.count);
        }
        lastVal = value;
      });

      let sortedNames = []; // get sorted names
      combinedValuesSorted.forEach((value) => {
        sortedNames.push(value.name);
      });
      sortedNames.sort();

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
            combinedValuesSorted.set(i + 1, tempValue);
          } else {
            iterator++;
          }

        }
      }

      let tiedWinner = tieValues.indexOf(combinedValuesSorted.get(0).count) != -1 ? true : false;

      return [combinedValuesSorted, tiedWinner];

    }

    function simulate_runoff(ballots) {

      let votes = {};
      let weights = {};
      let totalVotes, highestVote, lowestVote, lowestVotedItem, lowestWeight;
    
      // count first preference votes
      for (const user in ballots) {
        if (!votes[ballots[user][0]]) {
          votes[ballots[user][0]] = 1;
          continue;
        }
        votes[ballots[user][0]]++;
      }
    
      // do a borda count to resolve ties
      let i;
      for (const voter in ballots) {
        i = ballots[voter].length;
        for (const voteItem of ballots[voter]) {
          if (!weights.hasOwnProperty(voteItem)) {
            weights[voteItem] = i;
          } else {
            weights[voteItem] += i;
          }
          i--;
        }
      }
    
      i = 0; //DEBUG
    
      let winner = false;
      while (winner == false) {
    
        // cacluate highest voted item
        highestVote = 0;
        totalVotes = 0;
        for (const option in votes) {
          totalVotes += votes[option];
          if (votes[option] > highestVote) highestVote = votes[option];
        }
    
        // if there is a majority winner from this calcultion then consider a winner chosen
        if (highestVote / totalVotes > 0.5) break;
    
        // else find the item with fewest first votes
        lowestVote = highestVote;
        lowestVotedItem = undefined;
        for (const option in votes) {
          if (votes[option] < lowestVote) {
            lowestVote = votes[option];
            lowestVotedItem = option;
          }
        }
    
        // if there is no lowest voted item then use borda count to determine lowest option
        lowestWeight = 0;
        if (lowestVotedItem == undefined) {
          for (const option in votes) {
            if (weights[option] > lowestWeight) {
              lowestWeight = weights[option];
              lowestVotedItem = option;
            }
          }
        }
    
        // redistribute votes from the lowest voted option to the next preference for those voters
        for (const user in ballots) {
    
          if (ballots[user][0] != lowestVotedItem) continue;// check if voter voted for lowest option
    
          let voidBallot = false;
          while (voidBallot == false) {
    
            if (votes.hasOwnProperty(ballots[user][1])) { // check if ballot has a valid second prefernce vote
              votes[ballots[user][1]]++; // if yes then redistribute vote
              ballots[user].shift();
              break;
            } else {
              ballots[user].shift(); // if no then remove first preference vote
            }
    
            if (ballots[user].length == 1) { // if there is no lower preference to distribute votes then consider that ballot void
              delete ballots[user];
              voidBallot = true;
            }
    
          }
    
        }
    
        // remove the item with the fewest votes
        delete votes[lowestVotedItem];
    
        // if item holds majoirty of the votes then consider a winner chosen
        if (highestVote / totalVotes >= 0.5) winner = true;
    
        i++; // DEBUG
        if (i > 2000)  {
          message.channel.send('ERROR: rank poll overflow');
          break;
        }
    
      }
    
      return votes;
    
    }

    function format_input(args) {
      let response = args.join(' ');
      if (response.endsWith(',')) {
        response = response.substring(0, response.length - 1);
      }
      if (response.startsWith(',')) {
        response = response.substring(1);
      }
      response = response.split(',').map((word, index) => word = `${emojis[index]} ` + word.trim());
      return response;
    }

    function update_message(msg, input) {
      const embed = new Discord.MessageEmbed()
      .setColor('AQUA')
      .setTitle(`Poll Open for ${msg.time_length} seconds`)
      .setDescription(msg.embed_desc);
      for (var i = 0; i < input.length; i++) {
        embed.addField(input[i].slice(0, 3) + msg.reaction_count[i], input[i].slice(2), true);
      }
      msg.edit(embed);
      msg.timer = setTimeout(update_message, 3000, msg, input);
    }

    async function send_collector(input, config) {
      let embed = new Discord.MessageEmbed()
      .setColor('AQUA')
      .setTitle(`Poll Generating`);
      
      let msg = await message.channel.send(embed);

      //CONFIG START

      msg.config = config;
      msg.reaction_count = [];
      msg.submitted_user = {};
      msg.total_votes = 0;
      msg.time_length = Math.round(config.length);
      msg.singleVoting = config.singleVoting;
      msg.quickPoll = config.quickPoll;
      msg.voiceOnly = config.voiceOnly;
      msg.rankedVoting = config.rankedVoting;

      if (msg.singleVoting) {
        msg.embed_desc = 'Single voting only.';
      } else {
        msg.embed_desc = 'Multiple voting allowed.';
      }

      if (msg.voiceOnly) {
        msg.embed_desc = msg.embed_desc + '\nVoice voting only.';
        msg.allowedVoters = message.member.voice.channel.members.map(member => member = member.user.id);
      }

      if (msg.rankedVoting) {
        msg.embed_desc = msg.embed_desc + '\nRanked voting enabled.';
        msg.voteOrder = {};
      }

      const used_emojis = emojis.slice(0, input.length);

      for (var i = 0; i < input.length; i++) {
        msg.reaction_count.push(0);
        if (msg.quickPoll) {
          await msg.react(emojis[i]);
        }
      }

      const filter = (reaction, user) => {
        return used_emojis.includes(reaction.emoji.name) && user.id !== msg.author.id;
      };

      //CONFIG END

      embed = new Discord.MessageEmbed()
      .setColor('AQUA')
      .setTitle(`Poll Open for ${msg.time_length} seconds`)
      .setDescription(msg.embed_desc);
      for (let i = 0; i < input.length; i++) {
        embed.addField(input[i].slice(0, 3) + '0', input[i].slice(2), true);
      }
      msg.edit(embed);

      const collector = msg.createReactionCollector(filter, { time: msg.time_length*1000 });
      msg.timer = setTimeout(update_message, 3000, msg, input);

      collector.on('collect', (reaction, user) => {

        //check if user is in same voice channel of poll maker if voice only voting is enabled
        if (msg.voiceOnly && msg.allowedVoters.indexOf(user.id) == -1) {
          return;
        }

        //check if the user has already voted, and return if voting type is set to single
        if (msg.submitted_user[user.id] && msg.singleVoting) {
          return;
        }

        //check if the user has added ANY reactions before
        if (!msg.submitted_user[user.id]) {
          msg.submitted_user[user.id] = [];
        }

        //check if the user has added THIS reaction before
        if (!msg.submitted_user[user.id].includes(reaction.emoji.name)) {
          msg.submitted_user[user.id].push(reaction.emoji.name);
        } else {
          return;
        }

        //increase internal vote count
        msg.reaction_count[used_emojis.indexOf(reaction.emoji.name)]++;
        msg.total_votes++;

      });

      collector.on('end', async () => {

        if (config.rankedVoting) {

          let runOff = simulate_runoff(msg.submitted_user);

          input.map(e => e = e.slice(0,2)).forEach((item, index) => {
            if (runOff.hasOwnProperty(item)) {
              msg.reaction_count[index] = runOff[item];
            } else {
              msg.reaction_count[index] = 0;
            }
          });

        }

        clearTimeout(msg.timer);
        const [items, tie] = double_sort(input, msg.reaction_count);
        const embed = new Discord.MessageEmbed()
          .setColor('AQUA')
          .setTitle(`Poll Completed`)
          .setDescription(`Received ${msg.total_votes} vote(s) from ${Object.keys(msg.submitted_user).length} user(s)`);
        for (var i = 0; i < input.length; i++) {
          embed.addField(items.get(i).emoji + items.get(i).count, items.get(i).name, true);
        }

        if (!msg.total_votes) return msg.edit(embed); // send embed without pie chart if there were no votes

        let chartValues = [];
        let chartEmojis = [];
        items.forEach((value) => {
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

        if (!tie) return; // do not send overflow prompt if no tie or quickpoll

        const filter = (reaction, user) => user.id == message.author.id;
        const promptMsg = await message.channel.send('If the poll maker would like to make a runoff poll please react to this message');
        promptMsg.awaitReactions(filter, {max: 1, time: 30*1000})
        .then(collected => {

          promptMsg.delete();
          if (collected.size != 1) return;
          let newInput = [];
          let iterator = 0;
          items.forEach(item => {
            if (item.count == items.get(0).count) {
              newInput.push(emojis[iterator] + ' ' + item.name);
              iterator++;
            }
          });
          send_collector(newInput, msg.config);

        });

      });

      collector.on('error', error => console.log(error));

    }

    function get_config(args) {

      let config = {
        length: undefined,
        singleVoting: undefined,
        voiceOnly: undefined,
        rankedVoting: undefined,
        quickPoll: false,
        errorMsg: false
      };

      if (!isNaN(args[0]) && args[0] <= 600) {
        config.length = args[0];
        args.shift();
      } else if (!isNaN(args[0]) && args[0] > 600) {
        config.length = 600;
        args.shift();
      } else if (!isNaN(args[0]) && args[0] <= 0) {
        config.length = 5;
        args.shift();
      }

      for (const arg of args) {

        if (!arg.startsWith('-')) continue;

        for (const letter of arg) {

          switch (letter) {
            case 's':
              config.singleVoting = true;
              break;
            case 'm':
              config.singleVoting = false;
              break;
            case 'v':
              config.voiceOnly = true;
              break;
            case 'r':
              config.rankedVoting = true;
              break;
            case 'q':
              if (config.length == undefined) config.length = 60; // set quickpoll length to 60 seconds if no length is given
              if (config.singleVoting == undefined) config.singleVoting = true;
              if (config.voiceOnly == undefined) config.voiceOnly = false;
              if (config.rankedVoting == undefined) config.rankedVoting = false;
              config.quickPoll = true;
              break;
          }

        }

      }

      // remove config arguments from arguments list
      let removedAllArgs = false;
      while (removedAllArgs == false) {
        if (args.findIndex(ele => ele[0].startsWith('-')) != -1) {
          args.splice(args.findIndex(ele => ele[0].startsWith('-')), 1);
          continue;
        }
        removedAllArgs = true;
      }

      // throw an error message if trying to use voice only voting while not in a voice channel
      if (!message.member.voice.channelID && config.voiceOnly) {
        config.errorMsg = 'you must be in a voice channel to enable voice only voting';
      }

      // if values aren't chosen then set defaults
      if (config.length == undefined) config.length = 120;
      if (config.singleVoting == undefined) config.singleVoting == false;
      if (config.voiceOnly == undefined) config.voiceOnly = false;
      if (config.rankedVoting == undefined) config.rankedVoting = false;
      return config;

    }

    let config = get_config(args);

    if (config.errorMsg) {
      return message.channel.send(config.errorMsg);
    }

    const input = format_input(args);


    if (input.length <= 1) {
      return message.channel.send('you need at least two items to make a poll');
    } else if (input.length > emojis.length) {
      return message.channel.send(`too many options, only allowed ${emojis.length} max`);
    } else if (input.length > 7 && config.quickPoll) {
      return message.channel.send(`too many options, only allowed 7 max`);
    }

    send_collector(input, config);

	}
};

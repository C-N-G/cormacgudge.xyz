const canvas = require('../util/canvas.js');
const util = require('../util/util.js');
const Discord = require('discord.js');
module.exports = {
	name: 'poll',
  aliases: ['strawpoll', 'vote'],
	description: 'Makes a poll that users can vote on with reactions',
  usage: '[single] [<poll length>] <poll items> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
	execute(message, args) {

    const emojis = [
      '🇦','🇧','🇨','🇩','🇪','🇫','🇬','🇭','🇮','🇯','🇰','🇱','🇲',
      '🇳','🇴','🇵','🇶','🇷','🇸','🇹','🇺','🇻','🇼','🇽','🇾','🇿'
    ]

    function format_input(args) {
      let response = args.join(' ')
      .split(',')
      .map((word, index) => word = `${emojis[index]} ` + word.trim())
      return response;
    }

    function update_message(msg) {
      const embed = new Discord.MessageEmbed()
      .setTitle(`Poll Open for ${msg.time_length} seconds`)
      .setDescription(msg.embed_desc)
      for (var i = 0; i < input.length; i++) {
        embed.addField(input[i].slice(0, 3) + msg.reaction_count[i], input[i].slice(2), true)
      }
      msg.edit(embed)
      msg.timer = setTimeout(update_message, 3000, msg);
    }

    function send_collector(type, length, quick) {
      const embed = new Discord.MessageEmbed()
      .setTitle(`Poll Generating`)
      message.channel.send(embed).then(async msg => {

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

        const embed = new Discord.MessageEmbed()
        .setTitle(`Poll Open for ${msg.time_length} seconds`)
        .setDescription(msg.embed_desc)
        for (var i = 0; i < input.length; i++) {
          embed.addField(input[i].slice(0, 3) + '0', input[i].slice(2), true)
        }
        msg.edit(embed);

        const collector = msg.createReactionCollector(filter, { time: msg.time_length*1000 });
        msg.timer = setTimeout(update_message, 3000, msg);

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

        collector.on('end', collected => {
          clearTimeout(msg.timer);
          const embed = new Discord.MessageEmbed()
          .setTitle(`Poll Completed`)
          .setDescription(`Received ${msg.total_votes} vote(s) from ${Object.keys(msg.submitted_user).length} user(s)`)
          for (var i = 0; i < input.length; i++) {
            embed.addField(input[i].slice(0, 3) + msg.reaction_count[i], input[i].slice(2), true)
          }
          if (!msg.total_votes) {
            msg.edit(embed);
          } else {
            const input = msg.reaction_count.filter(val => val > 0);
            const values = input.length > 1 ? util.sort(input) : input;
            console.log(values);
            const chart = canvas.draw_piechart(values);
            const image = new Discord.MessageAttachment(chart, 'canvas.png');
            embed.setImage('attachment://canvas.png');
            msg.delete();
            message.channel.send({files: [image], embed: embed});
          }
        });

        collector.on('error', error => console.log('collector error'))

      }).catch(error => console.log('collector message error'))
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
      return message.channel.send('A poll can only stay open for a maximum for 600 seconeds (10 minutes)');
    }
    console.log(args);
    const input = format_input(args);

    if (input.length === 1) {
      return message.channel.send('you need at least two options');
    }

    if (input.length < emojis.length && type !== 3) {
      send_collector(type, length, false)
    } else if (type === 3 && input.length <= 7) {
      send_collector(1, 60, true)
    } else {
      message.channel.send(`too many options, only allowed ${type === 3 ? 7 : emojis.length} max`);
    }


	}
};

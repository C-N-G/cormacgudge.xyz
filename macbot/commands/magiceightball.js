const util = require('../util/util.js');
module.exports = {
  name: 'magiceightball',
  aliases: ['meb'],
  description: 'Asks the magic eight ball a question',
  usage: '<question>',
  cooldown: 2,
  guildOnly: true,
  args: false,
  execute(message, args) {

    const respones = [
      "As I see it, yes.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      "Don’t count on it.",
      "It is certain.",
      "It is decidedly so.",
      "Most likely.",
      "My reply is no.",
      "My sources say no.",
      "Outlook not so good.",
      "Outlook good.",
      "Reply hazy, try again.",
      "Signs point to yes.",
      "Very doubtful.",
      "Without a doubt.",
      "Yes.",
      "Yes – definitely.",
      "You may rely on it."
    ];

    if (args.length == 0) return message.channel.send('To find the answer one must provide the question.');

    message.channel.send(respones[util.random(20)]);
  }
};

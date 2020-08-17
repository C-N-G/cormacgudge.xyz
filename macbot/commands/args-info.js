module.exports = {
  name: 'args-info',
  aliases: ['arginfo', 'arginf'],
  description: 'Information about the arguments provided.',
  usage: '<args> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
  execute(message, args) {
    if (args[0] === 'foo') {
      return message.channel.send('bar');
    }
      console.log(args);
      message.channel.send(`Arguments: ${args}\nArguments length: ${args.length}`);
    }
};

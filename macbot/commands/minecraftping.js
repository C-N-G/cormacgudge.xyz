const https = require('https'); // powered by https://api.mcsrvstat.us
const Discord = require('discord.js');
module.exports = {
	name: 'minecraftping',
  aliases: ['mcp', 'mcping', 'minecraftp'],
	description: 'Provides information about a minecraft server.',
  usage: '<server ip> [player|list|mods|plugins|all]',
  cooldown: 5,
  args: true,
	execute(message, args) {
    // if (args[0] === 'cur') args[0] = 'mc.ancarnetwork.cf';
    if (args[0] === 'cur') args[0] = '89.127.42.240:25565';
    let msg = '';

    function build_msg(response) {
      if (['list', 'mods', 'plugins', 'all'].find(ele => ele === args[1]) || !args[1]){
        msg = `**IP**: ${response.ip}:${response.port}`;
        msg += `\n**Version**: ${response.version}`;
        msg += `\n**Player Count**: [${response.players.online}/${response.players.max}]`;
        if (args[1] === 'all' || args[1] === 'list') {
          if (response.players.list) {
            msg += `\n**Player List**: ${response.players.list.join(', ')}`;
          } else {
            msg += `\n**Player List**: Cannot access player list`;
          }
        }
        if (args[1] === 'all' || args[1] === 'mods') {
          if (response.mods) {
            msg += `\n**Mods**: ${Object.values(response.mods.raw).join(', ')}`;
          } else {
            msg += `\n**Mods**: None`;
          }
        }
        if (args[1] === 'all' || args[1] === 'plugins') {
          if (response.plugins) {
            msg += `\n**Plugins**: ${Object.values(response.plugins.raw).join(', ')}`;
          } else {
            msg += `\n**Plugins**: None`;
          }
        }
      } else {
        if (response.players.list) {
          const name = args[1].toLowerCase();
          const list = Object.values(response.players.list);
          const player_index = list.map(ele => ele.toLowerCase()).findIndex(ele => ele === name);
          const player = list[player_index];
          list.map(ele => ele.toLowerCase()).find(ele => ele === name) ? msg = `${player} is online` : msg = `${name} is offline`;
        } else {
          return message.channel.send('Cannot access player list.');
        }
      }
      const embed = new Discord.MessageEmbed()
        .setTitle(args[0])
        .setDescription(msg);
      message.channel.send(embed);
    }

    https.get(`https://api.mcsrvstat.us/2/${args[0]}`, (res) => {
      let body = '';
      res.on('data', (d) => {
        body += d;
      });
      res.on('end', () => {
        if (body.startsWith('429')) {
          return message.channel.send('Invalid address');
        }
        const response = JSON.parse(body);
        if (response.online) {
          build_msg(response);
        } else {
          message.channel.send('server is offline');
        }
        
      });
    }).on('error', (err) => {
      console.log(err);
      return message.channel.send('An error occured, failed to retrieve api data.');
    });


	}
};

// http://warbandmain.taleworlds.com/handlerservers.ashx?type=list&gametype=nw
// curl --request GET 151.80.230.22:17240
// master server provides list of ips, then http get request to server returns server info
const http = require('http');
const net = require('net');
const fs = require('fs');
const Fuse = require('fuse.js');
const Discord = require('discord.js');
module.exports = {
	name: 'warbandping',
  aliases: ['nwping', 'nwp'],
	description: 'Provides information about Mount and Blade Warband servers',
  usage: '<server ip> | search <string>',
  cooldown: 5,
  guildOnly: false,
  args: true,
	execute(message, args) {

    function get_master_server_list() {
      message.channel.send('fetching server list').then((msg) => {
        http.get('http://warbandmain.taleworlds.com/handlerservers.ashx?type=list&gametype=nw', (res) => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', async () => {
            msg.edit(`${msg.content}\nrequesting server info`);
            await format_master_list(data);
            msg.edit(`${msg.content}\nserver list file updated`);
            message.client.fetchingmasterlist = false;
          });
        });
      });
    }

    function format_master_list(list) {
      return new Promise((resolve, reject) => {
        let formatted_servers = [];
        let unformatted_servers = list.split('|');
        let responses = 0;
        for (var i = 0; i < unformatted_servers.length; i++) {
          get_server_info(unformatted_servers[i])
          .then(server => formatted_servers.push(`[${server.address}]-[${server.name}]-[${server.mod}]-[${server.mode}]`))
          .catch(result => console.log(result))
          .finally(() => {
            responses++;
            if (responses == unformatted_servers.length) {
              fs.writeFile('./data/nw_servers.txt', formatted_servers.join('\n'), () => resolve());
            }
          });
        }
      });
    }

    function get_server_info(address) {
      return new Promise((resolve, reject) => {
        if (!address) {
          return reject('error not a proper address');
        }
        const addr = address.split(':');
        const host = addr[0];
        const port = addr[1];
        if (port >= 63336 || port < 1 || !port) {
          return reject('error not a proper port');
        }
        const request = `
        GET / HTTP/1.1
        Host:${host}
        `;
        const socket = net.connect(port, host, () => {
          let data = '';
          socket.end(request);
          socket.on('data', chunk => {
            data += chunk;
          });
          socket.on('end', () => {
            resolve(format_response(data, address));
          });
        });
        socket.on('error', (error) => {
          reject(`error with address ${address}`);
        });
      });
    }

    function format_response(res, addr) {
      const data = res.split('\n').map(w => w = w.trimStart());
      while (!data[0].startsWith('<ServerStats>')) { // remove packet response information
        data.shift();
        if (data.length <= 0) {
          console.log('broken response from ' + addr);
          break;
        }
      }
      console.log(data);
      let server = {};
      server.address = addr;
      try {
        server.name = data[1].startsWith('<Name>') ? data[1].substring(6, data[1].length - 7) : 'unknown';
        server.mod = data[2].startsWith('<ModuleName>') ? data[2].substring(12, data[2].length - 13) : 'unknown';
        server.mode = data[8].startsWith('<MapTypeName>') ? data[8].substring(13, data[8].length - 14) : 'unknown';
        server.curPlayers = data[9].startsWith('<NumberOfActivePlayers>') ? data[9].substring(23, data[9].length - 24) : '0';
        server.maxPlayers = data[10].startsWith('<MaxNumberOfPlayers>') ? data[10].substring(20, data[10].length - 21) : '0';
      } catch (error) {
        console.log('nwp error 0: ' + error);
      }
      return server;
    }

    function check_server_file() {
      try {
        if (fs.existsSync('./data/nw_servers.txt')) {
          return true;
        } else {
          return false;
        }
      } catch (e) {
        console.log(e);
        message.channel.send(`error`);
      }
    }

    function send_server_file() {
      if (check_server_file()) {
        message.channel.send({
          files: [{
            attachment: './data/nw_servers.txt',
            name: 'nw_servers.txt'
          }]
        });
      } else {
        message.channel.send('no file found, try updating');
      }
    }

    function track(addr) {
      get_server_info(addr)
      .then(server => {
        message.client.user.setActivity(`[${server.curPlayers}/${server.maxPlayers}]`);
        timer = setTimeout(track, 1000*120, addr);
      })
      .catch(result => message.channel.send(result));
    }

    function stop_tracking() {
      clearTimeout(timer);
      message.client.user.setActivity();
      message.channel.send('tracking stopped');
    }

    function server_search(args) {
      if (check_server_file()) {
        fs.readFile('./data/nw_servers.txt', 'utf8', (err, data) => {
          let servers = data.split('\n').map(server => {
            const data = server.split(']-[');
            const ip = data[0].substring(1);
            const name = data[1];
            const mod = data[2];
            const mode = data[3].slice(0, -1);
            return {ip:ip, name:name, mod:mod, mode:mode};
          });
          const options = {
            includeScore: true,
            keys: ['name']
          };
          const fuzzy = new Fuse(servers, options);
          const result = fuzzy.search(args.join(' '));
          const maxResults = 10 < result.length ? 10 : result.length;
          if (!result.length) {
            return message.channel.send('no servers found matching that query');
          }
          message.channel.send('searching...').then((msg) => {
            let response = '';
            let response_count = 0;
            for (var i = 0; i < maxResults; i++) {
              get_server_info(result[i].item.ip)
              .then(server => {
                response += `${server.address} - ${server.name} - ${server.mod} - ${server.mode} [${server.curPlayers}/${server.maxPlayers}]\n`;
              })
              .catch(result => console.log(result))
              .finally(() => {
                response_count++;
                if (response_count == maxResults) {
                  const embed = new Discord.MessageEmbed()
                  .setTitle(`result for "${args.join(' ')}"`)
                  .setDescription(response);
                  msg.edit(embed);
                }
              });
            }
          });
        });
      } else {
        message.channel.send('no file found, try updating');
      }
    }

    if (args[0] === 'gf') {
      args[0] = '193.70.7.93:7400';
    } else if (args[0] === 'tp') {
      args[0] = '78.46.45.166:4153';
    }

    if (args[0] === 'update') {
      if (!message.client.fetchingmasterlist) {
        message.client.fetchingmasterlist = true;
        get_master_server_list();
      } else {
        message.channel.send('list is currently being updated');
      }
    } else if (args[0] === 'file') {
      send_server_file();
    } else if (args.length === 2 && args[1] == 'track') {
      let timer;
      track(args[0]);
      message.channel.send(`now tracking ${args[0]}`);
    } else if (args[0] === 'stoptracking') {
      stop_tracking();
    } else if (args[0] === 'search') {
      args.shift();
      server_search(args);
    } else if (args.length === 1) {
      get_server_info(args[0])
      .then(server => message.channel.send(`${server.name} - ${server.mod} - ${server.mode} [${server.curPlayers}/${server.maxPlayers}]`))
      .catch(result => message.channel.send(result));
    }

	}
};

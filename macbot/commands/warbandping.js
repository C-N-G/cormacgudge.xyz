// http://warbandmain.taleworlds.com/handlerservers.ashx?type=list&gametype=nw
// curl --request GET 151.80.230.22:17240
// master server provides list of ips, then http get request to server returns server info
const http = require('http');
const net = require('net');
const fs = require('fs');
module.exports = {
	name: 'warbandping',
  aliases: ['nwping', 'nwp'],
	description: 'Provides information about Mount and Blade Warband servers',
  usage: '<server ip>',
  cooldown: 1,
  guildOnly: true,
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
        })
      })
    };

    function format_master_list(list) {
      return new Promise((resolve, reject) => {
        let formatted_servers = [];
        let unformatted_servers = list.split('|');
        let responses = 0;
        for (var i = 0; i < unformatted_servers.length; i++) {
          get_server_info(unformatted_servers[i])
          .then(server => formatted_servers.push(`[${server.address}]-[${server.name}]`))
          .catch(result => console.log(result))
          .finally(() => {
            responses++;
            if (responses == unformatted_servers.length) {
              fs.writeFile('./nw_servers.txt', formatted_servers.join('\n'), () => resolve());
            }
          })
        }
      })
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
      })
    };

    function format_response(res, addr) {
      const data = res.split('\n');
      let server = {};
      server.address = addr;
      if (data[1] && data[9] && data [10]) {
        server.name = data[1].startsWith('<Name>') ? data[1].substring(6, data[1].length - 7) : 'unknown';
        server.curPlayers = data[9].startsWith('<NumberOfActivePlayers>') ? data[9].substring(23, data[9].length - 24) : '0';
        server.maxPlayers = data[10].startsWith('<MaxNumberOfPlayers>') ? data[10].substring(20, data[10].length - 21) : '0';
      }
      return server;
    }

    function send_server_file() {
      try {
        if (fs.existsSync('./nw_servers.txt')) {
          message.channel.send({
            files: [{
              attachment: './nw_servers.txt',
              name: 'nw_servers.txt'
            }]
          })
        } else {
          message.channel.send('no file found, try updating');
        }
      } catch (e) {
        console.log(e);
        message.channel.send(`error: ${e}`);
      }
    }

    function track(addr) {
      get_server_info(addr)
      .then(server => {
        message.client.user.setActivity(`[${server.curPlayers}/${server.maxPlayers}]`);
        timer = setTimeout(track, 1000*120, addr);
      })
      .catch(result => message.channel.send(result))
    }

    function stoptracking() {
      clearTimeout(timer);
      message.client.user.setActivity();
      message.channel.send('tracking stopped');
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
      stoptracking();
    } else if (args.length === 1) {
      get_server_info(args[0])
      .then(server => message.channel.send(`${server.name} [${server.curPlayers}/${server.maxPlayers}]`))
      .catch(result => message.channel.send(result))
    }

	}
};

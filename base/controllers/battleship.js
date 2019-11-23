exports.render = function(req, res) {
  res.render('battleship', {
    meta_title: 'Battleship',
    meta_desc: 'Battleship game',
    meta_js: '/javascripts/battleship.js',
    meta_css: '/stylesheets/battleship.css'
  });
};
exports.index = function(io) {
  var players = [];
  var current_game = {
    player_count: 0,
    players: {
      1: {},
      2: {}
    },
    started: false,
  };
  var battleship = io
    .of('/battleship')
    .on('connection', function(socket){

      let this_player = new player();
      players.push(this_player);

      console.log(`player with id ${this_player.id} has joined lobby. total players = ${players.length}`);

      function player() {
        this.id = socket.id;
        this.ship_map;
        this.hit_map;
        this.ships;
        this.turn = false;
        this.ready = false;
        this.status = 'joined';
      }

      function check_health(player) {
        let health = 0;
        for (var i = 0; i < player.ships.length; i++) {
          health += player.ships[i].size - player.ships[i].hits;
        }
        return health;
      }

      function deduct_ship_health(i_x, i_y, player) {
        for (var i = 0; i < player.ships.length; i++) {
          console.log(`${i_x}, ${i_y}, ${player.ships[i].x}, ${player.ships[i].y},`)
          if (player.ships[i].rotation == 0 &&
              i_x == player.ships[i].x &&
              i_y >= player.ships[i].y &&
              i_y <= player.ships[i].y + (player.ships[i].size - 1)
              ||
              player.ships[i].rotation == 1 &&
              i_y == player.ships[i].y &&
              i_x >= player.ships[i].x &&
              i_x <= player.ships[i].x + (player.ships[i].size - 1)
          ) {
            player.ships[i].hits++;
            console.log(`total health is ${check_health(player)}`)
          }
        }
      }

      function hit_detection(player_1, player_2) {
        // TODO: change how maps work so that they're completely processed by the server
        // detect if player_1 has hit any boats of player_2 with their shots
        for (var i_x = 0; i_x < player_1.ship_map.length; i_x++) {
          for (var i_y = 0; i_y < player_1.ship_map.length; i_y++) {
            if (player_1.hit_map[i_x][i_y] == 3 && player_2.ship_map[i_x][i_y] == 1) {
              player_1.hit_map[i_x][i_y] = 1;
              deduct_ship_health(i_y, i_x, player_2);
              check_game_over(player_1, player_2);
            } else if (player_1.hit_map[i_x][i_y] == 3 && player_2.ship_map[i_x][i_y] == 0) {
              player_1.hit_map[i_x][i_y] = 2;
            }
          }
        }
      }

      function check_game_over(player_1, player_2) {
        if (check_health(player_2) <= 0) {
          battleship.to(player_1.id).emit('game won');
          battleship.to(player_2.id).emit('game lost');
        }
        current_game.started = false;
        current_game.players[1].ready = false;
        current_game.players[2].ready = false;
        battleship.emit('turn update', false);
      }

      socket.on('join request', function(){
        if (current_game.player_count >= 2) {
          socket.emit('game full');
        } else {
          socket.emit('join request granted');
          current_game.players[current_game.player_count + 1] = this_player;
          if (current_game.players[1].ready) {
            socket.emit('player status', true);
          }
          current_game.player_count++;
          console.log(`player with id ${this_player.id} has joined game. total players = ${current_game.player_count}`);
        }
      });

      socket.on('player spectating', function(){
        console.log('player is spectating');
        socket.emit('game status', current_game.started);
      });

      socket.on('disconnect', function(){

        if (this_player.id == current_game.players[1].id || this_player.id == current_game.players[2].id) {
          console.log(`player with id ${this_player.id} has left game. total players = ${current_game.player_count}`)
          current_game.player_count--;
          if (current_game.player_count < 0) {
            current_game.player_count = 0;
          }
        }

        if (this_player.id == current_game.players[1].id) {
          current_game.players[1] = current_game.players[2];
          current_game.players[2] = {};
        } else if (this_player.id == current_game.players[2].id) {
          current_game.players[2] = {};
        }

        if (current_game.started) {
          battleship.to(current_game.players[1].id).emit('reset game');
        }
        current_game.started = false;

        battleship.emit('player status', false);

        for (var i = 0; i < players.length; i++) {
          if (players[i].id == this_player.id) {
            console.log(`removed player with id ${players[i].id} from list`)
            players.splice(i,1);
            break;
          }
        }
        console.log(`player with id ${this_player.id} has left lobby. total players = ${players.length}`);
      });

      socket.on('map update', function(data){

        if (this_player.id == current_game.players[1].id) {
          current_game.players[1].hit_map = data;
          hit_detection(current_game.players[1], current_game.players[2]);
          socket.broadcast.emit('map update', current_game.players[1].hit_map);
          socket.emit('hit update', current_game.players[1].hit_map);
          battleship.to(current_game.players[1].id).emit('turn update', false);
          current_game.players[1].turn = false;
          battleship.to(current_game.players[2].id).emit('turn update', true);
          current_game.players[1].turn = true;
        } else if (this_player.id == current_game.players[2].id) {
          current_game.players[2].hit_map = data;
          hit_detection(current_game.players[2], current_game.players[1]);
          socket.broadcast.emit('map update', current_game.players[2].hit_map);
          socket.emit('hit update', current_game.players[2].hit_map);
          battleship.to(current_game.players[2].id).emit('turn update', false);
          current_game.players[1].turn = false;
          battleship.to(current_game.players[1].id).emit('turn update', true);
          current_game.players[1].turn = true;
        }

      });

      socket.on('player status', function(data){
        socket.broadcast.emit('player status', data[0]);
        if (this_player.id == current_game.players[1].id) {
          current_game.players[1].ship_map = data[1];
          current_game.players[1].ready = data[0];
          current_game.players[1].ships = data[2];
        } else if (this_player.id == current_game.players[2].id) {
          current_game.players[2].ship_map = data[1];
          current_game.players[2].ready = data[0];
          current_game.players[2].ships = data[2];
        }
        console.log(`status update ${current_game.players[1].ready} ${current_game.players[2].ready}`);
        if (current_game.players[1].ready && current_game.players[2].ready && current_game.started == false) {
          current_game.players[1].turn = true;
          battleship.to(current_game.players[1].id).emit('turn update', current_game.players[1].turn);
          current_game.started = true;
          battleship.emit('game status', current_game.started);
          console.log(`game started`);
        }
      });

  });
}

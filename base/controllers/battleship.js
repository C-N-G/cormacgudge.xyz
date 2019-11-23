exports.render = function(req, res) {
  res.render('battleship', {
    meta_title: 'Battleship',
    meta_desc: 'Battleship game',
    meta_js: '/javascripts/battleship.js',
    meta_css: '/stylesheets/battleship.css'
  });
};
exports.index = function(io) {
  var players = 0;
  var player1 = {};
  var player2 = {};
  var battleship = io
    .of('/battleship')
    .on('connection', function(socket){
      console.log('USER HAS CONNECTED TO BATTLESHIP');

      function hit_detection() {
        // TODO: change how maps work so that they're completely processed by the server
      }

      socket.on('join request', function(){
        if (players >= 2) {
          socket.emit('game full');
        } else {
          socket.emit('join request granted');
          if (players == 1) {
            player2.id = socket.id;
          } else {
            player1.id = socket.id;
          }
          players++;
          console.log(`player with id ${socket.id} has joined. total players = ${players}`);
        }
      });

      socket.on('player spectating', function(){
        console.log('player is spectating');
      });

      socket.on('disconnect', function(){
        players--;
        if (players < 0) {
          players = 0;
        }
        if (player1.id == socket.id) {
          player1 = {};
        } else if (player2.id == socket.id) {
          player2 = {};
        }
        console.log(`player with id ${socket.id} has left. total players = ${players}`);
      });

      socket.on('map update', function(data){

        if (player1.id == socket.id) {
          player1.hit_map = data;
        } else if (player2.id == socket.id) {
          player2.hit_map = data;
        }

        socket.broadcast.emit('map update', data);
      });

      socket.on('player status', function(data){
        if (player1.id == socket.id) {
          player1.ship_map = data[1];
          player1.ready = data[0];
        } else if (player2.id == socket.id) {
          player2.ship_map = data[1];
          player2.ready = data[0];
        }
        socket.broadcast.emit('player status', data[0]);
      });

      socket.on('start game request', function(){
        if (player1.ready && player2.ready) {
          battleship.emit('game started');
          console.log('game started');
        } else {
          console.log('game not started');
        }

      });

  });
}

exports.render = function(req, res) {
    res.render('chatroom', {
        meta_title: 'Chatroom',
        meta_desc: 'Socket.io test chat site',
        meta_js: '/javascripts/chatroom.js',
        meta_css: '/stylesheets/chatroom.css'
    });
};
exports.index = function(io) {
    var clients = [];
    var disconnected_id = 0;
    var chat = io
        .of('/chatroom')
        .on('connection', function(socket){
            var nickname = '';
            var nickname_id = 0;
            var admin = false;
            function force_disconnect_client(id) {
                chat.connected[id].disconnect(true);
            }
            function admin_check(name) {
                if (name == 'cormac password'){
                    admin = true;
                    name = 'cormac';
                }
                return name;
            }
            function update_client_list() {
                // SERVER SENDS CLIENT LIST UPDATE MESSAGE TO ALL CLIENTS
                chat.emit('client list update', JSON.stringify(clients));
                console.log('Client list: ' + clients);
            }
            console.log('USER HAS CONNECTED TO CHAT');
            update_client_list();

            // SERVER RECEIVES DISCONNECT MESSAGE FROM CLIENT
            socket.on('disconnect', function(){
                if (nickname) {
                    // SERVER SENDS DISCONNECT MESSAGE TO ALL CLIENTS
                    chat.emit('user disconnect', nickname);
                    console.log('user disconnect. ID=' + nickname_id );

                    clients.splice(nickname_id, 1);
                    disconnected_id = nickname_id;

                    update_client_list();
                }
            });

            // SERVER RECEIVES ID UPDATE REQUEST FROM CLIENT
            socket.on('client id update', function(){
                if (nickname_id > disconnected_id){
                    nickname_id--;
                    socket.custom_nickname_id = nickname_id;
                }
            });

            // SERVER RECEIVES CHAT MESSAGE FROM CLIENT
            socket.on('chat message', function(msg){
                // IF CLIENT CHARACTER LIMIT IS CIRCUMVENTED
                if (msg.length > 2000){
                    msg = msg.slice(0,2000);
                }

                // ADDING ANCHORS TO LINKS
                var pattern = /((https?:\/\/|www)[^\s]+)/ig;
                if (pattern.test(msg)) {
                    var matches = msg.match(pattern);
                    for (var i = 0; i < matches.length; i++){
                        if (matches[i].indexOf('www') == 0){ // IF LINK STARTS WITH WWW IT WILL SEARCH CURRENT DOMAIN
                            msg = msg.replace(matches[i], '<a href="http://' + matches[i] + '" target="_blank">' + matches[i] + '</a>')
                        } else {
                            msg = msg.replace(matches[i], '<a href="' + matches[i] + '" target="_blank">' + matches[i] + '</a>')
                        }
                    }
                }

                // IF USER IS ADMIN THEN RUN COMMAND
                if (msg[0] == '/' && admin == true){
                    // KICK COMMAND
                    if (msg.indexOf('kick') == 1){
                        var target = msg.slice(6,msg.length + 1);
                        var target_index = null;
                        var list = Object.keys(chat.connected);

                        // ITERATE THROUGH CLIENT ARRAY FOR MATCHES
                        for (var i = 0; i < clients.length; i++){
                            if (target == clients[i]){
                                target_index = i;
                            }
                        }

                        // ITERATE THROUGH CONNECTED CLIENTS FOR MATCH FROM ABOVE ARRAY
                        if (target_index != null){
                            list.forEach(function(id){
                                if (target_index == chat.connected[id].custom_nickname_id){
                                    chat.emit('chat message', nickname + ': ' + msg);
                                    msg = false;
                                    chat.to(id).emit('chat message', 'SERVER: you have been kicked');
                                    setTimeout(force_disconnect_client, 1000, id);
                                }
                            });
                        } else {
                            socket.emit('chat message', 'user not found');
                        }
                    }
                }

                // SERVER SENDS CHAT MESSAGE TO ALL CLIENTS
                if (msg){
                    chat.emit('chat message', nickname + ': ' + msg);
                }
                console.log('message from ' + nickname);
            });

            // SERVER RECEIVES NICKNAME CHANGE MESSAGE FROM CLIENT
            socket.on('nickname', function(nick){

                if (nick.length > 60){
                    nick = nick.slice(0,60);
                }
                nickname = admin_check(nick);
                clients.push(nickname);
                nickname_id = clients.length - 1;
                socket.custom_nickname_id = nickname_id;

                // SERVER SENDS NICKNAME CHANGE MESSAGE TO ALL CLIENTS
                chat.emit('user connect', nickname);
                console.log(nickname + ' connected' + '  ADMIN=' + admin);

                update_client_list();
            });

            // SERVER RECEIVES USER IS TYPING MESSAGE FROM CLIENT
            socket.on('user is typing', function(){
                // SERVER SENDS USER IS TYPING MESSAGE TO ALL CLIENTS
                chat.emit('user is typing', JSON.stringify({nickname, nickname_id}));
            });

            // SERVER RECEIVES USER IS NOT TYPING MESSAGE FROM CLIENT
            socket.on('user is not typing', function(){
                // SERVER SENDS USER IS NOT TYPING MESSAGE TO ALL CLIENTS
                chat.emit('user is not typing', JSON.stringify({nickname, nickname_id}));
            });
        });
}

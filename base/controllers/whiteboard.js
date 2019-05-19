exports.render = function(req, res) {
    res.render('whiteboard', {
        meta_title: 'Whiteboard',
        meta_desc: 'Canvas drawing tool',
        meta_js: '/javascripts/whiteboard.js',
        meta_css: '/stylesheets/whiteboard.css'
    });
};
exports.index = function(io) {
    //var whiteboard_clients = {};
    var whiteboard = io
        .of('/whiteboard')
        .on('connection', function(socket){

            console.log('CONNECTED TO WHITEBOARD');
            //socket.broadcast.emit('add user', socket.id);
            //whiteboard_clients[socket.id] = socket.id;
            //console.log('add user ' + socket.id)
            //console.log('all users: ' + whiteboard_clients);

            socket.on('draw', function(data){

                //data.clients = whiteboard_clients;
                socket.broadcast.emit('draw', data);
                if (data.click == true && data.draw == false) {
                    console.log('someone is drawing');
                }
            });
            socket.on('disconnect', function(){
                socket.broadcast.emit('remove user', socket.id);
                //delete whiteboard_clients[socket.id];
                console.log('remove user ' + socket.id);
                //console.log('all users: ' + whiteboard_clients);
            });
        });

}

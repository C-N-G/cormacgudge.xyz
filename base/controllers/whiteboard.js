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
            socket.on('draw', function(data){

                if (data.size > 10) {
                    data.size = 10
                } else if (data.size < 1) {
                    data.size = 1
                }

                if (data.client_name.length > 40) {
                    data.client_name = data.client_name.slice(0,40);
                }

                socket.broadcast.emit('draw', data);
                if (data.click == true && data.draw == false) {
                    console.log('someone is drawing');
                }

            });
            socket.on('disconnect', function(){
                socket.broadcast.emit('remove user', socket.id);
                console.log('remove user ' + socket.id);
            });
        });

}

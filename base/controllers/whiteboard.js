exports.render = function(req, res) {
    res.render('whiteboard', {
        meta_title: 'Whiteboard',
        meta_desc: 'Canvas drawing tool',
        meta_js: '/javascripts/whiteboard.js',
        meta_css: '/stylesheets/whiteboard.css'
    });
};
exports.index = function(io) {
    var whiteboard = io
        .of('/whiteboard')
        .on('connection', function(socket){
            console.log('CONNECTED TO WHITEBOARD');
            socket.on('draw', function(data){
                socket.broadcast.emit('draw', data);
                if (data.click == true && data.draw == false) {
                    console.log('someone is drawing');
                }
            });
        });

}

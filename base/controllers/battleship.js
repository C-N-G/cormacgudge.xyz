exports.render = function(req, res) {
    res.render('battleship', {
        meta_title: 'Battleship',
        meta_desc: 'Battleship game',
        meta_js: '/javascripts/battleship.js',
        meta_css: '/stylesheets/battleship.css'
    });
};
exports.index = function(io) {
    var battleship = io
        .of('/battleship')
        .on('connection', function(socket){
            console.log('USER HAS CONNECTED TO BATTLESHIP');
        });
}

exports.render = function(req, res) {
    res.render('icarus', {
        meta_title: 'Icarus',
        meta_desc: 'Game',
        meta_js: '/javascripts/icarus.js',
        meta_css: '/stylesheets/icarus.css'
    });
};
exports.index = function(io) {
    var reflex = io
        .of('/icarus')
        .on('connection', function(socket){
            console.log('USER HAS CONNECTED TO ICARUS');
        });
}

exports.render = function(req, res) {
    res.render('joker_input', {
        meta_title: 'Joker',
        meta_desc: 'Decision making tool',
        meta_js: '/javascripts/joker.js',
        meta_css: '/stylesheets/joker.css'
    });
};
exports.index = function(io) {
    var joker = io
        .of('/joker')
        .on('connection', function(socket){
            console.log('USER HAS CONNECTED TO JOKER');
        });
}

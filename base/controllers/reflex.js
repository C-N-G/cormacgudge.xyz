exports.render = function(req, res) {
    res.render('reflex', {
        meta_title: 'Reflex',
        meta_desc: 'pixi.js game test',
        meta_js: '/javascripts/reflex.js',
        meta_css: '/stylesheets/reflex.css'
    });
};
exports.index = function(io) {
    var reflex = io
        .of('/reflex')
        .on('connection', function(socket){
            console.log('USER HAS CONNECTED TO REFLEX');
        });
}

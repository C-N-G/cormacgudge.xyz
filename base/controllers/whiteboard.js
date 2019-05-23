exports.render = function(req, res) {
    res.render('whiteboard', {
        meta_title: 'Whiteboard',
        meta_desc: 'Canvas drawing tool',
        meta_js: '/javascripts/whiteboard.js',
        meta_css: '/stylesheets/whiteboard.css'
    });
};
exports.index = function(io) {
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(1500, 1500);
    const draw = canvas.getContext('2d');
    draw.lineCap = 'round';
    draw.lineJoin = "round";


    var line_last_pos = {};
    var line_was_last = {};
    var dot_was_last = {};
    var dot_last_pos = {};

    var inputs = {};
    function store_inputs(x, y, size, color, is_drawing, id) {
        if (inputs[id] == undefined) {
            inputs[id] = {};
            inputs[id]['events'] = [];
            inputs[id]['client_color'] = color;
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        } else {
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        }
    }

    setInterval(draw_event, 1000);
    function draw_event() {
        for (var user in inputs) {
            if (inputs[user]['events'].length > 0) {
                for (var i = 0; i < inputs[user]['events'].length; i++) {
                    if (inputs[user]['events'][i].is_drawing == false && (line_was_last[user] == false || line_was_last[user] == undefined)) {
                        dot_draw(
                            inputs[user]['events'][i].x,
                            inputs[user]['events'][i].y,
                            inputs[user]['events'][i].size,
                            inputs[user]['events'][i].color
                        );
                        dot_was_last[user] = true;
                        dot_last_pos[user] = inputs[user]['events'][i];
                    } else if (inputs[user]['events'][i].is_drawing == true || inputs[user]['events'][i].is_drawing == false && line_was_last[user] == true) {
                        var pos_x = 0;
                        var pos_y = 0;
                        if (dot_was_last[user] == true) {
                            pos_x = dot_last_pos[user].x;
                            pos_y = dot_last_pos[user].y;
                            dot_was_last[user] = false;
                        } else if (dot_was_last[user] == false && inputs[user]['events'][i-1] != undefined) {
                            pos_x = inputs[user]['events'][i-1].x;
                            pos_y = inputs[user]['events'][i-1].y;
                        } else if (dot_was_last[user] == false && inputs[user]['events'][i-1] == undefined) {
                            pos_x = line_last_pos[user].x;
                            pos_y = line_last_pos[user].y;
                        }
                        line_draw(
                            pos_x,
                            pos_y,
                            inputs[user]['events'][i].x,
                            inputs[user]['events'][i].y,
                            inputs[user]['events'][i].size,
                            inputs[user]['events'][i].color
                        );
                        if (inputs[user]['events'][i].is_drawing == false) {
                            line_was_last[user] = false;
                        } else {
                            line_was_last[user] = true;
                            line_last_pos[user] = inputs[user]['events'][i];
                        }
                    }
                }
                inputs[user]['events'] = [];
            }
        }
    }

    function line_draw(x ,y, x1, y1, size, color) {
        //console.log('draw line');
        draw.strokeStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.moveTo(x, y);
        draw.lineTo(x1, y1);
        draw.stroke();
    }

    function dot_draw(x ,y , size, color) {
        console.log('draw dot ' + x + ' ' + y + ' ' + size + ' ' + color);
        draw.fillStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.arc(x, y, (size / 2), 0, 2 * Math.PI);
        draw.fill();
    }

    var whiteboard = io
        .of('/whiteboard')
        .on('connection', function(socket){
            var admin = false;
            console.log('CONNECTED TO WHITEBOARD');

            const fs = require('fs');
            const out = fs.createWriteStream('./public/images/state.png')
            const stream = canvas.createPNGStream()
            stream.pipe(out)
            out.on('finish', function (){
                console.log('The PNG file was created.');
                socket.emit('setup', '/images/state.png');
            })

            socket.on('draw', function(data){

                if (data.size > 10 && admin == false) {
                    data.size = 10
                } else if (data.size < 1) {
                    data.size = 1
                }

                if (data.client_name.length > 40) {
                    data.client_name = data.client_name.slice(0,40);
                }

                if (data.client_name == 'Cormac password') {
                    admin = true;
                    data.client_name = 'Cormac';
                }

                store_inputs(data.cord_x, data.cord_y, data.size, data.color, data.is_drawing, data.id);
                socket.broadcast.emit('draw', data);

            });

            socket.on('clear', function(){
                if (admin == true) {
                    draw.clearRect(0, 0, 1500, 1500);
                    whiteboard.emit('clear');
                } else {
                    socket.emit('alert', 'PERMISSION DENIED');
                }

            });

            socket.on('disconnect', function(){
                socket.broadcast.emit('remove user', socket.id);
                console.log('remove user ' + socket.id);
            });
        });

}

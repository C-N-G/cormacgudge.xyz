exports.render = function(req, res) {
    res.render('whiteboard', {
        meta_title: 'Whiteboard',
        meta_desc: 'Canvas drawing tool',
        meta_js: '/javascripts/whiteboard.js',
        meta_css: '/stylesheets/whiteboard.css'
    });
};
exports.index = function(io) {

    const fs = require('fs');
    const path = require('path');
    const { createCanvas, loadImage } = require('canvas');
    
    const canvas = createCanvas(1500, 1500);
    const draw = canvas.getContext('2d');
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var clients = {};

    var line_last_pos = {};
    var line_was_last = {};
    var dot_was_last = {};
    var dot_last_pos = {};

    var inputs = {};

    function store_inputs(x, y, size, color, is_drawing, id, tool) {
        if (inputs[id] == undefined) {
            inputs[id] = {};
            line_was_last[id] = false;
            dot_was_last[id] = false;
            inputs[id]['events'] = [];
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing, 'tool': tool});
        } else {
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing, 'tool': tool});
        }
    }

    setInterval(draw_event, 1000);
    // Main draw function
    function draw_event() {
        for (var user in inputs) {
            if (inputs[user]['events'].length > 0) {
                for (var i = 0; i < inputs[user]['events'].length; i++) {
                    switch (inputs[user]['events'][i].tool) {
                        case 'draw': // Draw tool
                            if (dot_was_last[user] == undefined) {
                                inputs[user]['events'][i].is_drawing = false;
                            }
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
                            break;
                        case 'rectangle': // Rectangle tool
                            if (line_was_last[user] == false) {
                                line_was_last[user] = true;
                                line_last_pos[user] = inputs[user]['events'][i];
                            } else if (line_was_last[user] == true && inputs[user]['events'][i].is_drawing == false) {
                                line_was_last[user] = false;
                                rectangle_draw(
                                    line_last_pos[user].x,
                                    line_last_pos[user].y,
                                    inputs[user]['events'][i].x,
                                    inputs[user]['events'][i].y,
                                    inputs[user]['events'][i].color
                                );
                            }
                            break;
                        case 'eraser': // Eraser tool
                            eraser_draw(
                                inputs[user]['events'][i].x,
                                inputs[user]['events'][i].y
                            );
                            break;
                    }
                }
                inputs[user]['events'] = [];
            }
        }
    }


    // Drawing inputs
    function line_draw(x ,y, x1, y1, size, color) {
        draw.strokeStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.moveTo(x, y);
        draw.lineTo(x1, y1);
        draw.stroke();
    }

    function dot_draw(x ,y , size, color) {
        draw.fillStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.arc(x, y, (size / 2), 0, 2 * Math.PI);
        draw.fill();
    }

    function rectangle_draw(x, y, x1, y1, color) {
        draw.fillStyle = color;
        draw.fillRect(x, y, x1 - x, y1 - y);
    }

    function eraser_draw(x, y) {
        draw.clearRect(x - 25, y - 25, 50, 50);
    }

    var whiteboard = io
        .of('/whiteboard')
        .on('connection', function(socket){
            console.log('CONNECTED TO WHITEBOARD');

            var admin = false;
            clients[socket.id] = {};
            clients[socket.id].name = 'User' + Math.floor((Math.random() * 99999999) + 1);
            clients[socket.id].color = '#000000';
            clients[socket.id].size = 4;
            clients[socket.id].tool = 'draw';
            socket.emit('option update', clients);
            whiteboard.emit('client update', clients);


            const imageState = path.join(__dirname, "..", "public", "images", "state.png");
            const out = fs.createWriteStream(imageState)
            const stream = canvas.createPNGStream()
            stream.pipe(out)
            out.on('finish', function (){
                console.log('The PNG file was created.');
                socket.emit('setup', '/images/state.png');
            });

            function sanitise_text(text) {
                text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return text;
            }

            socket.on('draw', function(data){

                if (data.size > 20 && admin == false) {
                    data.size = 20
                } else if (data.size < 1) {
                    data.size = 1
                }

                store_inputs(data.cord_x, data.cord_y, data.size, data.color, data.is_drawing, data.id, data.tool);
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

            socket.on('name update', function(msg){
                if (msg.length > 40){
                    socket.emit('alert', 'NAMES MAY ONLY BE 40 CHARACTERS LONG');
                } else if (msg == 'Cormac password') {
                    admin = true;
                    clients[socket.id].name = 'Cormac';
                    whiteboard.emit('client update', clients);
                } else {
                    clients[socket.id].name = sanitise_text(msg);
                    whiteboard.emit('client update', clients);
                }
            });

            socket.on('size update', function(msg){
                if (msg > 20 && admin == false) {
                    socket.emit('alert', 'PLEASE ENTER A VALUE BETWEEN 1 AND 20')
                } else {
                    clients[socket.id].size = msg;
                    socket.emit('option update', clients);
                }
            });

            socket.on('color update', function(msg){
                clients[socket.id].color = msg;
                socket.emit('option update', clients);
                whiteboard.emit('client update', clients);
            });

            socket.on('tool update', function(msg){
                clients[socket.id].tool = msg;
                socket.emit('option update', clients);
            });

            socket.on('disconnect', function(){
                delete clients[socket.id];
                whiteboard.emit('client update', clients);
            });
        });

}

$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 4;
    var draw_color = '#000000';

    var draw = $('#drawing_area')[0].getContext('2d');
    draw.strokeStyle = draw_color;
    draw.fillStyle = draw_color;
    draw.lineWidth = draw_size;
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var last_pos = {};

    var net_clients = {};
    var inputs = {};
    //inputs[0] = [];
    //inputs[1] = [];

    function update_net_clients(obj) {
        for (var variable in obj) {
            if (object.hasOwnProperty(variable)) {

            }
        }
    }

    function store_inputs(x, y, size, color, is_drawing) {
        if (inputs['local'] == undefined) {
            inputs['local'] = []
            inputs['local'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        } else {
            inputs['local'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        }
    }

    function net_store_inputs(x, y, size, color, is_drawing, id) {
        if (inputs[id] == undefined) {
            inputs[id] = []
            inputs[id].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        } else {
            inputs[id].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
        }
    }

    setInterval(draw_event, 20);

    // IF LAST DRAW HAD IS DRAWING == TRUE THEN GO FROM LAST POSITION
    function draw_event() {
        for (var user in inputs) {
            if (inputs[user].length > 0) {
                if (inputs[user].length > 1) {
                    for (var i = 0; i < (inputs[user].length - 1); i++) {
                        if (inputs[user][i].is_drawing == true) {
                            line_draw(
                                inputs[user][i].x,
                                inputs[user][i].y,
                                inputs[user][i+1].x,
                                inputs[user][i+1].y,
                                inputs[user][i].size,
                                inputs[user][i].color
                            );
                        }
                    }
                    if (inputs[user][inputs[user].length - 1].is_drawing == true) {
                        last_pos = inputs[user][inputs[user].length - 1];
                        inputs[user] = [];
                        inputs[user].push(last_pos);
                    } else if (inputs[user][inputs[user].length - 1].is_drawing == false) {
                        inputs[user] = [];
                    }
                } else if (inputs[user].length == 1 && inputs[user][0].is_drawing == true) {
                    dot_draw(inputs[user][0].x, inputs[user][0].y, inputs[user][0].size, inputs[user][0].color);
                    inputs[user] = [];
                }
            }
        }
    }

    function line_draw(x ,y, x1, y1, size, color) {
        draw.strokeStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.moveTo(x+0.5, y+0.5);
        draw.lineTo(x1+0.5, y1+0.5);
        draw.stroke();
    }

    function dot_draw(x ,y , size, color) {
        draw.fillStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.arc(x+0.5, y+0.5, (size / 2), 0, 2 * Math.PI);
        draw.fill();
    }

    function mouse_draw() {
        store_inputs(mouse_x, mouse_y, draw_size, draw_color, mouse_drawing)
        socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'size': 4, 'color': '#FF0000', 'is_drawing': mouse_drawing, 'id': socket.id});
    }

    $('#drawing_area').on('mousemove', function(event){
        offset = $('#drawing_area').offset();
        mouse_x = (event.pageX - offset.left);
        mouse_y = (event.pageY - offset.top);
        $('.testing').text('X = '+ mouse_x + ', Y = ' + mouse_y);
        if (mouse_click == true) {
            mouse_draw();
        }
    }).on('mousedown', function(){
        mouse_click = true;
        mouse_drawing = true;
        mouse_draw();
    }).on('mouseup', function(){
        mouse_click = false;
        mouse_drawing = false;
        mouse_draw();
    }).on('mouseleave', function(){
        if (mouse_click == true) {
            mouse_drawing = false;
            mouse_draw();
        }
        mouse_click = false;
        mouse_drawing = false;
    });

    socket.on('draw', function(data){
        update_net_clients(data.clients);
        net_store_inputs(data.cord_x, data.cord_y, data.size, data.color, data.is_drawing, data.id);
    });
    socket.on('remove user', function(msg){
        delete inputs[msg];
    });
});

$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 6;
    var draw_color = '#000000';

    var draw = $('#drawing_area')[0].getContext('2d');
    draw.strokeStyle = draw_color;
    draw.lineWidth = draw_size;
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var last_pos = {};
    //var last_net_pos = {'x' : 0, 'y' : 0,};

    var inputs = [];
    inputs[0] = [];
    inputs[1] = [];
    // var net_inputs = [];

    //setInterval(start_draw_loop, 20);
    //setTimeout(setInterval(start_net_draw_loop, 20), 10);


    function store_inputs(x, y, size, color, is_drawing) {
        inputs[0].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
    }

    function net_store_inputs(x, y, size, color, is_drawing) {
        //net_inputs.push({'x': x, 'y': y, 'clicked': clicked, 'drawing': drawing});
        inputs[1].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing});
    }
    //
    // function start_draw_loop() {
    //     draw.strokeStyle = '#000000';
    //     if (inputs.length > 0) {
    //         for (var i = 0; i < inputs.length; i++) {
    //             mouse_draw_real(inputs[i].x, inputs[i].y, inputs[i].clicked, inputs[i].drawing);
    //         }
    //         inputs = [];
    //     }
    // }
    //
    // function start_net_draw_loop() {
    //     draw.strokeStyle = '#FF0000';
    //     if (net_inputs.length > 0) {
    //         for (var i = 0; i < net_inputs.length; i++) {
    //             mouse_draw_real(net_inputs[i].x, net_inputs[i].y, net_inputs[i].clicked, net_inputs[i].drawing);
    //         }
    //         net_inputs = [];
    //     }
    // }

    // for (var i = 0; i < inputs.length; i++) {
    //     for (var ii = 0; i < inputs[i].length; i++) {
    //         line_draw(inputs[i][ii].x, inputs[i][ii].y, inputs[i][ii+1].x, inputs[i][ii+1].y, 6,'#000000')
    //     }
    //
    // }







    // function mouse_draw_real(x, y, clicked, drawing) {
    //     if (clicked && !drawing) {
    //
    //         draw.beginPath();
    //         draw.arc(x, y, (draw_size / 2), 0, 2 * Math.PI);
    //         draw.fill();
    //
    //         draw.beginPath();
    //         draw.lineTo(x, y);
    //
    //     } else if (clicked && drawing) {
    //
    //         draw.lineTo(x, y);
    //         draw.stroke();
    //
    //     } else if (!clicked) {
    //
    //     }
    // }

    // function mouse_draw() {
    //     if (mouse_click) {
    //         store_inputs(mouse_x, mouse_y)
    //     }
    //
    //
    //     // if (mouse_click && !mouse_drawing) {
    //     //     store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
    //     //     mouse_drawing = true;
    //     //     socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': false});
    //     // } else if (mouse_click && mouse_drawing) {
    //     //     socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': true});
    //     //     store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
    //     // } else if (!mouse_click) {
    //     //     if (mouse_drawing){
    //     //         socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': false, 'draw': false});
    //     //         store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
    //     //     }
    //     //     mouse_drawing = false;
    //     // }
    // }

    // function net_mouse_draw_real(net_mouse_x, net_mouse_y, net_click, net_draw) {
    //     if (net_click && !net_draw) {
    //
    //         draw.beginPath();
    //         draw.arc(net_mouse_x, net_mouse_y, (draw_size / 2), 0, 2 * Math.PI);
    //         draw.fill();
    //
    //         draw.beginPath();
    //         draw.lineTo(net_mouse_x, net_mouse_y);
    //
    //     } else if (net_click && net_draw) {
    //
    //         draw.lineTo(net_mouse_x, net_mouse_y);
    //         draw.stroke();
    //
    //     } else if (!net_click) {
    //
    //     }
    // }

    // function mouse_draw(x, y, clicked, drawing) {
    //     if (mouse_click && !mouse_drawing) {
    //
    //         draw.beginPath();
    //         draw.arc(mouse_x, mouse_y, (draw_size / 2), 0, 2 * Math.PI);
    //         draw.fill();
    //
    //         draw.beginPath();
    //         draw.lineTo(mouse_x, mouse_y);
    //
    //         mouse_drawing = true;
    //         socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': false});
    //     } else if (mouse_click && mouse_drawing) {
    //         draw.lineTo(mouse_x, mouse_y);
    //         draw.stroke();
    //         socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': true});
    //     } else if (!mouse_click) {
    //         if (mouse_drawing){
    //             socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': false, 'draw': false});
    //         }
    //         mouse_drawing = false;
    //     }
    // }
    /*
        TODO:
        add heart beat so that every 20ms it switches between
        rendering from client and server

        or add a new draw.getcontext('2d') object for each net
        user drawing on my machine
    */

    setInterval(draw_event, 20);

    // IF LAST DRAW HAD IS DRAWING == TRUE THEN GO FROM LAST POSITION
    function draw_event() {
        for (var user = 0; user < inputs.length; user++) {
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
                }  else if (inputs[user].length == 1 && inputs[user][0].is_drawing == true) {
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
        draw.moveTo(x, y);
        draw.lineTo(x1, y1);
        draw.stroke();
    }

    function dot_draw(x ,y , size, color) {
        draw.strokeStyle = color;
        draw.lineWidth = size;

        draw.beginPath();
        draw.arc(x, y, (size / 2), 0, 2 * Math.PI);
        draw.fill();
    }

    function mouse_draw() {
        store_inputs(mouse_x, mouse_y, draw_size, draw_color, mouse_drawing)
        socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'size': 6, 'color': '#FF0000', 'is_drawing': mouse_drawing});
    }

    $('#drawing_area').on('mousedown', function(){
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
    }).on('mousemove', function(event){
        offset = $('#drawing_area').offset();
        mouse_x = (event.pageX - offset.left);
        mouse_y = (event.pageY - offset.top);
        $('.testing').text('X = '+ mouse_x + ', Y = ' + mouse_y);
        if (mouse_click == true) {
            mouse_draw();
        }
    });

    socket.on('draw', function(data){
        net_store_inputs(data.cord_x, data.cord_y, data.size, data.color, data.is_drawing);
    })
});

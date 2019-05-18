$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 6;

    var draw = $('#drawing_area')[0].getContext('2d');
    //draw.strokeStyle = '#000000';
    draw.lineWidth = draw_size;
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var last_pos = {'x' : 0, 'y' : 0,};
    var last_net_pos = {'x' : 0, 'y' : 0,};

    var inputs = [];
    var net_inputs = [];

    setInterval(start_draw_loop, 20);
    setTimeout(setInterval(start_net_draw_loop, 20), 10);


    function store_inputs(x, y, clicked, drawing) {
        inputs.push({'x': x, 'y': y, 'clicked': clicked, 'drawing': drawing});
    }

    function net_store_inputs(x, y, clicked, drawing) {
        net_inputs.push({'x': x, 'y': y, 'clicked': clicked, 'drawing': drawing});
    }
    //
    function start_draw_loop() {
        draw.strokeStyle = '#000000';
        if (inputs.length > 0) {
            for (var i = 0; i < inputs.length; i++) {
                mouse_draw_real(inputs[i].x, inputs[i].y, inputs[i].clicked, inputs[i].drawing);
            }
            inputs = [];
        }
    }

    function start_net_draw_loop() {
        draw.strokeStyle = '#FF0000';
        if (net_inputs.length > 0) {
            for (var i = 0; i < net_inputs.length; i++) {
                mouse_draw_real(net_inputs[i].x, net_inputs[i].y, net_inputs[i].clicked, net_inputs[i].drawing);
            }
            net_inputs = [];
        }
    }

    function mouse_draw_real(x, y, clicked, drawing) {
        if (clicked && !drawing) {

            draw.beginPath();
            draw.arc(x, y, (draw_size / 2), 0, 2 * Math.PI);
            draw.fill();

            draw.beginPath();
            draw.lineTo(x, y);

        } else if (clicked && drawing) {

            draw.lineTo(x, y);
            draw.stroke();

        } else if (!clicked) {

        }
    }

    function mouse_draw() {
        if (mouse_click && !mouse_drawing) {
            store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
            mouse_drawing = true;
            socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': false});
        } else if (mouse_click && mouse_drawing) {
            socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': true});
            store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
        } else if (!mouse_click) {
            if (mouse_drawing){
                socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': false, 'draw': false});
                store_inputs(mouse_x, mouse_y, mouse_click, mouse_drawing);
            }
            mouse_drawing = false;
        }
    }

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
    $('#drawing_area').on('mousedown', function(){
        mouse_click = true;
        mouse_draw();
        //store_inputs(mouse_x, mouse_y, mouse_clicked, mouse_drawing);
    }).on('mousemove', function(event){
        offset = $('#drawing_area').offset();
        mouse_x = (event.pageX - offset.left);
        mouse_y = (event.pageY - offset.top);
        $('.testing').text('X = '+ mouse_x + ', Y = ' + mouse_y);
        mouse_draw();
        //store_inputs(mouse_x, mouse_y, mouse_clicked, mouse_drawing);
    }).on('mouseup', function(){
        mouse_click = false;
    }).on('mouseleave', function(){
        mouse_click = false;
        mouse_draw();
        //store_inputs(mouse_x, mouse_y, mouse_clicked, mouse_drawing);
    });

    socket.on('draw', function(data){
        if (data.start == true) {
            console.log('someone is drawing');
            console.log(data);
        }
        net_store_inputs(data.cord_x, data.cord_y, data.click, data.draw);
    })
});

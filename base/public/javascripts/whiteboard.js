$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 6;

    var draw = $('#drawing_area')[0].getContext('2d');
    draw.strokeStyle = '#000000';
    draw.lineWidth = draw_size;
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    function mouse_draw() {
        if (mouse_click && !mouse_drawing) {

            draw.beginPath();
            draw.arc(mouse_x, mouse_y, (draw_size / 2), 0, 2 * Math.PI);
            draw.fill();

            draw.beginPath();
            draw.lineTo(mouse_x, mouse_y);

            mouse_drawing = true;
            socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': false});
        } else if (mouse_click && mouse_drawing) {
            draw.lineTo(mouse_x, mouse_y);
            draw.stroke();
            socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': true, 'draw': true});
        } else if (!mouse_click) {
            if (mouse_drawing){
                socket.emit('draw', {'cord_x': mouse_x, 'cord_y': mouse_y, 'click': false, 'draw': false});
            }
            mouse_drawing = false;
        }
    }
    function net_mouse_draw(net_mouse_x, net_mouse_y, net_click, net_draw) {
        if (net_click && !net_draw) {

            draw.beginPath();
            draw.arc(net_mouse_x, net_mouse_y, (draw_size / 2), 0, 2 * Math.PI);
            draw.fill();

            draw.beginPath();
            draw.lineTo(net_mouse_x, net_mouse_y);
        } else if (net_click && net_draw) {
            draw.lineTo(net_mouse_x, net_mouse_y);
            draw.stroke();
        } else if (!net_click) {

        }
    }


    $('#drawing_area').on('mousedown', function(){
        mouse_click = true;
        mouse_draw();
    }).on('mousemove', function(event){
        offset = $('#drawing_area').offset();
        mouse_x = (event.pageX - offset.left);
        mouse_y = (event.pageY - offset.top);
        $('.testing').text('X = '+ mouse_x + ', Y = ' + mouse_y);
        mouse_draw();
    }).on('mouseup', function(){
        mouse_click = false;
    }).on('mouseleave', function(){
        mouse_click = false;
        mouse_draw();
    });

    socket.on('draw', function(data){
        if (data.start == true) {
            console.log('someone is drawing');
            console.log(data);
        }
        net_mouse_draw(data.cord_x, data.cord_y, data.click, data.draw)
    })
});

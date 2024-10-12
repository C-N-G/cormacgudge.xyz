$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 0;
    var draw_color = '#000000';
    var draw_tool = 'draw';
    /*
    App uses two canvases, one for drawing all the inputs on, and one for
    drawing any overlay information that isn't going to be networked on.
    */
    var draw = $('#drawing_area')[0].getContext('2d');
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var draw_overlay = $('#drawing_area_overlay')[0].getContext('2d');
    // $('#drawing_area_overlay').hide();
    draw_overlay.lineCap = 'round';
    draw_overlay.lineJoin = "round";
    draw_overlay.lineWidth = 3;

    // TODO: Move these into inputs var
    var line_last_pos = {};
    var line_was_last = {};
    var dot_was_last = {};
    var dot_last_pos = {};

    var inputs = {};
    // inputs['local'] = {};
    // inputs['local']['events'] = [];
    // inputs['local']['client_color'] = draw_color;

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

    // TODO: Write my own flavour of this function
    function invertColor(hex, bw) { // https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        var r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        if (bw) {
            // http://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return "#" + padZero(r) + padZero(g) + padZero(b);
    }

    // Main draw function
    function draw_event() {

        function draw_tool(event_num) {

            if (dot_last_pos[user] == undefined && line_last_pos[user] == undefined) {
              inputs[user]['events'][event_num].is_drawing = false;
            }
            if (inputs[user]['events'][event_num].is_drawing == false && (line_was_last[user] == false || line_was_last[user] == undefined)) {
                dot_draw(
                    inputs[user]['events'][event_num].x,
                    inputs[user]['events'][event_num].y,
                    inputs[user]['events'][event_num].size,
                    inputs[user]['events'][event_num].color
                );
                dot_was_last[user] = true;
                dot_last_pos[user] = inputs[user]['events'][event_num];

            } else if (inputs[user]['events'][event_num].is_drawing == true || inputs[user]['events'][event_num].is_drawing == false && line_was_last[user] == true) {
                var pos_x = 0;
                var pos_y = 0;
                if (dot_was_last[user] == true) {
                    pos_x = dot_last_pos[user].x;
                    pos_y = dot_last_pos[user].y;
                    dot_was_last[user] = false;
                } else if (dot_was_last[user] == false && inputs[user]['events'][event_num-1] != undefined) {
                    pos_x = inputs[user]['events'][event_num-1].x;
                    pos_y = inputs[user]['events'][event_num-1].y;
                } else if (dot_was_last[user] == false && inputs[user]['events'][event_num-1] == undefined) {
                    pos_x = line_last_pos[user].x;
                    pos_y = line_last_pos[user].y;
                }
                line_draw(
                    pos_x,
                    pos_y,
                    inputs[user]['events'][event_num].x,
                    inputs[user]['events'][event_num].y,
                    inputs[user]['events'][event_num].size,
                    inputs[user]['events'][event_num].color
                );
                if (inputs[user]['events'][event_num].is_drawing == false) {
                    line_was_last[user] = false;
                } else {
                    line_was_last[user] = true;
                    line_last_pos[user] = inputs[user]['events'][event_num];
                }
            }
        
        }

        function rectangle_tool(event_num) {
            if (line_was_last[user] == false) {
                line_was_last[user] = true;
                line_last_pos[user] = inputs[user]['events'][event_num];
            } else if (line_was_last[user] == true && inputs[user]['events'][event_num].is_drawing == false) {
                line_was_last[user] = false;
                rectangle_draw(
                    line_last_pos[user].x,
                    line_last_pos[user].y,
                    inputs[user]['events'][event_num].x,
                    inputs[user]['events'][event_num].y,
                    inputs[user]['events'][event_num].color
                );
                clear_overlay();
            }
            if (line_was_last[user] == true && user == 'local') {
                rectangle_overlay(
                    line_last_pos[user].x,
                    line_last_pos[user].y,
                    inputs[user]['events'][event_num].x,
                    inputs[user]['events'][event_num].y
                );
            }
        }

        function eraser_tool(event_num) {
            eraser_draw(
                inputs[user]['events'][event_num].x,
                inputs[user]['events'][event_num].y
              );
              if (user == 'local') {
                  eraser_overlay(
                      inputs[user]['events'][event_num].x,
                      inputs[user]['events'][event_num].y
                  );
              }
              if (inputs[user]['events'][event_num].is_drawing == false) {
                  clear_overlay();
              }
        }

        function process_user_inputs() {
            for (let event_num = 0; event_num < inputs[user]['events'].length; event_num++) {
                switch (inputs[user]['events'][event_num].tool) {
                    case 'draw': // Draw tool
                        draw_tool(event_num);
                        break;
                    case 'rectangle': // Rectangle tool
                        rectangle_tool(event_num);
                        break;
                    case 'eraser': // Eraser tool
                        eraser_tool(event_num)
                        break;
                }
            }

            inputs[user]['events'] = [];
        }

        for (var user in inputs) {
            if (inputs[user]['events'].length > 0) {
                process_user_inputs()
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


    // Drawing overlays
    function clear_overlay() {
        draw_overlay.clearRect(0, 0, $('#drawing_area_overlay').width(), $('#drawing_area_overlay').height());
    }

    function brush_overlay() {

    }

    function rectangle_overlay(x, y, x1, y1) {
        clear_overlay();
        draw_overlay.beginPath();
        draw_overlay.rect(x, y, x1 - x, y1 - y);
        draw_overlay.stroke();
    }

    function eraser_overlay(x, y) {
        clear_overlay();
        draw_overlay.beginPath();
        draw_overlay.rect(x - 25, y - 25, 50, 50);
        draw_overlay.stroke();
    }


    // Storing local event information on local and sending it to server
    function mouse_draw() {
        store_inputs(
            mouse_x,
            mouse_y,
            draw_size,
            draw_color,
            mouse_drawing,
            'local',
            draw_tool
        )
        socket.emit('draw', {
            'cord_x': mouse_x,
            'cord_y': mouse_y,
            'size': draw_size,
            'color': draw_color,
            'is_drawing': mouse_drawing,
            'id': socket.id,
            'tool': draw_tool
        });
    }

    function setup_board() {

        // Event listeners
        $('#drawing_area_overlay').on('mousemove', function(event){
          offset = $('#drawing_area').offset();
          mouse_x = (event.pageX - offset.left);
          mouse_y = (event.pageY - offset.top);
          $('.testing').text('X = '+ mouse_x + ', Y = ' + mouse_y);
          if (mouse_click == true) {
              mouse_draw();
          }
        }).on('mousedown', function(){
            mouse_click = true;
            mouse_draw();
            mouse_drawing = true;
        }).on('mouseup', function(){
            mouse_click = false;
            mouse_drawing = false;
            mouse_draw();
            clear_overlay();
        }).on('mouseleave', function(){
            if (mouse_click == true) {
                mouse_drawing = false;
                mouse_draw();
            }
            mouse_click = false;
            mouse_drawing = false;
        });

        $('#color_picker').on('change', function(){
            var color = $(this).val();
            socket.emit('color update', color);
        });

        $('#size_picker').on('change', function(){
            var size = $(this).val();
            socket.emit('size update', size);
        });

        $('#tool_picker').on('change', function(){
            var tool = $(this).val();
            socket.emit('tool update', tool);
        });

        $('#clear_screen').on('click', function(){
            socket.emit('clear');
        });

        $('#nickname').submit(function(e){
            e.preventDefault(); // prevents page reloading
            var name = $('#nickname_entry').val();
            socket.emit('name update', name)
            return false;
        });

        // start drawing updates
        setInterval(draw_event, 20);
    }

    // Socket updates
    socket.on('draw', function(data){
        store_inputs(
            data.cord_x,
            data.cord_y,
            data.size,
            data.color,
            data.is_drawing,
            data.id,
            data.tool
        );
    });

    socket.on('setup', function(src){
        var img_state = new Image();
        img_state.onload = function() {
            // I can't remember why I hid the drawing board on load and then showed it after the image was loaded
            // but there was some kind of bug to do with the board not being shown therefore inputs were not being accepted
            // so it is always shown for now
            // $('#drawing_area_overlay').show();
            draw.drawImage(img_state,0,0);
            setup_board();
        }
        img_state.src = src;
    });

    socket.on('clear', function(){
        draw.clearRect(0, 0, $('#drawing_area').width(), $('#drawing_area').height());
    });

    socket.on('alert', function(msg){
        alert(msg);
    })

    socket.on('client update', function(clients){
        $('#users').empty();
        for (var client in clients) {
            $('#users').append('<li style="background-color: '
            + clients[client].color
            + '; color: '
            + invertColor(clients[client].color , true)
            + '">'
            + clients[client].name
            + '</li>'
        );
        }
    })

    socket.on('option update', function(clients){
        line_last_pos['local'] = false;
        dot_was_last['local'] = false;
        draw_size = clients[socket.id].size;
        draw_color = clients[socket.id].color;
        switch (clients[socket.id].tool) {
            case 'draw':
                draw_tool = clients[socket.id].tool;
                $('#menu li:nth-of-type(2)').show();
                $('#menu li:nth-of-type(3)').show();
                break;
            case 'rectangle':
                draw_tool = clients[socket.id].tool;
                $('#menu li:nth-of-type(2)').show();
                $('#menu li:nth-of-type(3)').hide();
                break;
            case 'eraser':
                draw_tool = clients[socket.id].tool;
                $('#menu li:nth-of-type(2)').hide();
                $('#menu li:nth-of-type(3)').hide();
                break;

        }
    })
    // BUG: When loading the page, the first few draw messages seem to get dropped

    /*
    BUG: If mouse button is held down, and mouse leaves drawing
    area, and mouse is brought back into drawing area with mouse button still
    held down, then upon releasong the mouse button, a dot is drawn.
    No dot should be drawn there.
    */

    /*
    IDEA: Add support for rectangle dragging
    */

    /*
    IDEA: Add admin tools for erasing
    add energy bar that is used when using the eraser, so that
    one person can't just replace everything by spamming
    */

});

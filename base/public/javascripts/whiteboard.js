$( document ).ready(function(){
    var socket = io('/whiteboard');

    var offset = 0;
    var mouse_x = 0;
    var mouse_y = 0;
    var mouse_click = false;
    var mouse_drawing = false;
    var draw_size = 4;
    var draw_color = '#000000';
    var local_name = 'local';

    var draw = $('#drawing_area')[0].getContext('2d');
    $('#drawing_area').hide();
    draw.lineCap = 'round';
    draw.lineJoin = "round";

    var line_last_pos = {};
    var line_was_last = {};
    var dot_was_last = {};
    var dot_last_pos = {};

    var inputs = {};
    inputs['local'] = {};
    inputs['local']['events'] = [];
    inputs['local']['client_name'] = local_name;
    inputs['local']['client_color'] = draw_color;

    var nicknames = {};
    var nickname_colors = {};

    function store_inputs(x, y, size, color, is_drawing, id, client_name) {
        if (inputs[id] == undefined) {
            inputs[id] = {};
            inputs[id]['events'] = [];
            inputs[id]['client_name'] = client_name;
            nicknames[id] = client_name;
            inputs[id]['client_color'] = color;
            nickname_colors[id] = color;
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing, 'client_name': client_name});
            update_users();
        } else {
            inputs[id]['events'].push({'x': x, 'y': y, 'size': size, 'color': color, 'is_drawing': is_drawing, 'client_name': client_name});
            inputs[id]['client_name'] = client_name;
            inputs[id]['client_color'] = color;
            if (inputs[id].client_name != nicknames[id]) {
                nicknames[id] = client_name;
                update_users();
            }
            if (inputs[id].client_color != nickname_colors[id]) {
                nickname_colors[id] = color;
                update_users();
            }
        }
    }

    // TODO: Move text sanitiation to server
    function sanitise_text(text) {
        text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return text;
    }

    // TODO: Move user updating to server, and making it centralised to load on new connection
    function update_users() {
        $('#users').empty();
        var keys = Object.keys(inputs);
        for (var user in inputs) {
            $('#users').append('<li style="background-color: '
            + inputs[user].client_color
            + '; color: '
            + invertColor(inputs[user].client_color , true)
            + '">'
            + sanitise_text(inputs[user].client_name)
            + '</li>'
        );
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

    setInterval(draw_event, 20);

    // IF LAST DRAW HAD IS DRAWING == TRUE THEN GO FROM LAST POSITION
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

    function mouse_draw() {
        store_inputs(
            mouse_x,
            mouse_y,
            draw_size,
            draw_color,
            mouse_drawing,
            'local',
            local_name
        )
        socket.emit('draw', {
            'cord_x': mouse_x,
            'cord_y': mouse_y,
            'size': draw_size,
            'color': draw_color,
            'is_drawing': mouse_drawing,
            'id': socket.id,
            'client_name': local_name
        });
    }

    socket.on('draw', function(data){
        store_inputs(
            data.cord_x,
            data.cord_y,
            data.size,
            data.color,
            data.is_drawing,
            data.id,
            data.client_name
        );
    });

    socket.on('remove user', function(msg){
        delete inputs[msg];
        update_users();
    });

    socket.on('setup', function(src){
        var img_state = new Image();
        img_state.onload = function() {
            draw.drawImage(img_state,0,0)
            $('#drawing_area').show()
        }
        img_state.src = src;
    });

    socket.on('clear', function(){
        draw.clearRect(0, 0, $('#drawing_area').width(), $('#drawing_area').height());
    });

    socket.on('alert', function(msg){
        alert(msg);
    })
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
    DONE
    IDEA: Add canvas sync on connect
    */

    /*
    DONE
    IDEA: Make clear screen affect the whole server, and
    add a system for restricting it
    */

    /*
    IDEA: Add admin tools for erasing
    add energy bar that is used when using the eraser, so that
    one person can't just replace everything by spamming
    */

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
        mouse_draw();
        mouse_drawing = true;
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

    $('#color_picker').on('change', function(){
        draw_color = $(this).val();
        inputs['local'].client_color = draw_color;
        nickname_colors['local'] = draw_color;
        update_users();
    });

    $('#size_picker').on('change', function(){
        draw_size = $(this).val();
    });

    $('#clear_screen').on('click', function(){
        socket.emit('clear');
    });

    $('#nickname').submit(function(e){
        e.preventDefault(); // prevents page reloading
        if ($('#nickname_entry').val()) {
            local_name = $('#nickname_entry').val();
            inputs['local'].client_name = local_name;
            nicknames['local'] = local_name;
            update_users();
        }
        $('#nickname_entry').val('');
        return false;
    });
});

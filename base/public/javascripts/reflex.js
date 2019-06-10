$( document ).ready(function(){
    // Declare socket client
    var socket = io('/reflex');

    // Declare pixi api
    let app = new PIXI.Application({
        width: 256,
        height: 256,
        antialias: true,
        transparent: false,
        resolution: 1
    });

    // Create stage
    $('.content').append(app.view);

    // Change stage background color
    app.renderer.backgroundColor = 0x00F0F9;

    // Resize the stage
    app.renderer.autoDensity = true;
    app.renderer.resize(832,832);
    app.stage.sortableChildren = true;

    /*
    Resize stage to screen size
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoDensity = true;
    app.renderer.resize(window.innerWidth, window.innerHeight);
     */

    // Show browser webgl support
    let type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
        type = "canvas"
    }
    PIXI.utils.sayHello(type)

    // Loading sprites
    const
        loader = PIXI.Loader.shared,
        sprite = PIXI.Sprite,
        rectangle = PIXI.Rectangle,
        texture_cache = PIXI.utils.TextureCache,
        text = PIXI.Text;

    loader
        //.add('player', 'images/reflex.png')
        .add('images/reflex.json')
        .on('progress', (loader, resource) => {
            // function called when a spirte is loaded
            console.log('loaded ' + resource.name + ' at ' + resource.url + ' | current progress is ' + loader.progress + '%');
        })
        .load(setup);

    let state, player, foe, wall, gravity, stop_point, next_state, room, timer = 0, score, difficulty = 1;
    let projectiles = [];
    let foes = [];
    let room_data = [];

    let map = {};
    map.data = [
        []
    ];
    map.y_offset = 0;
    map.x_offset = 0;

    let rooms = [];

    let current_map = {};
    current_map.level_change_direction = '0000';
    current_map.x = 0;
    current_map.y = 0;

    let left = keyboard('ArrowLeft'),
        up = keyboard('ArrowUp'),
        right = keyboard('ArrowRight'),
        down = keyboard('ArrowDown'),
        esc = keyboard('Escape');
        left_alt = keyboard('a');
        up_alt = keyboard('w');
        right_alt = keyboard('d');
        down_alt = keyboard('s');

    let mouse = {};
    mouse.x = 0;
    mouse.y = 0;
    mouse.pressed = false;

    let settings = {};

    let play_screen_made = false,
        lose_screen_made = false;

    function setup() {
        console.log('setup')

        $(window).on('mousemove', function(event){
            mouse.x = event.pageX;
            mouse.y = event.pageY;
        })
        $(window).on('mousedown', function(event){
            mouse.pressed = true;
        })
        $(window).on('mouseup', function(event){
            mouse.pressed = false;
        })

        state = play_screen;

        app.ticker.add(delta => game_loop(delta));

    }

    function game_loop(delta){
        state(delta);
    }


    // GAME STATES

    function play_screen(delta){

        if (play_screen_made == false) {
            // create_text('Reflex', 450, 650, true);
            // create_text('Are you fast enough?', 450, 675, true);
            // create_text('Menu', 10, 720, false);
            set_settings();
            change_room('start');
            create_score();
            play_screen_made = true;
        }

        gravity = 0.95;
        stop_point = 0.1;
        next_state = 0;

        player_update();
        foe_update();
        projectile_update();
        wall_update();
        score_update();

        if (current_map.level_change_direction != '0000') {
            change_room(current_map.level_change_direction);
        }

        if (next_state != 0) {
            change_state(next_state);
        }

    }

    function lose_screen(delta) {
        if (lose_screen_made == false) {
            create_text('You Died', 384, 384, true);
            create_text('Your Score was ' + score.score_value, 384, 408, true);
            score = 0;
            create_text('Press Escape to retry', 384, 432, true);
            lose_screen_made = true;
        }

        next_state = 0;

        if (esc.isDown == true) {
            next_state = 1;
        }

        if (next_state != 0) {
            change_state(next_state);
        }

    }


    // PLAY UPDATES

    function wall_update() {
        for (var m = 0; m < room_data.length; m++) {

            for (var p = 0; p < projectiles.length; p++) {

                if (collision_check(projectiles[p], room_data[m])) {
                    projectiles[p].alive = false;
                }

            }

        }
    }

    function projectile_update() {

        // list of projectiles to remove at every update
        let projectiles_remove = [];

        for (var i = 0; i < projectiles.length; i++) {
            projectiles[i].x += Math.cos(projectiles[i].rotation - (Math.PI / 2)) * projectiles[i].speed;
            projectiles[i].y += Math.sin(projectiles[i].rotation - (Math.PI / 2)) * projectiles[i].speed;

            keep_in(projectiles[i], true);

            if (settings.projectile_collision) {
                for (var ii = 0; ii < projectiles.length; ii++) {
                    if (collision_check(projectiles[i], projectiles[ii]) && projectiles[i].team != projectiles[ii].team) {
                        projectiles[i].alive = false;
                        projectiles[ii].alive = false;
                    }
                }
            }


            if (projectiles[i].alive == false) {
                projectiles[i].visible = false;
                projectiles_remove.push(i);
            }
        }

        for (var i = (projectiles_remove.length - 1); i > -1; i--) {
            projectiles.splice(projectiles_remove[i], 1);
        }

    }

    function player_update() {

        if (left.isDown == true || left_alt.isDown == true) { player.vx -= player.acceleration_speed }
        if (right.isDown == true || right_alt.isDown == true) { player.vx += player.acceleration_speed }
        if (up.isDown == true || up_alt.isDown == true) { player.vy -= player.acceleration_speed }
        if (down.isDown == true || down_alt.isDown == true) { player.vy += player.acceleration_speed }

        player.vy *= gravity;
        player.vx *= gravity;

        if (player.vx < stop_point && player.vx > -stop_point) { player.vx = 0 };
        player.vx = (player.vx > player.top_speed) ? player.top_speed : player.vx;
        player.vx = (player.vx < -player.top_speed) ? -player.top_speed : player.vx;

        if (player.vy < stop_point && player.vy > -stop_point) { player.vy = 0 };
        player.vy = (player.vy > player.top_speed) ? player.top_speed: player.vy;
        player.vy = (player.vy < -player.top_speed) ? -player.top_speed : player.vy;

        player.rotation = Math.atan2(mouse.x - player.x, player.y - mouse.y);

        if (mouse.pressed && player.shoot && player.alive) {
            create_projectile(player);
            player.shoot = false;
        }

        if (!player.shoot) {
            player.projectile_cooldown--;
        }

        if (player.projectile_cooldown <= 0) {
            player.projectile_cooldown = player.projectile_cooldown_reset;
            player.shoot = true;
        }

        for (var i = 0; i < projectiles.length; i++) {
            if (collision_check(projectiles[i], player) && projectiles[i].team != player.team) {
                player.alive = false;
                projectiles[i].alive = false;
            }
        }

        if (player.alive) {

            player.x += player.vx;

            // check x-axis wall collision
            for (var i = 0; i < room_data.length; i++) {
                if (collision_check(player, room_data[i])) {
                    if (player.vx > 0) {
                        player.x = room_data[i].x - (player.hitbox_size / 2) - (room_data[i].hitbox_size / 2) - 1;
                    } else if (player.vx < 0) {
                        player.x = room_data[i].x + (player.hitbox_size / 2) + (room_data[i].hitbox_size / 2) + 1;
                    }
                    player.vx = 0;
                }
            }

            player.y += player.vy;

            // check y-axis wall collision
            for (var i = 0; i < room_data.length; i++) {
                if (collision_check(player, room_data[i])) {
                    if (player.vy > 0) {
                        player.y = room_data[i].y - (player.hitbox_size / 2) - (room_data[i].hitbox_size / 2) - 1;
                    } else if (player.vy < 0) {
                        player.y = room_data[i].y + (player.hitbox_size / 2) + (room_data[i].hitbox_size / 2) + 1;
                    }
                    player.vy = 0;
                }
            }

        } else if (player.alive == false) {
            player.visible = false;
            next_state = 2;
        }

        keep_in(player, false);
    }

    function foe_update() {

        // list of foes to remove at every update
        let foes_remove = [];
        let check_vision = false;
        timer++;
        if (timer == 30) {
            check_vision = true;
            timer = 0;
        }

        for (var i = 0; i < foes.length; i++) {

            if (check_vision) {
                // vision_check serious performance bottleneck
                foes[i].vision = vision_check(foes[i], player);
            }



            if (foes[i].vision) {

                foes[i].rotation = Math.atan2(player.x - foes[i].x, foes[i].y - player.y);

                if (foes[i].alive && foes[i].shoot) {
                    create_projectile(foes[i]);
                    foes[i].shoot = false;
                }

            }


            foes[i].projectile_cooldown -= (!foes[i].shoot) ? random_int(10) : 0;

            if (foes[i].projectile_cooldown <= 0) {
                foes[i].projectile_cooldown = foes[i].projectile_cooldown_reset;
                foes[i].shoot = true;
            }

            if (collision_check(player, foes[i])) {
                player.alive = false;
            }

            for (var ii = 0; ii < projectiles.length; ii++) {
                if (collision_check(projectiles[ii], foes[i]) && projectiles[ii].team != foes[i].team) {
                    foes[i].alive = false;
                    projectiles[ii].alive = false;
                }
            }

            if (foes[i].alive == false) {
                foes[i].visible = false;
                score.score_value++;

                // remove for from current room tile data
                for (var r = 0; r < rooms.length; r++) {
                    if (rooms[r].x == current_map.x && rooms[r].y == current_map.y) {
                        for (var y = 0; y < rooms[r].tile_data.length; y++) {
                            for (var x = 0; x < rooms[r].tile_data[y].length; x++) {
                                if (
                                    foes[i].room.x == x &&
                                    foes[i].room.y == y
                                ) {
                                    rooms[r].tile_data[y][x] = 0;
                                }
                            }
                        }
                    }
                }

                foes_remove.push(i);
            }

        }

        for (var i = (foes_remove.length - 1); i > -1; i--) {
            foes.splice(foes_remove[i], 1);
        }

    }

    function collision_check(obj1, obj2) {
        // check if SMALLER object colides with BIGGER object
        if (
            (((obj1.x + (obj1.hitbox_size / 2)) >= (obj2.x - (obj2.hitbox_size / 2)) && (obj1.x + (obj1.hitbox_size / 2)) <= (obj2.x + (obj2.hitbox_size / 2)))
            ||
            ((obj1.x - (obj1.hitbox_size / 2)) <= (obj2.x + (obj2.hitbox_size / 2)) && (obj1.x - (obj1.hitbox_size / 2)) >= (obj2.x - (obj2.hitbox_size / 2))))
            &&
            (((obj1.y + (obj1.hitbox_size / 2)) >= (obj2.y - (obj2.hitbox_size / 2)) && (obj1.y + (obj1.hitbox_size / 2)) <= (obj2.y + (obj2.hitbox_size / 2)))
            ||
            ((obj1.y - (obj1.hitbox_size / 2)) <= (obj2.y + (obj2.hitbox_size / 2)) && (obj1.y - (obj1.hitbox_size / 2)) >= (obj2.y - (obj2.hitbox_size / 2))))
            &&
            (obj1.alive == true && obj2.alive == true)
        ) {
            return true;
        } else {
            return false;
        }
    }

    function vision_check(obj1, obj2) {
        let point_x = obj1.x,
            point_y = obj1.y,
            line_length = Math.sqrt(Math.pow(Math.abs(obj1.x - obj2.x), 2) + Math.pow(Math.abs(obj1.y - obj2.y), 2)),
            x_length = obj2.x - obj1.x,
            y_length = obj2.y - obj1.y,
            right_edge = 0,
            left_edge = 0,
            bottom_edge = 0,
            top_edge = 0,
            has_vision = true;
        for (var i = 0; i < line_length; i++) {

            point_x += x_length / line_length;
            point_y += y_length / line_length;
            //console.log(point_y);
            for (var m = 0; m < room_data.length; m++) {
                right_edge = room_data[m].x + (room_data[m].hitbox_size / 2);
                left_edge = room_data[m].x - (room_data[m].hitbox_size / 2);
                bottom_edge = room_data[m].y + (room_data[m].hitbox_size / 2);
                top_edge = room_data[m].y - (room_data[m].hitbox_size / 2);

                if (
                    point_x >= left_edge && point_x <= right_edge
                    &&
                    point_y >= top_edge && point_y <= bottom_edge
                ) {
                    has_vision = false;
                    break;
                }
            }

            if (has_vision == false) {break;}

        }
        return has_vision;
    }

    function keep_in(obj, kill) {
        let x_bounds = app.renderer.width,
            y_bounds = app.renderer.height;
        if (kill == false) {
            if (obj.x > x_bounds) {
                obj.x = x_bounds - (obj.hitbox_size / 2);
                current_map.level_change_direction = (obj == player) ? '0001' : '0000';
                //obj.vx = (current_map.level_change_direction == '0000') ? obj.vx : 0;
            } else if (obj.x < 0) {
                obj.x = (obj.hitbox_size / 2);
                current_map.level_change_direction = (obj == player) ? '0100' : '0000';
                //obj.vx = (current_map.level_change_direction == '0000') ? obj.vx : 0;
            }

            if (obj.y > y_bounds) {
                obj.y = y_bounds - (obj.hitbox_size / 2);
                current_map.level_change_direction = (obj == player) ? '1000' : '0000';
                //obj.vy = (current_map.level_change_direction == '0000') ? obj.vy : 0;
            } else if (obj.y < 0) {
                obj.y = (obj.hitbox_size / 2);
                current_map.level_change_direction = (obj == player) ? '0010' : '0000';
                //obj.vy = (current_map.level_change_direction == '0000') ? obj.vy : 0;
            }
        } else if (kill == true) {
            if (
                obj.x > x_bounds ||
                obj.x < 0 ||
                obj.y > y_bounds ||
                obj.y < 0
            ) {
                obj.alive = false;
            }
        }
    }

    function create_projectile(obj) {
        projectile = new sprite(texture_cache['fireball.png'])
        projectile.position.set(obj.x, obj.y);
        projectile.team = obj.team;
        projectile.rotation = obj.rotation;
        projectile.hitbox_size = 14;
        projectile.anchor.set(0.5);
        projectile.alive = true;
        projectile.speed = obj.projectile_speed;
        app.stage.addChild(projectile);
        projectiles.push(projectile);
    }

    function create_player(file, x_start, y_start, projectile_speed, acceleration_speed, top_speed, shoot_speed) {
        player = new sprite(texture_cache[file]);
        player.position.set(x_start, y_start);
        player.team = 1;
        player.hitbox_size = 22;
        player.anchor.set(0.5);
        player.vx = 0;
        player.vy = 0;
        player.alive = true;
        player.shoot = true;
        player.projectile_speed = projectile_speed;
        player.projectile_cooldown = shoot_speed;
        player.projectile_cooldown_reset = shoot_speed;
        player.acceleration_speed = acceleration_speed;
        player.top_speed = top_speed;
        app.stage.addChild(player);
    }

    function create_foe(file, x_start, y_start, projectile_speed, acceleration_speed, top_speed, shoot_speed, room_x, room_y) {
        foe = new sprite(texture_cache[file]);
        foe.room = {};
        foe.room.x = room_x;
        foe.room.y = room_y;
        foe.position.set(x_start, y_start);
        foe.team = 2;
        foe.hitbox_size = 32;
        foe.anchor.set(0.5);
        foe.vx = 0;
        foe.vy = 0;
        foe.alive = true;
        foe.shoot = true;
        foe.vision = false;
        foe.projectile_speed = projectile_speed;
        foe.projectile_cooldown = shoot_speed;
        foe.projectile_cooldown_reset = shoot_speed;
        foe.acceleration_speed = acceleration_speed;
        foe.top_speed = top_speed;
        foes.push(foe);
        app.stage.addChild(foe);
    }

    function create_wall(file, x, y) {
        wall = new sprite(texture_cache[file]);
        wall.position.set(x, y);
        wall.team = 3;
        wall.hitbox_size = 64;
        wall.alive = true;
        wall.anchor.set(0.5);
        room_data.push(wall);
        app.stage.addChild(wall);
    }

    function create_text(input, x, y, center) {
        let message = new text(input);
        message.position.set(x,y);
        if (center == true) { message.anchor.set(0.5); };
        app.stage.addChild(message);
    }

    function score_update() {
        score.text = 'Score: ' + score.score_value;
    }

    function add_score() {
        app.stage.addChild(score);
    }

    function create_score() {
        const score_style = new PIXI.TextStyle({
            fontFamily: "Arial Black",
            fontSize: 30,
            lineJoin: "round",
            stroke: "aqua",
            strokeThickness: 6
        });
        score = new text('Score: ', score_style);
        score.score_value = 0;
        score.position.set(10,10);
        score.text = 'Score: ' + score.score_value;
        score.zIndex = 2;
        app.stage.addChild(score);
        console.log(app.stage);
    }

    // ROOMS

    function change_room(room_type) {
        // if game start
        if (room_type == 'start') {
            room = new create_room(current_map.x, current_map.y, '10000');
            room.fill(room);
            create_player('player.png', 416, 416, 11, 0.5, 10, 20);
        } else {

            // clear current stage
            clear_stage(player);
            add_score();

            // update current rooms variable and player location based on exit direction
            switch (room_type) {
                case '1000':
                    current_map.y++;
                    player.y = 2;
                    break;
                case '0010':
                    current_map.y--;
                    player.y = app.renderer.height - 2;
                    break;
                case '0100':
                    current_map.x--;
                    player.x = app.renderer.height - 2;
                    break;
                case '0001':
                    current_map.x++;
                    player.x = 2;
                    break;
            }

            // check if room exists in rooms variable, and use it if it does
            let map_exists = false;
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].x == current_map.x && rooms[i].y == current_map.y) {
                    room = rooms[i];
                    map_exists = true;
                    break;
                }
            }

            // otherwise make a new room
            let entrance;
            if (!map_exists) {
                let parm = room_type.split('');
                let total_exits = 0, possible_exits = '';

                // randomise room configuration, while keeping in mine connecting exists to adjacent rooms
                for (var i = 0; i < parm.length; i++) {
                    let room_check;
                    if (parm[i] != 1) {
                        switch (i) {
                            case 0:
                                 room_check = check_if_room_exists(current_map.x, current_map.y - 1);
                                if (room_check != false) {
                                    parm[i] = (room_check.exits[2] == 0) ? '0' : '1';
                                    possible_exits += (room_check.exits[2] == 0) ? '0' : '1';
                                } else {
                                    parm[i] = String(Math.round(Math.random()));
                                    possible_exits += '1';
                                }
                                break;
                            case 1:
                                room_check = check_if_room_exists(current_map.x + 1, current_map.y);
                                if (room_check != false) {
                                    parm[i] = (room_check.exits[3] == 0) ? '0' : '1';
                                    possible_exits += (room_check.exits[3] == 0) ? '0' : '1';
                                } else {
                                    parm[i] = String(Math.round(Math.random()));
                                    possible_exits += '1';
                                }
                                break;
                            case 2:
                                room_check = check_if_room_exists(current_map.x, current_map.y + 1);
                                if (room_check != false) {
                                    parm[i] = (room_check.exits[0] == 0) ? '0' : '1';
                                    possible_exits += (room_check.exits[0] == 0) ? '0' : '1';
                                } else {
                                    parm[i] = String(Math.round(Math.random()));
                                    possible_exits += '1';
                                }
                                break;
                            case 3:
                                room_check = check_if_room_exists(current_map.x - 1, current_map.y);
                                if (room_check != false) {
                                    parm[i] = (room_check.exits[1] == 0) ? '0' : '1';
                                    possible_exits += (room_check.exits[1] == 0) ? '0' : '1';
                                } else {
                                    parm[i] = String(Math.round(Math.random()));
                                    possible_exits += '1';
                                }
                                break;
                        }
                        total_exits += (parm[i] == 1) ? 1 : 0;
                    } else if (parm[i] == 1) {
                        entrance = i
                        total_exits++;
                        possible_exits += '0';
                    }
                }

                // if no exits have been placed, add one while respecting adjacent rooms
                let new_exit;
                if (total_exits == 1) {
                    while(total_exits == 1) {
                        new_exit = Math.round(Math.random() * 3);
                        if (new_exit != entrance && possible_exits[new_exit] == 1) {
                            parm[new_exit] = 1;
                            total_exits++;
                        }
                    }
                }

                // add room fill configuraton
                parm.push(String(Math.round(Math.random())));

                // join room configuration array back into string
                room_type = parm.join('');

                // create new room with room configeration
                room = new create_room(current_map.x, current_map.y, room_type, entrance);

                // increase difficulty with each new room
                difficulty += 0.1;

                // add score for new opened room
                score.score_value += 5;
            }

            // update stage
            room.fill(room);

            // reset change directon
            current_map.level_change_direction = '0000';

        }
    }

    function check_if_room_exists(x,y) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].x == x && rooms[i].y == y) {
                return rooms[i];
            }
        }
        return false;
    }

    function create_room(x, y, room_type, room_entrance) {
        this.exits = room_type.slice(0,4);
        this.tile_data = set_room_type(room_type, room_entrance);
        this.x = x;
        this.y = y;
        this.fill = place_objects_in_room;
        rooms.push(this);
        add_room_to_map(this);
    }

    function place_objects_in_room(room_obj) {
        let map_x = -32,
            map_y = -32;
        for (var y = 0; y < room_obj.tile_data.length; y++) {
            map_y += 64;

            for (var x = 0; x < room_obj.tile_data[y].length; x++) {
                map_x += 64;

                switch (room_obj.tile_data[y][x]) {
                    case 1:
                        create_wall('wall.png', map_x, map_y);
                        break;
                    case 2:
                        create_foe('foe.png', map_x, map_y, 6, 0.2, 4, 600, x, y);
                        break;
                    case 3:
                        create_player('player.png', map_x, map_y, 11, 0.5, 10, 20);
                        break;
                }

            }
            map_x = -32;

        }

    }

    function set_room_type(room_type, room_entrance) {
        let parm = room_type.split('');
        let room = [];
        if (parm[4] == 0) {
            room = [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];
            room[0][6] = (parm[0] == 1) ? 0 : 1;
            room[6][12] = (parm[1] == 1) ? 0 : 1;
            room[12][6] = (parm[2] == 1) ? 0 : 1;
            room[6][0] = (parm[3] == 1) ? 0 : 1;
        } else if (parm[4] == 1) {
            room = [
                [1, 1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 9, 9, 9, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 9, 9, 9, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 9, 9, 9, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 9, 9, 9, 1, 1, 1, 1, 1],
                [1, 6, 6, 6, 6, 0, 0, 0, 8, 8, 8, 8, 1],
                [6, 6, 6, 6, 6, 0, 0, 0, 8, 8, 8, 8, 8],
                [1, 6, 6, 6, 6, 0, 0, 0, 8, 8, 8, 8, 1],
                [1, 1, 1, 1, 1, 7, 7, 7, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 7, 7, 7, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 7, 7, 7, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 7, 7, 7, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 7, 1, 1, 1, 1, 1, 1]
            ];
            for (var i = 0; i < room.length; i++) {
                for (var ii = 0; ii < room[i].length; ii++) {
                    switch (room[i][ii]) {
                        case 9:
                            room[i][ii] = (parm[0] == 1) ? 0 : 1;
                            break;
                        case 8:
                            room[i][ii] = (parm[1] == 1) ? 0 : 1;
                            break;
                        case 7:
                            room[i][ii] = (parm[2] == 1) ? 0 : 1;
                            break;
                        case 6:
                            room[i][ii] = (parm[3] == 1) ? 0 : 1;
                            break;
                    }
                }
            }
        }


        if (room_type != '10000') {
            console.log(difficulty)
            // randomly place enemies on fr;ee tiles
            for (var i = 0; i < room.length; i++) {
                for (var ii = 0; ii < room[i].length; ii++) {
                    // IDEA: make enemy spawn chance scale based on number of rooms generated and distance from spawn
                    if (random_int(50) > (48 - difficulty) && room[i][ii] == 0) {
                        room[i][ii] = 2;
                    }
                }
            }

            // remove any enemies on entrance quadrant
            let area_width_left, area_width_right, area_depth;
            switch (room_entrance) {
                case 0:
                    // TOP
                    area_width_left = 11;
                    area_width_right = 1;
                    area_depth = 0;
                    for (var i = area_depth; i < 7; i++) {
                        for (var ii = area_width_right; ii <= area_width_left; ii++) {
                            if (
                                room[i][ii] == 2
                            ) {
                                room[i][ii] = 0;
                            }
                        }
                        area_depth++;
                        area_width_left--;
                        area_width_right++;
                    }
                    break;
                case 1:
                    // RIGHT
                    area_width_left = 6;
                    area_width_right = 6;
                    area_depth = 7;
                    for (var i = area_depth; i < room.length; i++) {
                        for (var ii = area_width_right; ii <=  area_width_left; ii++) {
                            if (
                                room[ii][i] == 2
                            ) {
                                room[ii][i] = 0;
                            }
                        }
                        area_depth--;
                        area_width_left++;
                        area_width_right--;
                    }
                    break;
                case 2:
                    // BOTTOM
                    area_width_left = 6;
                    area_width_right = 6;
                    area_depth = 7;
                    for (var i = area_depth; i < room.length; i++) {
                        for (var ii = area_width_left; ii <= area_width_right; ii++) {
                            if (
                                room[i][ii] == 2
                            ) {
                                room[i][ii] = 0;
                            }
                        }
                        area_depth++;
                        area_width_left--;
                        area_width_right++;
                    }
                    break;
                case 3:
                    // LEFT
                    area_width_left = 1;
                    area_width_right = 11;
                    area_depth = 0;
                    for (var i = area_depth; i < 7; i++) {
                        for (var ii = area_width_left; ii <= area_width_right; ii++) {
                            if (
                                room[ii][i] == 2
                            ) {
                                room[ii][i] = 0;
                            }
                        }
                        area_depth++;
                        area_width_left++;
                        area_width_right--;
                    }
                    break;
            }
        }

        return room;

    }

    function clear_stage(obj) {

        for (var i = app.stage.children.length + 1; i > -1; i--) {
            if (app.stage.children[i] != obj) {
                app.stage.removeChild(app.stage.children[i]);
            }
        }
        projectiles = [];
        foes = [];
        room_data = [];

    }

    function add_room_to_map(room) {
        let extend = false;

        // detect if matrix needs to be extended
        if (room.y < map.y_offset ||
            room.x < map.x_offset ||
            room.y > (map.data.length - 1) + map.y_offset ||
            room.x > (map.data[0].length - 1) + map.x_offset
        ) {
            extend = true;
        }

        // if current map current location is outside map, extend array
        if (room.y < map.y_offset && extend == true) {
            // TOP
            map.y_offset--;
            map.data.unshift([])

            for (var i = 0; i < map.data[1].length; i++) {
                if (i == room.x - map.x_offset) {
                    map.data[0].push(1);
                } else {
                    map.data[0].push(0);
                }
            }

        } else if (room.x < map.x_offset && extend == true) {
            // LEFT
            map.x_offset--;

            for (var i = 0; i < map.data.length; i++) {
                if (i == room.y - map.y_offset) {
                    map.data[i].unshift(1);
                } else {
                    map.data[i].unshift(0);
                }
            }

        } else if (room.y > (map.data.length - 1) + map.y_offset && extend == true) {
            // BOTTOM
            map.data.push([]);

            for (var i = 0; i < map.data[0].length; i++) {
                if (i == room.x - map.x_offset) {
                    map.data[map.data.length - 1].push(1);
                } else {
                    map.data[map.data.length - 1].push(0);
                }
            }

        } else if (room.x > (map.data[0].length - 1) + map.x_offset && extend == true) {
            // RIGHT

            for (var i = 0; i < map.data.length; i++) {
                if (i == room.y - map.y_offset) {
                    map.data[i].push(1);
                } else {
                    map.data[i].push(0);
                }
            }
        }

        // if map doesn't need extending, simply fill in the blank
        if (extend == false) {
            for (var i = 0; i < map.data.length; i++) {
                for (var ii = 0; ii < map.data[i].length; ii++) {
                    if (
                        room.x - map.x_offset == ii &&
                        room.y - map.y_offset == i
                    ) {
                        map.data[i][ii] = 1;
                    }
                }
            }
        }

    }

    function clear_map() {
        map.data = [
            []
        ];
        map.y_offset = 0;
        map.x_offset = 0;

        current_map.level_change_direction = '0000';
        current_map.x = 0;
        current_map.y = 0;

        rooms = [];
    }


    // MISC

    function set_settings() {
        settings.projectile_collision = true;
    }

    function keyboard(value) {
      let key = {};
      key.value = value;
      key.isDown = false;
      key.isUp = true;
      key.press = undefined;
      key.release = undefined;
      //The `downHandler`
      key.downHandler = event => {
        if (event.key === key.value) {
          if (key.isUp && key.press) key.press();
          key.isDown = true;
          key.isUp = false;
          event.preventDefault();
        }
      };

      //The `upHandler`
      key.upHandler = event => {
        if (event.key === key.value) {
          if (key.isDown && key.release) key.release();
          key.isDown = false;
          key.isUp = true;
          event.preventDefault();
        }
      };

      //Attach event listeners
      const downListener = key.downHandler.bind(key);
      const upListener = key.upHandler.bind(key);

      window.addEventListener(
        "keydown", downListener, false
      );
      window.addEventListener(
        "keyup", upListener, false
      );

      // Detach event listeners
      key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
      };

      return key;
    }

    function random_int(max) {
        return Math.floor((Math.random() * Math.floor(max)) + 1);
    }

    function change_state(num) {

        clear_stage();
        clear_map();

        switch (num) {
            case 1:
                state = play_screen;
                play_screen_made = false;
                break;
            case 2:
                state = lose_screen;
                lose_screen_made = false;
                break;
        }

    }




})

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
    app.renderer.resize(768,768);

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

    let state, player, foe, wall, gravity, stop_point, next_state;
    let projectiles = [];
    let foes = [];
    let map_data = [];
    let map = [
        [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
        [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]

    let left = keyboard('ArrowLeft'),
        up = keyboard('ArrowUp'),
        right = keyboard('ArrowRight'),
        down = keyboard('ArrowDown'),
        esc = keyboard ('Escape');

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

    function play_screen(delta){

        if (play_screen_made == false) {
            create_text('Reflex', 450, 650, true);
            create_text('Are you fast enough?', 450, 675, true);
            create_text('Menu', 10, 720, false);
            set_settings();
            create_map();
            play_screen_made = true;
        }

        gravity = 0.95;
        stop_point = 0.1;
        next_state = 0;

        player_update();
        foe_update();
        projectile_update();
        wall_update();

        switch (next_state) {
            case 1:
                change_state(1);
                break;
            case 2:
                change_state(2);
                break;
        }

    }

    function lose_screen(delta) {
        if (lose_screen_made == false) {
            create_text('You Died', 384, 384, true);
            create_text('Press Escape to retry', 384, 408, true);
            lose_screen_made = true;
        }

        next_state = 0;

        if (esc.isDown == true) {
            next_state = 1;
        }

        switch (next_state) {
            case 1:
                change_state(1);
                break;
            case 2:
                change_state(2);
                break;
        }

    }

    function wall_update() {
        for (var m = 0; m < map_data.length; m++) {

            for (var p = 0; p < projectiles.length; p++) {

                if (collision_check(projectiles[p], map_data[m])) {
                    projectiles[p].alive = false;
                }

            }

        }
    }

    function projectile_update() {

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

        if (left.isDown == true) { player.vx -= player.acceleration_speed }
        if (right.isDown == true) { player.vx += player.acceleration_speed }
        if (up.isDown == true) { player.vy -= player.acceleration_speed }
        if (down.isDown == true) { player.vy += player.acceleration_speed }

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

            for (var i = 0; i < map_data.length; i++) {
                if (collision_check(player, map_data[i])) {
                    if (player.vx > 0) {
                        player.x = map_data[i].x - (player.hitbox_size / 2) - (map_data[i].hitbox_size / 2) - 1;
                    } else if (player.vx < 0) {
                        player.x = map_data[i].x + (player.hitbox_size / 2) + (map_data[i].hitbox_size / 2) + 1;
                    }
                    player.vx = 0;
                }
            }

            player.y += player.vy;

            for (var i = 0; i < map_data.length; i++) {

                if (collision_check(player, map_data[i])) {
                    if (player.vy > 0) {
                        player.y = map_data[i].y - (player.hitbox_size / 2) - (map_data[i].hitbox_size / 2) - 1;
                    } else if (player.vy < 0) {
                        player.y = map_data[i].y + (player.hitbox_size / 2) + (map_data[i].hitbox_size / 2) + 1;
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

        for (var i = 0; i < foes.length; i++) {

            if (vision_check(foes[i], player) == true) {

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

            if (collision_check(foes[i], player)) {
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
            }
        }

    }

    function collision_check(obj1, obj2) {
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
            for (var m = 0; m < map_data.length; m++) {
                right_edge = map_data[m].x + (map_data[m].hitbox_size / 2);
                left_edge = map_data[m].x - (map_data[m].hitbox_size / 2);
                bottom_edge = map_data[m].y + (map_data[m].hitbox_size / 2);
                top_edge = map_data[m].y - (map_data[m].hitbox_size / 2);

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
            if (obj.x + (obj.hitbox_size / 2) > x_bounds) {
                obj.x = x_bounds - (obj.hitbox_size / 2);
                obj.vx = 0;
            } else if (obj.x - (obj.hitbox_size / 2) < 0) {
                obj.x = (obj.hitbox_size / 2);
                obj.vx = 0;
            }

            if (obj.y + (obj.hitbox_size / 2) > y_bounds) {
                obj.y = y_bounds - (obj.hitbox_size / 2);
                obj.vy = 0;
            } else if (obj.y - (obj.hitbox_size / 2) < 0) {
                obj.y = (obj.hitbox_size / 2);
                obj.vy = 0;
            }
        } else if (kill == true) {
            if (
                obj.x + (obj.hitbox_size / 2) > x_bounds ||
                obj.x - (obj.hitbox_size / 2) < 0 ||
                obj.y + (obj.hitbox_size / 2) > y_bounds ||
                obj.y - (obj.hitbox_size / 2) < 0
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

    function create_foe(file, x_start, y_start, projectile_speed, acceleration_speed, top_speed, shoot_speed) {
        foe = new sprite(texture_cache[file]);
        foe.position.set(x_start, y_start);
        foe.team = 2;
        foe.hitbox_size = 32;
        foe.anchor.set(0.5);
        foe.vx = 0;
        foe.vy = 0;
        foe.alive = true;
        foe.shoot = true;
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
        map_data.push(wall);
        app.stage.addChild(wall);
    }

    function create_text(input, x, y, center) {
        let message = new text(input);
        message.position.set(x,y);
        if (center == true) { message.anchor.set(0.5); };
        app.stage.addChild(message);
    }

    function create_map() {
        let map_x = -32,
            map_y = -32;
        for (var i = 0; i < map.length; i++) {
            map_y += 64;

            for (var ii = 0; ii < map[i].length; ii++) {
                map_x += 64;

                switch (map[i][ii]) {
                    case 1:
                        create_wall('wall.png', map_x, map_y);
                        break;
                    case 2:
                        create_foe('foe.png', map_x, map_y, 6, 0.2, 4, 600)
                        break;
                    case 3:
                        create_player('player.png', map_x, map_y, 11, 0.5, 10, 20)
                        break;
                }

            }
            map_x = -32;

        }

    }

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

    function clear_stage() {

        for (var i = app.stage.children.length + 1; i > -1; i--) {
            app.stage.removeChild(app.stage.children[i]);
        }
        projectiles = [];
        foes = [];
        map_data = [];

    }

    function change_state(num) {

        clear_stage()

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

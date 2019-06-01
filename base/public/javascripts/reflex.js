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

    // Resize stage to screen size
    // app.renderer.view.style.position = "absolute";
    // app.renderer.view.style.display = "block";
    // app.renderer.autoDensity = true;
    // app.renderer.resize(window.innerWidth, window.innerHeight);

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
        texture_cache = PIXI.utils.TextureCache;

    loader
        //.add('player', 'images/reflex.png')
        .add('images/reflex.json')
        .on('progress', (loader, resource) => {
            // function called when a spirte is loaded
            console.log('loaded ' + resource.name + ' at ' + resource.url + ' | current progress is ' + loader.progress + '%');
        })
        .load(setup);

    let state, player, foe, gravity, speed, cooldown_off;
    var projectiles = [];
    var foes = [];
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("ArrowRight"),
        down = keyboard("ArrowDown");

    let mouse = {};
    mouse.x = 0;
    mouse.y = 0;
    mouse.pressed = false;

    function setup() {
        console.log('setup')

        create_player('player.png', 256, 256, 11, 0.5, 10, 30)

        create_foe('foe.png', 100, 32, 6, 0.2, 4, 600)
        create_foe('foe.png', 200, 32, 6, 0.2, 4, 600)
        create_foe('foe.png', 300, 32, 6, 0.2, 4, 600)
        create_foe('foe.png', 400, 32, 6, 0.2, 4, 600)

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

        // Position the spirte
        // player.anchor.x = 0.5;
        // player.anchor.y = 0.5;
        // player.position.set(256, 256);

        // Scale the sprites
        // player.scale.set(1, 1);


        // Add sprite to stage
        // app.stage.addChild(player);
        // app.stage.addChild(foe);

        // Removing Sprites
        // app.stage.removeChild(anySprite)
        // anySprite.visible = false;
        state = play;

        app.ticker.add(delta => game_loop(delta));

    }

    function game_loop(delta){
        state(delta);
    }

    function play(delta){

        gravity = 0.95;
        stop_point = 0.1

        player_update();
        foe_update();
        projectile_update();

    }
    function projectile_update() {
        
        let projectiles_remove = [];

        for (var i = 0; i < projectiles.length; i++) {
            projectiles[i].x += Math.cos(projectiles[i].rotation - (Math.PI / 2)) * projectiles[i].speed;
            projectiles[i].y += Math.sin(projectiles[i].rotation - (Math.PI / 2)) * projectiles[i].speed;

            keep_in(projectiles[i], true);

            for (var ii = 0; ii < projectiles.length; ii++) {
                if (collision_check(projectiles[i], projectiles[ii]) && projectiles[i].team != projectiles[ii].team) {
                    projectiles[i].alive = false;
                    projectiles[ii].alive = false;
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
            player.y += player.vy;
        } else if (player.alive == false) {
            player.visible = false;
        }

        keep_in(player, false);
    }

    function foe_update() {

        for (var i = 0; i < foes.length; i++) {
            foes[i].rotation = Math.atan2(player.x - foes[i].x, foes[i].y - player.y);

            if (foes[i].alive && foes[i].shoot) {
                create_projectile(foes[i]);
                foes[i].shoot = false;
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
        projectile.hitbox_size = 16;
        projectile.anchor.x = 0.5;
        projectile.anchor.y = 0.5;
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
        player.anchor.x = 0.5;
        player.anchor.y = 0.5;
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
        foe.anchor.x = 0.5;
        foe.anchor.y = 0.5;
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

})

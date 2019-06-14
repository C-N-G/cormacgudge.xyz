$( document ).ready(function(){

    /*
    ##
    ##      SETUP
    ##
    */

    // Declare socket client
    var socket = io('/icarus');

    // Global vars
    var

    // Aliases
    app, loader, sprite, rectangle, texture_cache, text, state,

    // Controls
    action_left, action_up, action_right, action_down, input_a, input_w, input_s, input_d, mouse,
    input_up, input_down, input_left, input_right,

    // Objects
    player,

    // Object lists
    platforms = [],

    // Containers
    player_view, environment,

    // Physics
    gravity = 1.1,

    // Mechanics
     //jump_height = 17, jumping = false, can_jump = true;

    // Camera
    cam_x = 500, cam_y = 500;

    // Make stage and assign global vars
    initialize();
    function initialize() {
        app = new PIXI.Application({
            width: 832,
            height: 832,
            antialias: true,
            transparent: true,
            resolution: 1,
            autoDensity: true
        });

        $('.content').append(app.view);
        app.stage.sortableChildren = true;
        app.renderer.view.style.position = "absolute";
        app.renderer.view.style.display = "block";
        app.renderer.resize(window.innerWidth, window.innerHeight);

        loader = PIXI.Loader.shared;
        sprite = PIXI.Sprite;
        rectangle = PIXI.Rectangle;
        texture_cache = PIXI.utils.TextureCache;
        text = PIXI.Text;

        player_view = new PIXI.Container();
        environment = new PIXI.Container();

        input_left = keyboard('ArrowLeft');
        input_up = keyboard('ArrowUp');
        input_right = keyboard('ArrowRight');
        input_down = keyboard('ArrowDown');
        input_esc = keyboard('Escape');
        input_a = keyboard('a');
        input_w = keyboard('w');
        input_d = keyboard('d');
        input_s = keyboard('s');
        mouse = {};
        mouse.x = 0;
        mouse.y = 0;
        mouse.pressed = false;

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
        $(window).on('resize', function(event){
            app.renderer.resize(window.innerWidth, window.innerHeight);
        })

        loader
            .add('images/icarus.json')
            .on('progress', (loader, resource) => {
                // function called when a spirte is loaded
                console.log('loaded ' + resource.name + ' at ' + resource.url + ' | current progress is ' + loader.progress + '%');
            })
            .load(setup);
    }

    // Start main loop after loading sprites
    function setup() {

        // create_platform(0, 600);
        // create_platform(127, 600);
        // create_platform(254, 600);
        // create_platform(381, 600);
        // create_platform(507, 600);
        // create_platform(634, 600);
        // create_platform(734, 400);

        create_platform_group(0, 600, 6);
        create_platform_group(500, 400, 6);
        create_platform_tower(100, 200, 20);
        create_platform_tower(-700, 250, 20);
        create_platform_tower(1200, 350, 20);
        // create_platform_group(100, 200, 5);
        // create_platform_group(400, 0, 5);
        // create_platform_group(100, -200, 5);
        // create_platform_group(400, -400, 5);
        // create_platform_group(100, -600, 5);
        // create_platform_group(400, -800, 5);
        // create_platform_group(100, -1000, 5);
        create_platform_group(-1000, 1000, 20);
        create_platform_group(-200, 800, 2);
        create_player(500, 500);
        app.stage.addChild(player_view);
        app.stage.addChild(environment);
        console.log(player.getBounds());

        state = play_screen;

        app.ticker.add(delta => game_loop(delta));

    }

    // Main loop
    function game_loop(delta) {
        state(delta);
    }

    /*
    ##
    ##      GAME
    ##
    */

    // Game loop
    function play_screen() {
        check_inputs();
        player_update();
        camera_update();
    }

    // Checks keyboard input and sets flags accordingly
    function check_inputs() {
        // Left
        if (input_a.isDown
            || input_left.isDown) {
            action_left = true;
        } else {
            action_left = false;
        }

        // RIGHT
        if (input_d.isDown
            || input_right.isDown) {
            action_right = true;
        } else {
            action_right = false;
        }

        // Up
        if (input_w.isDown
            || input_up.isDown) {
            action_up = true;
        } else {
            action_up = false;
        }

        // Down
        if (input_s.isDown
            || input_down.isDown) {
            action_down = true;
        } else {
            action_down = false;
        }
    }

    // Check for collision between two rectangles
    function check_collision(obj1, obj2) {
        let hit = false;
        obj1 = obj1.getBounds();
        obj2 = obj2.getBounds();
        if(obj1.bottom > obj2.top
           && obj1.top < obj2.bottom
           && obj1.left < obj2.right
           && obj1.right > obj2.left) {
            hit = true;
        }
        return hit;
    }

    // Update player object
    function player_update() {
        // Move player from inputs
        //console.log(player.can_jump + ' | ' + player.jumping);
        if (action_left) { player.vx-- };
        if (action_right) { player.vx++ };
        if (action_up) { player.jumping = true } else { player.jumping = false };

        if (player.jumping && player.can_jump) {
            player.vy -= player.jump_power;
            player.can_jump = false;
            player.jumping = false;
        }


        // If velocity approaches zero then set it to zero
        player.vx = (Math.abs(player.vx) < 0.1) ? 0 : player.vx;
        player.vy = (Math.abs(player.vy) < 0.1) ? 0 : player.vy;

        // Move horizontally
        environment.x -= player.vx;
        player.worldx = environment.x * -1;
        //cam_x = player.x - environment.x;
        platforms_length = platforms.length;
        for (var i = 0; i < platforms_length; i++) {
            if (check_collision(player,platforms[i])) {
                let hitter = player.getBounds(),
                    hitte = platforms[i].getBounds();
                environment.x = (player.vx > 0) ? (platforms[i].worldx - hitter.width) * -1 : (platforms[i].worldx + hitte.width) * -1;
                player.vx = 0;
            }
        }
        //console.log(player.worldx);

        // Move vertically
        environment.y -= player.vy;
        player.worldy = environment.y * -1;
        //cam_y = player.y - environment.y;
        //console.log(cam_y);
        for (var i = 0; i < platforms_length; i++) {
            if (check_collision(player,platforms[i])) {
                let hitter = player.getBounds(),
                    hitte = platforms[i].getBounds();
                //console.log(global_hitte.y + ' | ' + hitte.y);
                console.log(player.worldy + ' | ' + platforms[i].worldy);
                environment.y = (player.vy > 0) ? (platforms[i].worldy - hitter.height) * -1 : (platforms[i].worldy + hitte.height) * -1;
                //environment.y = (platforms[i].worldy - hitter.height) * -1;
                player.can_jump = (player.vy > 0) ? true : false;
                player.vy = 0;
            }
        }

        // Divide velocity by gravity to slowly decrease it
        player.vx /= gravity;
        player.vy += gravity / 2;
    }

    // Update camera
    function camera_update() {
        //environment.x = (window.innerWidth / 2) - 16;
        let bounds = player.getBounds();
        console.log(player.worldx);
        app.stage.position.y = (window.innerHeight / 2) - (cam_y + (bounds.height / 2));
        app.stage.position.x = (window.innerWidth / 2) - (cam_x + (bounds.width / 2));
    }

    // Create a player object
    function create_player(x, y) {
        player = new sprite(texture_cache['player.png']);
        player.position.set(x, y);
        player.vx = 0;
        player.vy = 0;
        player.worldy = y - cam_y;
        player.worldx = x - cam_x;
        player.jump_power = 17;
        player.jumping = false;
        player.can_jump = true;
        player_view.addChild(player);
    }

    // Create a platform object
    function create_platform(x, y) {
        platform = new sprite(texture_cache['platform.png']);
        platform.position.set(x, y);
        platform.worldy = y - cam_y;
        platform.worldx = x - cam_x;
        environment.addChild(platform);
        platforms.push(platform);
    }

    function create_platform_group(x, y, number) {
        for (var i = 0; i < number; i++) {
            create_platform(x, y);
            x += 127;
        }
    }

    function create_platform_tower(x, y, height) {
        let x_start = x;
        for (var i = 0; i < height; i++) {
            create_platform_group(x, y, 5);
            y -= 200;
            x = (x > x_start) ? x_start : x_start + 300;
        }
    }

    /*
    ##
    ##      MISC
    ##
    */

    // Attaches keyboard event listeners
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

    // Get random values
    function random_int(max) {
        return Math.round(Math.random() * max);
    }

})

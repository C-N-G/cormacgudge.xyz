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
    app.renderer.resize(512,512);

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
        //let player = new sprite( resources.player.texture );
        //let tileset = new sprite(resources['images/reflex.png'].texture);

        player = new sprite(texture_cache['player.png']);
        player.position.set(256, 256);
        player.anchor.x = 0.5;
        player.anchor.y = 0.5;
        player.vx = 0;
        player.vy = 0;
        app.stage.addChild(player);

        foe = new sprite(texture_cache['foe.png']);
        foe.position.set(256, 32);
        foe.anchor.x = 0.5;
        foe.anchor.y = 0.5;
        foe.vx = 0;
        foe.vy = 0;
        app.stage.addChild(foe);

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
        cooldown_off = true;
        //console.log(app.stage);
        app.ticker.add(delta => game_loop(delta));

    }

    function game_loop(delta){
        state(delta);
    }

    function play(delta){

        gravity = 0.95;
        speed = 0.5;
        top_speed = 10
        stop_point = 0.1

        if (left.isDown == true) { player.vx -= speed }
        if (right.isDown == true) { player.vx += speed }
        if (up.isDown == true) { player.vy -= speed }
        if (down.isDown == true) { player.vy += speed }

        player.vy *= gravity;
        player.vx *= gravity;

        if (player.vx < stop_point && player.vx > -stop_point) { player.vx = 0 };
        player.vx = (player.vx > top_speed) ? top_speed : player.vx;
        player.vx = (player.vx < -top_speed) ? -top_speed : player.vx;

        if (player.vy < stop_point && player.vy > -stop_point) { player.vy = 0 };
        player.vy = (player.vy > top_speed) ? top_speed : player.vy;
        player.vy = (player.vy < -top_speed) ? -top_speed : player.vy;

        let adjacent = player.y - mouse.y,
            opposite = player.x - mouse.x,
            hypotenuse = Math.sqrt((adjacent * adjacent) + (opposite * opposite));
            angle = Math.asin(opposite / hypotenuse);
        player.rotation = (adjacent >= 0) ? -angle : Math.PI + angle;

        if (mouse.pressed && cooldown_off) {
            shoot(player.x, player.y, player.rotation);
            cooldown_off = false;
            setTimeout(function(){ cooldown_off = true; }, 250);
        }
        //console.log(adjacent + ' | ' + opposite + ' | ' + hypotenuse + ' | ' + angle);
        //console.log(mouse.pressed);
        player.y += player.vy;
        player.x += player.vx;
        for (var i = 0; i < projectiles.length; i++) {
            projectiles[i].x += Math.cos(projectiles[i].rotation - (Math.PI / 2))*projectiles[i].speed;
            projectiles[i].y += Math.sin(projectiles[i].rotation - (Math.PI / 2))*projectiles[i].speed;
        }
        //console.log(player.vx + ' | ' + player.vy);
        //console.log(app.renderer.width + ' Z ' + app.renderer.height);
    }
    function shoot(x, y, rotation) {
        projectile = new sprite(texture_cache['fireball.png'])
        projectile.position.set(x,y);
        projectile.rotation = rotation;
        projectile.anchor.x = 0.5;
        projectile.anchor.y = 0.5;
        projectile.speed = 11;
        app.stage.addChild(projectile);
        projectiles.push(projectile);
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

})

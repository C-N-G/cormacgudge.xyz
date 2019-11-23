let socket;
let foreign_map;
let friendly_map;
let bt = {};
let ships = [];
let mouse_offset = {};
let mouse_x;
let mouse_y;
let last_pos = {};
let mp = {}
let display_message = {};

function setup() {

  socket = io('/battleship');

  ships.push(new ship('carrier', 0, 0, 0, 5, 'darkorchid'));
  ships.push(new ship('battleship', 1, 0, 0, 4, 'orange'));
  ships.push(new ship('cruiser', 2, 0, 0, 3, 'yellow'));
  ships.push(new ship('submarine', 3, 0, 0, 3, 'chartreuse'));
  ships.push(new ship('destoryer', 4, 0, 0, 2, 'pink'));

  mouse_offset.x = 0;
  mouse_offset.y = 0;

  display_message.display = false;

  last_pos.x = 0;
  last_pos.y = 0;
  last_pos.rotation = 0;

  bt.size = 100*7;
  bt.width = bt.size/200

  mp.p1_ready = false;
  mp.p2_ready = false;
  mp.player = 'joined';
  mp.game_started = false;
  mp.turn = false;
  mp.ended = false;

  let myCanvas = createCanvas(bt.size*2 , bt.size);
  myCanvas.parent('content');

  friendly_map = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];

  foreign_map = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];

  smooth();

  textSize(bt.size/14);
  textAlign(CENTER, CENTER);

}

function ship(id, x, y, r, s, c) {
  this.id = id
  this.x = x;
  this.y = y;
  this.rotation = r;
  this.size = s;
  this.hits = 0;
  this.color = c;
  this.moving = false;
  this.rotating = false;
}

function make_ship_map() {
  let ship_map = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];
  for (var i_x = 0; i_x < ship_map.length; i_x++) {
    for (var i_y = 0; i_y < ship_map[i_x].length; i_y++) {
      for (var i_s = 0; i_s < ships.length; i_s++) {
        if (ships[i_s].rotation == 0 &&
            i_y == ships[i_s].x &&
             i_x >= ships[i_s].y &&
             i_x <= (ships[i_s].y + (ships[i_s].size - 1))
            ||
            ships[i_s].rotation == 1 &&
            i_x == ships[i_s].y &&
            i_y >= ships[i_s].x &&
            i_y <= (ships[i_s].x + (ships[i_s].size - 1))
          ) {
          ship_map[i_x][i_y] = 1;
        }
      }
    }
  }
  console.log(ship_map);
  return ship_map;
}

function draw_friendly_board() {
  let line_x = bt.size/11;
  let line_y = bt.size/11;
  let circle_y = bt.size/22+bt.size/11;
  let circle_x = bt.size/22+bt.size/11;
  let top_letters = {x: (bt.size/22)+(bt.size/11), y: bt.size/22, value: 1};
  let side_letters = {x: bt.size/22, y: (bt.size/22)+(bt.size/11), value: ['A','B','C','D','E','F','G','H','I','J']};
  let tri = bt.size/22;

  fill('royalblue');
  stroke('black');
  strokeWeight(bt.width);
  rect(0,0,bt.size,bt.size);

  if (mp.p1_ready) {
    fill('lawngreen');
  } else {
    fill('red');
  }
  triangle (
    tri, tri-(bt.size/33),
    tri+(bt.size/33), tri+(bt.size/33),
    tri-(bt.size/33), tri+(bt.size/33)
  );

  for (var i = 0; i < 10; i++) {

    fill('black');
    stroke('black');
    strokeWeight(bt.width);
    line(line_x, 0, line_x, bt.size);
    line(0, line_y, bt.size, line_y);
    line_x += bt.size/11;
    line_y += bt.size/11;

    text(top_letters.value, top_letters.x, top_letters.y);
    top_letters.value++;
    top_letters.x += bt.size/11;
    text(side_letters.value[i], side_letters.x, side_letters.y);
    side_letters.y += bt.size/11;

    circle_y = bt.size/22+bt.size/11;

    for (var i1 = 0; i1 < 10; i1++) {
      switch (friendly_map[i1][i]) {
        case 0:
          strokeWeight(bt.width*1.2);
          stroke('royalblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('black');
          fill('black');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        case 1:
          strokeWeight(bt.width*1.2);
          stroke('royalblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('red');
          fill('red');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        case 2:
          strokeWeight(bt.width*1.2);
          stroke('royalblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('white');
          fill('white');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        default:
      }
      circle_y += bt.size/11;
    }
    circle_x += bt.size/11;

  }
}

function draw_foreign_board() {
  let line_x = bt.size/11 + bt.size;
  let line_y = bt.size/11;
  let circle_x = bt.size/22+bt.size/11 + bt.size;
  let circle_y = bt.size/22+bt.size/11;
  let top_letters = {x: (bt.size/22)+(bt.size/11) + bt.size, y: bt.size/22, value: 1};
  let side_letters = {x: bt.size/22 + bt.size, y: (bt.size/22)+(bt.size/11), value: ['A','B','C','D','E','F','G','H','I','J']};
  let tri = bt.size/22;

  fill('dodgerblue');
  stroke('black');
  strokeWeight(bt.width);
  rect(bt.size,0,bt.size,bt.size);

  if (mp.p2_ready) {
    fill('lawngreen');
  } else {
    fill('red');
  }
  triangle (
    bt.size+tri, tri-(bt.size/33),
    bt.size+tri+(bt.size/33), tri+(bt.size/33),
    bt.size+tri-(bt.size/33), tri+(bt.size/33)
  );

  for (var i = 0; i < 10; i++) {

    fill('black');
    stroke('black');
    strokeWeight(bt.width);
    line(line_x, 0, line_x, bt.size);
    line(bt.size, line_y, bt.size*2, line_y);
    line_x += bt.size/11;
    line_y += bt.size/11;

    text(top_letters.value, top_letters.x, top_letters.y);
    top_letters.value++;
    top_letters.x += bt.size/11;
    text(side_letters.value[i], side_letters.x, side_letters.y);
    side_letters.y += bt.size/11;

    circle_y = bt.size/22+bt.size/11;

    for (var i1 = 0; i1 < 10; i1++) {
      switch (foreign_map[i1][i]) {
        case 0:
          strokeWeight(bt.width*1.2);
          stroke('dodgerblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('black');
          fill('black');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        case 1:
          strokeWeight(bt.width*1.2);
          stroke('dodgerblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('red');
          fill('red');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        case 2:
          strokeWeight(bt.width*1.2);
          stroke('dodgerblue');
          ellipse(circle_x, circle_y, bt.size/20);
          strokeWeight(bt.width);
          stroke('white');
          fill('white');
          ellipse(circle_x, circle_y, bt.size/20);
          break;
        default:
        strokeWeight(bt.width*1.2);
        stroke('dodgerblue');
        ellipse(circle_x, circle_y, bt.size/20);
        strokeWeight(bt.width);
        stroke('yellow');
        fill('yellow');
        ellipse(circle_x, circle_y, bt.size/20);
      }
      circle_y += bt.size/11;
    }
    circle_x += bt.size/11;

  }
}

function reset_boards() {
  friendly_map = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];

  foreign_map = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ];

  for (var i = 0; i < ships.length; i++) {
    ships[i].y = 0;
    ships[i].x = i;
    ships[i].r = 0;
    ships[i].hits = 0;
  }

  mp.game_started = false;
  mp.p1_ready = false;
}

function print_message(text, time) {
  // if (display_message.display != true) {
  //   display_message.display = true;
  //   display_message.text = text;
  //   display_message.time = time;
  //   display_message.start_time = millis();
  // }
  display_message.display = true;
  display_message.text = text;
  display_message.time = time;
  display_message.start_time = millis();
}

function ship_collision_check(ship1, ship2) {
  return (
      ships[ship1].id != ships[ship2].id &&
      ships[ship1].rotation == 0 &&
      ships[ship2].rotation == 0 &&
      ships[ship1].x == ships[ship2].x &&
      ships[ship1].y + (ships[ship1].size-1) >= ships[ship2].y &&
      ships[ship1].y <= ships[ship2].y + (ships[ship2].size-1)
      ||
      ships[ship1].id != ships[ship2].id &&
      ships[ship1].rotation == 1 &&
      ships[ship2].rotation == 0 &&
      ships[ship1].y >= ships[ship2].y &&
      ships[ship1].y <= ships[ship2].y + (ships[ship2].size-1) &&
      ships[ship1].x + (ships[ship1].size-1) >= ships[ship2].x &&
      ships[ship1].x <= ships[ship2].x
      ||
      ships[ship1].id != ships[ship2].id &&
      ships[ship1].rotation == 0 &&
      ships[ship2].rotation == 1 &&
      ships[ship1].y + (ships[ship1].size-1) >= ships[ship2].y &&
      ships[ship1].y <= ships[ship2].y &&
      ships[ship1].x >= ships[ship2].x &&
      ships[ship1].x <= ships[ship2].x + (ships[ship2].size-1)
      ||
      ships[ship1].id != ships[ship2].id &&
      ships[ship1].rotation == 1 &&
      ships[ship2].rotation == 1 &&
      ships[ship1].y == ships[ship2].y &&
      ships[ship1].x + (ships[ship1].size-1) >= ships[ship2].x &&
      ships[ship1].x <= ships[ship2].x + (ships[ship2].size-1)
    );
}

function out_of_bounds_check(ship) {
  let out_of_bounds = false;
  if (ships[ship].rotation == 0) {
    if (ships[ship].x < 0) {
      out_of_bounds = true;
    } if (ships[ship].x > 9) {
      out_of_bounds = true;
    } if (ships[ship].y < 0) {
      out_of_bounds = true;
    } if (ships[ship].y + ships[ship].size - 1 > 9) {
      out_of_bounds = true;
    }
  } else if (ships[ship].rotation == 1) {
    if (ships[ship].y < 0) {
      out_of_bounds = true;
    } if (ships[ship].y > 9) {
      out_of_bounds = true;
    } if (ships[ship].x < 0) {
      out_of_bounds = true;
    } if (ships[ship].x + ships[ship].size - 1 > 9) {
      out_of_bounds = true;
    }
  }
  return out_of_bounds;
}

function update_ships() {

  for (var i = 0; i < ships.length; i++) {

    if (ships[i].moving == true) {
      last_pos.x = ships[i].x;
      last_pos.y = ships[i].y;
      ships[i].x = mouse_x - mouse_offset.x;
      ships[i].y = mouse_y - mouse_offset.y;
    }

    if (ships[i].rotating == true) {
      last_pos.rotation = ships[i].rotation;
      if (ships[i].rotation == 1) {
        ships[i].rotation = 0;
      } else if (ships[i].rotation == 0) {
        ships[i].rotation = 1;
      }
      ships[i].rotating = false;
      for (var i1 = 0; i1 < ships.length; i1++) {
        if(ship_collision_check(i,i1)) {
          ships[i].rotation = last_pos.rotation;
        }
      }
      if (out_of_bounds_check(i)) {
        ships[i].rotation = last_pos.rotation;
      }
    }

    if (ships[i].rotation == 0) {
      if (ships[i].x < 0) {
        ships[i].x = 0;
      } if (ships[i].x > 9) {
        ships[i].x = 9;
      } if (ships[i].y < 0) {
        ships[i].y = 0;
      } if (ships[i].y + ships[i].size - 1 > 9) {
        ships[i].y = 10 - ships[i].size;
      }
    } else if (ships[i].rotation == 1) {
      if (ships[i].y < 0) {
        ships[i].y = 0;
      } if (ships[i].y > 9) {
        ships[i].y = 9;
      } if (ships[i].x < 0) {
        ships[i].x = 0;
      } if (ships[i].x + ships[i].size - 1 > 9) {
        ships[i].x = 10 - ships[i].size;
      }
    }

    for (var i1 = 0; i1 < ships.length; i1++) {
      if (ship_collision_check(i,i1)) {
        ships[i].x = last_pos.x;
        ships[i].y = last_pos.y;
      }
    }

    noFill();
    let slot = bt.size/11;
    stroke(ships[i].color);
    strokeWeight(bt.width*2.65);
    if (ships[i].rotation == 0) {
      rect(slot * (ships[i].x + 1) + (bt.width*2),
      slot * (ships[i].y + 1) + (bt.width*2),
      slot - (bt.width*4),
      slot * ships[i].size - (bt.width*4),
      35);
    } else if (ships[i].rotation == 1) {
      rect(slot * (ships[i].x + 1) + (bt.width*2),
      slot * (ships[i].y + 1) + (bt.width*2),
      slot * ships[i].size - (bt.width*4),
      slot - (bt.width*4),
      35);
    }

  }

}

function menu_state() {
  if (mp.player == 'joined') {
    strokeWeight(bt.width*3);
    stroke('black');
    fill('gray');
    rect(0,0,bt.size*2,bt.size);
    strokeWeight(bt.width);
    fill('red');
    rect((bt.size/2)-(bt.size/22), (bt.size/2)-(bt.size/22), bt.size/11,bt.size/11, 15);
    stroke('red');
    text('JOIN', bt.size/2, bt.size/2 - bt.size/11);
    fill('blue');
    stroke('black');
    rect((bt.size/2)-(bt.size/22)+bt.size, (bt.size/2)-(bt.size/22), bt.size/11,bt.size/11, 15);
    stroke('blue');
    text('SPEC', bt.size/2 + bt.size, bt.size/2 - bt.size/11);
  }

  if (mp.player == 'spectating' && mp.game_started == false) {
    strokeWeight(bt.width*3);
    stroke('black');
    fill('gray');
    rect(0,0,bt.size*2,bt.size);
    strokeWeight(bt.width);
    fill('blue');
    stroke('blue');
    text('w.i.p', bt.size, bt.size/2);
  }

  if (display_message.display) {
    rectMode(RADIUS);
    fill('black');
    stroke('white');
    rect(bt.size, bt.size/2, bt.size/3, bt.size/6)
    rectMode(CORNER);
    strokeWeight(bt.width);
    fill('black');
    stroke('white');
    text(display_message.text, bt.size, bt.size/2);
    if (display_message.start_time + display_message.time < millis()) {
      display_message.display = false;
    }
  }
}

function mp_update() {

  socket.on('join request granted', function(){
    mp.player = 'playing';
    console.log('game joined');
  });

  socket.on('game full', function(){
    print_message('game full', 2*1000);
    console.log('game full cannot join');
  });

  socket.on('map update', function(data){
    friendly_map = data;
  });

  socket.on('hit update', function(data){
    foreign_map = data;
  });

  socket.on('player status', function(data){
    mp.p2_ready = data;
  });

  socket.on('game status', function(data){
    mp.game_started = data;
  });

  socket.on('turn update', function(data){
    mp.turn = data;
  });

  socket.on('reset game', function(){
    print_message('player left', 3*1000);
    reset_boards();
  });

  socket.on('game won', function(){
    setTimeout(function(){ location.reload(); }, 6000);
    if (mp.ended == false) {
      print_message('you have won', 5*1000);
      setTimeout(function(){ location.reload(); }, 6000);
      mp.ended = true;
    }
  });

  socket.on('game lost', function(){
    if (mp.ended == false) {
      print_message('you have lost', 5*1000);
      setTimeout(function(){ location.reload(); }, 6000);
      mp.ended = true;
    }
  });

}

function draw() {

  mouse_x = floor(mouseX/(bt.size/11))-1;
  mouse_y = floor(mouseY/(bt.size/11))-1;

  mp_update();
  draw_friendly_board();
  draw_foreign_board();
  update_ships();
  menu_state();

}

function mouseReleased() {

  for (var i = 0; i < ships.length; i++) {
    ships[i].moving = false;
  }

  return false;

}

function mousePressed() {

  if (!mp.p1_ready && mp.player == 'playing') {
    for (var i = 0; i < ships.length; i++) {
      if (ships[i].rotation == 0 &&
          mouse_x == ships[i].x &&
          mouse_y >= ships[i].y &&
          mouse_y <= (ships[i].y + (ships[i].size - 1)) &&
          ships[i].moving == false
          ||
          ships[i].rotation == 1 &&
          mouse_y == ships[i].y &&
          mouse_x >= ships[i].x &&
          mouse_x <= (ships[i].x + (ships[i].size - 1)) &&
          ships[i].moving == false
      ) {
        mouse_offset.x = mouse_x - ships[i].x;
        mouse_offset.y = mouse_y - ships[i].y;
        ships[i].moving = true;
      }
    }
  }


  return false;

}

function mouseClicked() {

  console.log(`x:${mouse_x}, y:${mouse_y}`);

  // ready click
  if (mouse_y == -1 && mouse_x == -1 && mp.player == 'playing' && mp.game_started == false) {
    if (mp.p1_ready) {
      mp.p1_ready = false;
    } else {
      mp.p1_ready = true;
    }
    let data = []
    data[0] = mp.p1_ready;
    data[1] = make_ship_map();
    data[2] = ships;
    socket.emit('player status', data);
  }

  // map click
  mouse_x -=  11;
  if (mp.game_started && mp.player == 'playing' && mp.turn) {
    if (mouse_y >= 0
      && mouse_x >= 0
      && mouse_y <= 9
      && mouse_x <= 9
      ) {
      if (foreign_map[mouse_y][mouse_x] == 0) {
        foreign_map[mouse_y][mouse_x] = 3;
        mp.turn = false;
        socket.emit('map update', foreign_map);
      }
    }
  }
  mouse_x +=  11;

  // main menu click
  if (mp.player == 'joined') {
    if (mouseX >= (bt.size/2)-(bt.size/22) &&
        mouseX <= (bt.size/2)-(bt.size/22)+(bt.size/11) &&
        mouseY >= (bt.size/2)-(bt.size/22) &&
        mouseY <= (bt.size/2)-(bt.size/22)+(bt.size/11)
    ) {
      socket.emit('join request');
    } else if (mouseX >= bt.size+(bt.size/2)-(bt.size/22) &&
        mouseX <= bt.size+(bt.size/2)-(bt.size/22)+(bt.size/11) &&
        mouseY >= (bt.size/2)-(bt.size/22) &&
        mouseY <= (bt.size/2)-(bt.size/22)+(bt.size/11)
    ) {
      mp.player = 'spectating';
      socket.emit('player spectating');
    }
  }

  return false;

}

function doubleClicked() {
  console.log(`${mouse_x} ${mouse_y}`);

  if (!mp.p1_ready && mp.player == 'playing') {
    for (var i = 0; i < ships.length; i++) {
      if (ships[i].rotation == 0 &&
          mouse_x == ships[i].x &&
          mouse_y >= ships[i].y &&
          mouse_y <= (ships[i].y + (ships[i].size - 1)) &&
          ships[i].moving == false
          ||
          ships[i].rotation == 1 &&
          mouse_y == ships[i].y &&
          mouse_x >= ships[i].x &&
          mouse_x <= (ships[i].x + (ships[i].size - 1)) &&
          ships[i].moving == false
      ) {
        ships[i].rotating = true;
      }
    }
  }


  return false;

}

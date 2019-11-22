$( document ).ready(function(){

  var socket = io('/battleship');

})

var map;
var bt = {};

function setup() {

  bt.size = 100*8;
  bt.width = bt.size/200

  let myCanvas = createCanvas(bt.size , bt.size);
  myCanvas.parent('content');

  map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
  ];

  strokeWeight(bt.width);
  rect(0,0,bt.size,bt.size);

  let top_letters = {x: bt.size/22+bt.size/11, y: bt.size/22, value: 1};
  let side_letters = {x: bt.size/22, y: bt.size/22+bt.size/11, value: ['A','B','C','D','E','F','G','H','I','J']};

  let line_X = bt.size/11;
  let line_y = bt.size/11;
  let circle_y = bt.size/22+bt.size/11;
  let circle_x = bt.size/22+bt.size/11;

  textSize(bt.size/14);
  textAlign(CENTER, CENTER);

  for (var i = 0; i < 10; i++) {
    line(line_X, 0, line_X, bt.size);
    line(0, line_y, bt.size, line_y);
    line_X += bt.size/11;
    line_y += bt.size/11;

    circle_y = bt.size/22+bt.size/11;

    for (var i1 = 0; i1 < 10; i1++) {
      ellipse(circle_x, circle_y, bt.size/13.5);
      circle_y += bt.size/11;
    }
    circle_x += bt.size/11;

    text(top_letters.value, top_letters.x, top_letters.y);
    top_letters.value++;
    top_letters.x += bt.size/11;
    text(side_letters.value[i], side_letters.x, side_letters.y);
    side_letters.y += bt.size/11;

  }

  noLoop();

}

function draw() {

  let black = color(0);
  let red = color(255,0,0);
  let white = color(255);

  circle_y = bt.size/22+bt.size/11;
  circle_x = bt.size/22+bt.size/11;

  for (var i = 0; i < 10; i++) {
    circle_y = bt.size/22+bt.size/11;

    for (var i1 = 0; i1 < 10; i1++) {
      if (map[i1][i] == 1) {
        strokeWeight(bt.width);
        stroke(black);
        ellipse(circle_x, circle_y, bt.size/13.5);
      } else if (map[i1][i] == 0) {
        strokeWeight(bt.width*1.5);
        stroke(white);
        ellipse(circle_x, circle_y, bt.size/13.5);
        strokeWeight(bt.width);
        stroke(red);
        ellipse(circle_x, circle_y, bt.size/13.5);
      }
      circle_y += bt.size/11;
    }
    circle_x += bt.size/11;

  }
}

function mouseClicked(event) {

  console.log(`x:${floor(mouseX/(bt.size/11))}, y:${floor(mouseY/(bt.size/11))}`);
  if (floor(mouseY/(bt.size/11))-1 >= 0 && floor(mouseX/(bt.size/11))-1 >= 0) {
    if (map[floor(mouseY/(bt.size/11))-1][floor(mouseX/(bt.size/11))-1] == 1) {
      map[floor(mouseY/(bt.size/11))-1][floor(mouseX/(bt.size/11))-1] = 0;
    } else {
      map[floor(mouseY/(bt.size/11))-1][floor(mouseX/(bt.size/11))-1] = 1;
    }
  }


  redraw()

}

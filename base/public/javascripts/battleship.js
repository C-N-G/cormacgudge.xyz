$( document ).ready(function(){

  var socket = io('/battleship');

})

var map;

function setup() {
  let myCanvas = createCanvas(800, 800);
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

  strokeWeight(4);
  rect(0,0,800,800);

  let top_letters = {x: 800/22+800/11, y: 800/22, value: 1};
  let side_letters = {x: 800/22, y: 800/22+800/11, value: ['A','B','C','D','E','F','G','H','I','J']};

  let line_X = 800/11;
  let line_y = 800/11;
  let circle_y = 800/22+800/11;
  let circle_x = 800/22+800/11;

  textSize(55);
  textAlign(CENTER, CENTER);

  for (var i = 0; i < 10; i++) {
    line(line_X, 0, line_X, 800);
    line(0, line_y, 800, line_y);
    line_X += 800/11;
    line_y += 800/11;

    circle_y = 800/22+800/11;

    for (var i1 = 0; i1 < 10; i1++) {
      ellipse(circle_x, circle_y, 45);
      circle_y += 800/11;
    }
    circle_x += 800/11;

    text(top_letters.value, top_letters.x, top_letters.y);
    top_letters.value++;
    top_letters.x += 800/11;
    text(side_letters.value[i], side_letters.x, side_letters.y);
    side_letters.y += 800/11;

  }

  noLoop();

}

function draw() {

  let black = color(0);
  let red = color(255,0,0);
  let white = color(255);

  circle_y = 800/22+800/11;
  circle_x = 800/22+800/11;

  for (var i = 0; i < 10; i++) {
    circle_y = 800/22+800/11;

    for (var i1 = 0; i1 < 10; i1++) {
      if (map[i1][i] == 1) {
        strokeWeight(4);
        stroke(black);
        ellipse(circle_x, circle_y, 45);
      } else if (map[i1][i] == 0) {
        strokeWeight(6);
        stroke(white);
        ellipse(circle_x, circle_y, 45);
        strokeWeight(4);
        stroke(red);
        ellipse(circle_x, circle_y, 45);
      }
      circle_y += 800/11;
    }
    circle_x += 800/11;

  }
}

function mouseClicked(event) {

  console.log(`x:${floor(mouseX/(800/11))}, y:${floor(mouseY/(800/11))}`);
  if (floor(mouseY/(800/11))-1 >= 0 && floor(mouseX/(800/11))-1 >= 0) {
    if (map[floor(mouseY/(800/11))-1][floor(mouseX/(800/11))-1] == 1) {
      map[floor(mouseY/(800/11))-1][floor(mouseX/(800/11))-1] = 0;
    } else {
      map[floor(mouseY/(800/11))-1][floor(mouseX/(800/11))-1] = 1;
    }
  }


  redraw()

}

const { createCanvas, loadImage } = require('canvas')
const Discord = require('discord.js');
module.exports = {
  draw_piechart(values) {

    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext('2d');

    const w = canvas.width;
    const h = canvas.height;
    ctx.font = 'small-caps bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const colors = [
      '#eeff00', '#ff0000', '#ffaa00', '#40ff40', '#ff8c40', '#ffe680', '#ff9180', '#8091ff',
      '#a200f2', '#f20000', '#00e2f2', '#b6e6f2', '#e5397e', '#e673de', '#e6acbb', '#2db362',
      '#2d74b3', '#9e86b3', '#2929a6', '#99754d', '#668000', '#730000', '#6d7356', '#735656',
      '#1a5766', '#59163a', '#165943', '#220033', '#143300', '#331b00'
    ]

    let total = 0;
    for(var i = 0; i < values.length; i++) {
      total += values[i];
    }

    let start_angle = 0;
    let end_angle = 0;
    let bearing = 0;
    let adj = 0;
    let opp = 0;
    let hyp = w/3;
    let pos_x = 0;
    let pos_y = 0;
    for(var i = 0; i < values.length; i++) {

      end_angle = start_angle + (values[i]/total) * (2*Math.PI);
      ctx.beginPath();
      ctx.fillStyle = colors[i];
      ctx.moveTo(w/2, h/2);
      if (i !== values.length - 1) {
        // if this arc isn't thhe last one being drawn
        // then draw it slightly being to fix ugly lines between segments
        ctx.arc(w/2, h/2, w/2 - 10, start_angle, end_angle * 1.1);
      } else {
        // else this is the last arc being drawn
        // so don't draw it bigger as it will overlap the first arc
        ctx.arc(w/2, h/2, w/2 - 10, start_angle, end_angle);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'black';
      if (values[i]/total > 0.08 && values[i]/total < 1) {
        bearing = start_angle + ((end_angle - start_angle) / 2);
        adj = hyp*Math.cos(bearing);
        opp = hyp*Math.sin(bearing);
        pos_x = w/2 + adj;
        pos_y = w/2 + opp;
        ctx.fillText(values[i], pos_x, pos_y);
      } else if (values[i]/total === 1) {
        ctx.fillText(values[i], w/2, h/2);
      }

      start_angle += (values[i]/total) * (2*Math.PI);

    }

    return canvas.toBuffer();

  }

};

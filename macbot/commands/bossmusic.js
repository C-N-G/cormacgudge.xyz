const fs = require('fs');
const p = require('./play.js');
const util = require('../util/util.js');
module.exports = {
  name: 'bossmusic',
  aliases: ['bs'],
  description: 'Plays boss music',
  cooldown: 5,
  guildOnly: true,
  args: false,
  execute(message) {

    function load_boss_music() {

      try {
        let data = fs.readFileSync('./data/bossmusic.txt', 'utf8');
        data = data.split('\n');
        return data;
      } catch (error) {
        message.channel.send('Error loading file');
        console.error(error);
      }
      
    }

    function play_boss_music(data) {

      let track = util.random(data.length - 1);
      p.execute(message, [data[track]]);

    }

    let data = load_boss_music();
    play_boss_music(data);

    }
};

const p = require('./play.js');
const yts = require('yt-search');
const Discord = require('discord.js');
module.exports = {
  name: 'playsearch',
  aliases: ['plays', 'psearch', 'ps'],
  description: 'Plays a youtube video by searching and letting you pick from the results',
  usage: '<search query>',
  cooldown: 1,
  guildOnly: true,
  args: true,
  execute(message, args) {

    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

    async function get_search_results(query) {
      const results = await yts(query);
      const videos = results.videos.slice(0, 9);
      const embed = new Discord.MessageEmbed().setColor('AQUA').setTitle(`Search results for "${query}"`);
      videos.forEach((video, i) => {
        embed.addField(`${emojis[i]}\`\`\`${video.ago.padStart(17, ' ')}${video.timestamp.padStart(13, ' ')}\`\`\``, `[${video.title}](${video.url})`, false);
      });
      const videoIds = videos.map(video => video = video.videoId);
      let msg = await message.channel.send(embed);
      let iterator = 0;
      emojis.forEach(emoji => {
        msg.react(emoji)
        .then(() => {iterator++;});
      });

      const filter = (reaction, user) => user.id == message.author.id;
      msg.awaitReactions(filter, {max: 1, time: 30*1000})
      .then(collected => {

        if (collected.size > 0) {
          const chosenVideo = videoIds[emojis.indexOf(collected.first().emoji.name)];
          p.execute(message, [`https://www.youtube.com/watch?v=${chosenVideo}`]);
        }
        
        let timer = setInterval(() => { // wait for bot to finish reacting to messages before deleting 
          if (iterator == 9) {
            clearInterval(timer);
            msg.delete();
          }
        }, 2000);

      });
      
    }

    get_search_results(args.join(' '));

    }
};

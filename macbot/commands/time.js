const moment = require('moment-timezone');
const Discord = require('discord.js');
module.exports = {
  name: 'time',
  aliases: ['timezone', 'tz'],
  description: 'Converts a given time into various different timezones',
  usage: 'list | <timezone> <DD/MM/YYYY> <HH:MM>',
  cooldown: 5,
  guildOnly: false,
  args: true,
  execute(message, args) {

    function checkFormat(dateTime, timezone) {

      const regex = /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}\s[0-9]{1,2}:[0-9]{1,2})/;

      if (!moment(dateTime, 'DD/MM/YYYY HH:mm').isValid() 
      ||  !regex.test(dateTime))  {
        return message.channel.send('That is not a recognisible date/time format, please use DD/MM/YYYY HH:MM')
      }

      if (!Object.keys(timezones).find(ele => ele === timezone)) {
        return message.channel.send(`That is not a recognisible time-zone format, please use ${Object.keys(timezones).join(', ')}`)
      }

    }

    function sendResponse(dateTime, timezone) {

      const targetTime = moment.tz(dateTime, 'DD/MM/YYYY HH:mm',  timezone);

      const embed = new Discord.MessageEmbed().setTitle(targetTime.fromNow());
  
      for (const key in timezones) {
        if (timezones[key][0] === timezone) {
          embed.addField(`>${timezones[key][1]}<`, targetTime.tz(timezones[key][0]).format('DD/MM/YYYY HH:mm ddd'), false);
        } else {
          embed.addField(timezones[key][1], targetTime.tz(timezones[key][0]).format('DD/MM/YYYY HH:mm ddd'), false);
        }
        
      }
  
      message.channel.send(embed);

    }

    function listTimezones() {

      const embed = new Discord.MessageEmbed().setTitle('Available timezones');
  
      for (const key in timezones) {

        embed.addField(key, timezones[key][1], true);
        
      }

      message.channel.send(embed);

    }

    const timezones = {
      euw: ['Europe/London', 'Europe West (London)'],
      eue: ['Europe/Helsinki', 'Europe East (Helsinki)'],
      usw: ['America/Los_Angeles', 'America West (Los Angeles)'],
      use: ['America/New_York', 'America East (New York)'],
      asw: ['Asia/Dubai', 'Asia West (Dubai)'],
      ase: ['Asia/Tokyo', 'Asia East (Tokyo)']
    }

    if (args[0] === 'list') return listTimezones();

    let timezone = args.shift();
    const dateTime = args.join(' ');

    if (checkFormat(dateTime, timezone)) return;

    timezone = timezones[timezone][0];

    sendResponse(dateTime, timezone);

    }
};
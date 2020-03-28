const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./authentication.json');
const quotes = require('./quotes.json');

const fighting_words = [
  'fight me', 'fight', 'lets fight', 'come at me',
  'come at me bro', 'i hate you', 'this bot sucks',
  'lets duel', 'lets play', 'duel me'
];
const insults = [
  'your ancestors sneer upon you!',
  'you disappoint your entire family!',
  'for shame!', 'disgusting!',
  'despicable'
];
const commands = {
  channel: {
    voice: {make: 'make voice channel'},
    text: {make: 'make text channel'},
    delete: 'delete channel'
  },
  best_of: 'best of',
  give_role: 'role me',
}
const loss_cases = {
  timeout: 'taking too long',
  bad_move: 'not using an appropriate move'
} //You forfiet this match by XYZ
const moves = ['rock', 'paper', 'scissors'];
const states = {
  ready: 'ready',
  waiting: 'waiting'
};
const timeOutDelay = 1000*15
var start_timeout;
let state = states.ready;
let scores = {player: 0, bot: 0};
let current_match = {
  opponent: 0,
  objective: [],
  channel: 0,
  difficulty_length: 0,
  difficulty_height: 0,
  round: 0,
  score: {player: 0, bot: 0}
};
let bot_message = 0;


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function matchTimeOut() {
  endMatch('TIMEOUT');
}

function endMatch(outcome) {
  clearTimeout(start_timeout);
  let insult_choice = getRandomInt(insults.length);
  switch (outcome) {
    case 'PLAYER_WIN':
      scores.player++;
      verdict = 'win';
      if (current_match.objective[0]) { current_match.objective[0](); }
      if (current_match.objective[1]) { current_match.channel.send(current_match.objective[1]); }
      break;
    case 'BOT_WIN':
      scores.bot++;
      verdict = 'loss';
      break;
    case 'TIMEOUT':
      scores.bot++;
      verdict = 'loss';
      current_match.channel.send(`You forfeit this match by ${loss_cases.timeout}, ${insults[insult_choice]}`);
      break;
    case 'BAD_MOVE':
      scores.bot++;
      verdict = 'loss';
      current_match.channel.send(`You forfeit this match by ${loss_cases.bad_move}, ${insults[insult_choice]}`);
      break;
    default:
      verdict = 'tie';
  }
  current_match.channel.send(`Match Ended! Verdict is a ${verdict}. TOTAL SCORE: Players=${scores.player}, Bot=${scores.bot}`);
  current_match.opponent = 0;
  current_match.objective = [];
  current_match.channel = 0;
  current_match.difficulty_length = 0;
  current_match.difficulty_height = 0;
  current_match.round = 0;
  current_match.score.player = 0;
  current_match.score.bot = 0;
  state = states.ready;
}

function startMatch(objective, message) {
  current_match.opponent = message.author.tag; // make sure only the battle initiator can communicate with the bot during a battle
  current_match.channel = message.channel;
  switch (objective) {
    case 'NONE':
      current_match.difficulty_length = 1;
      current_match.difficulty_height = 0.5;
      break;
    case 'FIVE':
      current_match.difficulty_length = 5;
      current_match.difficulty_height = 0.5;
      break;
    case 'MAKE_CHANNEL':
      current_match.difficulty_length = 5;
      current_match.difficulty_height = 0.6;
      current_match.objective[2] = message.content.substr(19,16);
      current_match.objective[3] = message.content.split(" ")[1];
      current_match.objective[1] = `You have succeded in creating channel ${current_match.objective[2]}.`;
      current_match.objective[0] = function() {
        current_match.channel.guild.createChannel(current_match.objective[2], { type: current_match.objective[3] });
      };
    case commands.best_of:
      current_match.difficulty_length = message.content.slice(9);
      current_match.difficulty_height = 0.5;
      break;
    case commands.give_role:
      current_match.difficulty_length = 1;
      current_match.difficulty_height = 0.1;
      current_match.objective[2] = current_match.opponent;
      current_match.objective[3] = message.member;
      current_match.objective[1] = `You have been given your role`;
      current_match.objective[0] = function() {
        current_match.channel.guild.createRole({name:current_match.objective[2]})
        .then(role => console.log(`${role.id}   A${current_match.objective[2]}A`));
      //  .then(role => current_match.objective[3].addRole(role.id));
      };
    default:
  }
  message.reply(`Let's duel! Match length is ${current_match.difficulty_length} rounds. Required win rate is ${current_match.difficulty_height*100}%. Your move!`);
  state = states.waiting;
  start_timeout = setTimeout(matchTimeOut, timeOutDelay);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  message.content = message.content.toLowerCase();
//TODO Make regex match for setting objectives for the match

  switch (state) {
    case states.ready:
      if (message.content.startsWith('!')) {
        if (message.content === '!scores') {
          message.reply(`SCORE: Players=${scores.player}, Bot=${scores.bot}`);
        }
        else if (message.content.startsWith(`!${commands.channel.text.make}`) || message.content.startsWith(`!${commands.channel.voice.make}`)) {
          startMatch('MAKE_CHANNEL', message);
        }
        else if (message.content.startsWith(`!${commands.best_of} `) && !isNaN(message.content.slice(9))) {
          startMatch(commands.best_of, message);
        }
        else if (message.content === `!${commands.give_role}` && !message.guild.roles.find(role => role.name === message.author.tag)) {
          startMatch(commands.give_role, message);
        }
        else {
          for (var i = 0; i < fighting_words.length; i++) {
            if (message.content === '!' + fighting_words[i]) {
              startMatch('NONE', message);
              break;
            } else if (message.content === `!${fighting_words[i]} best of 5`) {
              startMatch('FIVE', message);
              break;
            }
          }
        }
      }
      break;
    case states.waiting:
      if (message.content[0] === '!' && current_match.opponent === message.author.tag && message.channel === current_match.channel) {
        let match_found = false;
        for (var i = 0; i < moves.length; i++) {
          if (message.content === '!' +  moves[i]) { // if user response matches a move then respond
            response_move = getRandomInt(3);
            //message.reply('I choose ' + moves[response_move]);
            bot_message = `I choose ${moves[response_move]}. `;
            if (i === 0 && response_move === 0) { bot_message += `YOU TIE!, Rock vs Rock. `; outcome = 0; } // show outcome and assign outcome value
            else if (i === 0 && response_move === 1) { bot_message += `YOU LOSE!, Rock vs Paper. `; outcome = 'BOT_WIN'; }
            else if (i === 0 && response_move === 2) { bot_message += `YOU WIN!, Rock vs Scissors. `; outcome = 'PLAYER_WIN'; }
            else if (i === 1 && response_move === 0) { bot_message += `YOU WIN!, Paper vs Rock. `; outcome = 'PLAYER_WIN'; }
            else if (i === 1 && response_move === 1) { bot_message += `YOU TIE!, Paper vs Paper. `; outcome = 0; }
            else if (i === 1 && response_move === 2) { bot_message += `YOU LOSE!, Paper vs Scissors. `; outcome = 'BOT_WIN'; }
            else if (i === 2 && response_move === 0) { bot_message += `YOU LOSE!, Scissors vs Rock. `; outcome = 'BOT_WIN'; }
            else if (i === 2 && response_move === 1) { bot_message += `YOU WIN!, Scissors vs Paper. `; outcome = 'PLAYER_WIN'; }
            else if (i === 2 && response_move === 2) { bot_message += `YOU TIE!, Scissors vs Scissors. `; outcome = 0; }
            if (current_match.round < current_match.difficulty_length) {
              clearTimeout(start_timeout);
              start_timeout = setTimeout(matchTimeOut, timeOutDelay);
              switch (outcome) {
                case 'PLAYER_WIN':
                  current_match.score.player++;
                  break;
                case 'BOT_WIN':
                  current_match.score.bot++;
                  break;
                default:
              }
              if (current_match.score.player / (current_match.score.player + current_match.score.bot) > current_match.difficulty_height) { outcome = 'PLAYER_WIN' }
              else if (current_match.score.player / (current_match.score.player + current_match.score.bot) < current_match.difficulty_height) { outcome = 'BOT_WIN' }
              else if (current_match.score.player = current_match.score.bot) { outcome = 0 }
              current_match.round++;
              bot_message += `Round ${current_match.round} over! Player=${current_match.score.player}, Bot=${current_match.score.bot}. `;
              if (current_match.round != current_match.difficulty_length) { bot_message += `Your move! `; }
              message.reply(bot_message);
              bot_message = 0;
              match_found = true;
            }
            if (current_match.round == current_match.difficulty_length) {
              endMatch(outcome);
            }
            break;
          }
        }
        if (state === states.waiting && match_found === false) {
          endMatch('BAD_MOVE');
        }
      }
      break;
  }

  if (message.content === '!channel') {
    message.channel.send('test');
    console.log(message.channel);
  }

  if (message.content === '!ping') {
    message.reply('pong');
  }

  if (message.content === '!what is my avatar' ) {
    message.reply(message.author.avatarURL);
  }

  // If the message is "how to embed"
  if (message.content === '!how to embed') {
    // We can create embeds using the MessageEmbed constructor
    // Read more about all that you can do with the constructor
    // over at https://discord.js.org/#/docs/main/stable/class/RichEmbed
    const embed = new Discord.RichEmbed()
      // Set the title of the field
      .setTitle('A slick little embed')
      // Set the color of the embed
      .setColor(0xFF0000)
      // Set the main content of the embed
      .setDescription('Hello, this is a slick embed!');
    // Send the embed to the same channel as the message
    message.channel.send(embed);
  }

  if (message.content === '!whq' ) { // main quote command
    let randUnit = getRandomInt(quotes.Units.length);
    let randQuote = getRandomInt(quotes[quotes.Units[randUnit]].length);
    message.channel.send(quotes.Units[randUnit] + ': ' + quotes[quotes.Units[randUnit]][randQuote]);
  }

  if (message.content === '!whq u' ) { // list units that have quotes
    let total = quotes.Units[0] + `\n`;
    for (var i = 1; i < quotes.Units.length; i++) {
      total += quotes.Units[i] + `\n`;
    }
    const embed = new Discord.RichEmbed()
      .setTitle('Quotes available from these units')
      .setColor(0xFF0000)
      .setDescription(total);
    message.channel.send(embed);
  }

  if (message.content === '!whq t' ) { // show total quotes
    let num = 0;
    for (var i = 0; i < quotes.Units.length; i++) {
      num += quotes[quotes.Units[i]].length;
    }
    message.channel.send("Total quotes available: " + num);
  }

  let pattQuote = /(!whq\s([A-z]+\s?)+\s(\d+|all))/;
  if (pattQuote.test(message.content)) { // show specific quote
    let search = message.content.split(" ");
    let upperSearch = "";
    let name = "";
    let num = search[search.length - 1];
    for (var i = 1; i < (search.length - 1); i++) {
      upperSearch = search[i].charAt(0).toUpperCase() + search[i].slice(1);
      name += upperSearch + " ";
    }
    name = name.trim();
    if (num == "all") {
      let quoteList = ''
      try {
        for (var i = 0; i < quotes[name].length; i++) {
          quoteList += (i+1) + ": " + quotes[name][i] + "\n";
        }
        const embed = new Discord.RichEmbed()
          .setTitle(name)
          .setColor(0xFF0000)
          .setDescription(quoteList.trim());
        message.channel.send(embed);
      } catch (e) {
        message.channel.send("That unit does not exist!");
      }
    } else {
      num -= 1; // make the quotes start at 1 for simplicity to the user
      try {
        if (quotes[name][num] != undefined) {
          message.channel.send(name + ': ' + quotes[name][num]);
        } else {
          message.channel.send("That quote does not exist!");
        }
      } catch (e) {
        message.channel.send("That unit does not exist!");
      }
    }
  }

});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.find(ch => ch.name === 'battlegrounds');
  // Do nothing if the channel wasn't found on this server
  if (!channel) return;
  // Send the message, mentioning the member
  channel.send(`Welcome to the server, ${member}`);
});

client.login(auth.token);

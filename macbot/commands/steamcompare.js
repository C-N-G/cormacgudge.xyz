const got = require('got');
const cheerio = require('cheerio');
const {steam_api_key} = require('../config.json');
const fs = require('fs').promises;
module.exports = {
  name: 'steamcompare',
  aliases: ['steamcomp', 'stcp'],
  description: 'Compares games between steam profiles',
  usage: '<steam profile/discord user> ...',
  cooldown: 5,
  guildOnly: true,
  args: true,
  execute(message, args) {

    async function getGamesList(steamID) {
      const url = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/';
      try {
        const body = await got(`${url}?key=${steam_api_key}&steamid=${steamID}&format=json&include_appinfo=1`).json();
        if (body) {
          return body.response.games.map(m => m = { 'appid':m.appid, 'name':m.name });
        } else {
          return false;
        }
      } catch (error) {
        console.log(error.body);
      }
    }

    async function compareProfiles(profileList) {

      //make a list for the same games
      //grab lists of games from pfiles using getGamesList
      let allGamesList = [];
      for (const steamID of profileList) {
        let gamesList = await getGamesList(steamID);
        if (!gamesList) {
          return message.channel.send('could not retrive games list from one or more ids');
        }
        allGamesList.push(gamesList);
      }


      //compare two prfiles and fill list with games that appear in both
      let sameGamesList = [];
      let appidList = allGamesList[1].map(g => g = g.appid);
      for (const game of allGamesList[0]) {
        if (appidList.includes(game.appid)) {
          sameGamesList.push(game);
        }
      }


      //for any other profile compare against list of same games
      if (allGamesList.length > 2) {
        for (let i = 2; i < allGamesList.length; i++) {
          appidList = allGamesList[i].map(g => g = g.appid);
          let tempList = [];
          for (const game of sameGamesList) {
            if (appidList.includes(game.appid)) {
              tempList.push(game);
            }
          }
          sameGamesList = tempList;
        }
      }


      //return list of games somehow
      await message.channel.send(`You have ${sameGamesList.length} games in common`);
      const returnString = sameGamesList.map(g => g = g.name).sort().join(', ');
      if (returnString.length > 6000) {
        return message.channel.send('Too many games in common cannot print games list');
      }
      for (let i = 0; i < returnString.length; i+=2000) {
        await message.channel.send(returnString.substring(i, i+2000));
      }

    }

    function getSteamIdFromURL(url) {
      return new Promise(async (resolve, reject) => {
        if (url.startsWith('https://steamcommunity.com/profiles/')) {
          resolve(url.split('/')[4]);
        }

        try {
          const response = await got(`${url}?xml=1`);
          const startIndex = response.body.search('<steamID64>') + 11;
          const endIndex = response.body.search('</steamID64>');
          const id = response.body.substring(startIndex, endIndex);
          if (!isNaN(id) && id.length === 17) {
            resolve(id);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.log(error.response.body);
          reject(error.response.body);
        }
      });
    }

    function loadProfiles(args) {
      return new Promise(async (resolve, reject) => {
        const profileList = [];
        const steamProfiles = JSON.parse(await fs.readFile('./data/steamprofiles.json', 'utf8'));

        //determine argument type e.g. steam link or discord mention or direct id
        for (const arg of args) { 
          let profileToAdd = '';
          if (arg.startsWith('https://steamcommunity.com')) { //steam url
            let id = await getSteamIdFromURL(arg).catch((error) => console.log(error));
            if (id === false) {
              return reject(message.channel.send('Could not find ID from URL'));
            } else {
              profileToAdd = id;
            }
          } else if (!isNaN(arg) && arg.length === 17) { // steam64id
            profileToAdd = arg;
          } else if (steamProfiles[arg.substring(3, 21)]) { //discord mention
            profileToAdd = steamProfiles[arg.substring(3, 21)].steamID;
          } else {
            return reject(message.channel.send('Could not find ID in one or more of the arguments provided'));
          }

          //discount duplicates
          if (!profileList.includes(profileToAdd)) {
            profileList.push(profileToAdd);
          }
        }

        //do not continue if there are less than two profiles
        if (profileList.length < 2) {
          reject(message.channel.send('You did not provide enough arguments'));
        } else {
          resolve(profileList);
        }
      });
    }

    loadProfiles(args)
    .then((profileList) => {
      compareProfiles(profileList);
    }).catch((error) => {
      console.log(error);
    });


    async function loadWebsite(url) {
      try {
        const response = await got(url);
        return response;
      } catch (error) {
        console.log(error.response.body);
      }
    }

    async function scrape(url) {
      const website = await loadWebsite(url);
      const $ = cheerio.load(website.body);
      console.log($('.apphub_AppName').text());
    }

    // scrape('https://store.steampowered.com/app/42960');
    
  }
};
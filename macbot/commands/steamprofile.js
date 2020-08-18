const fs = require('fs').promises;
module.exports = {
  name: 'steamprofile',
  aliases: ['steampro', 'stpr'],
  description: 'Provides functions for adding or removing cached ids for steamcompare',
  usage: '<steam profile link>',
  cooldown: 5,
  guildOnly: true,
  args: true,
  execute(message, args) {

    async function addid(profile, steamProfiles) {
      if (checkProfileExists(profile, steamProfiles)) {
        return message.channel.send('That discord ID is already in use');
      }
      steamProfiles[profile[0]] = { 'steamID':profile[1], 'name': profile[2] }
      saveSteamProfiles(steamProfiles)
    }

    function showids(steamProfiles) {
      let returnList = []
      for (const profile in steamProfiles) {
        returnList.push(`${profile} ${steamProfiles[profile].steamID} ${steamProfiles[profile].name}`)
      }
      return message.channel.send(`Cached Profiles \n\`\`\`${returnList.join('\n')}\`\`\``);
    }

    function updateid(profile, steamProfiles) {
      if (!checkProfileExists(profile, steamProfiles)) {
        return message.channel.send('Cannot find discord id to update');
      }
      steamProfiles[profile[0]] = { 'steamID':profile[1], 'name': profile[2] }
      saveSteamProfiles(steamProfiles)
    }

    function removeid(profile, steamProfiles) {
      if (!checkProfileExists(profile, steamProfiles)) {
        return message.channel.send('Cannot find discord id to remove');
      }
      delete steamProfiles[profile[0]]
      saveSteamProfiles(steamProfiles)
    }

    function checkProfileExists(profile, steamProfiles) {
      return steamProfiles.hasOwnProperty(profile[0])
    }

    function loadSteamProfiles() {
      return new Promise (async (resolve) => {
        try {
          resolve(JSON.parse(await fs.readFile('./data/steamprofiles.json', 'utf8')));
        } catch (error) {
          console.log(error)
          resolve({});
        }
      })
    }

    async function saveSteamProfiles(steamProfiles) {
      await fs.writeFile('./data/steamprofiles.json', JSON.stringify(steamProfiles))
      message.channel.send('profiles updated');
    }

    function formatInput(args) {
      let profile = ['discordID', 'steamID', 'name']
      let completeArguments = [0, 0, 0];
      for (const arg of args) {
        if (arg.startsWith('<@') && arg.length === 22 && completeArguments[0] === 0) {
          profile[0] = arg.substring(3, 21)
          completeArguments[0] = 1 
        } else if (!isNaN(arg) && arg.length === 17 && completeArguments[1] === 0) {
          profile[1] = arg
          completeArguments[1] = 1 
        } else if (isNaN(arg) && completeArguments[2] === 0) {
          profile[2] = arg 
          completeArguments[2] = 1 
        } else {
          return message.channel.send('Bad arguments');
        }
      }
      return profile
    }

    loadSteamProfiles().then((steamProfiles) => {

      if (args[0] === 'show') {
        if (Object.keys(steamProfiles).length === 0) {
          return message.channel.send('No cached profiles found');
        }
        return showids(steamProfiles);
      }
      
      if (!message.author.id === '150362891541938177') {
        return message.channel.send('You do not have permission to use this command, message <@!150362891541938177> if you would like your profile cached');
      }

      const flag = args[0];
      args.shift();
      const profile = formatInput(args);

      if (flag === 'add') {
        addid(profile, steamProfiles);
      } else if (flag === 'update') {
        updateid(profile, steamProfiles);
      } else if (flag === 'remove') {
        removeid(profile, steamProfiles);
      }
    })
    
  }
};
module.exports = {
  name: 'rolemenu',
  aliases: ['rmenu'],
  description: 'Command to make and modify role menus [ADMIN ONLY].',
  // usage: '[role type]',
  cooldown: 5,
  guildOnly: true,
  args: false,
  execute(message, args) {

    return message.channel.send('This command has been temporarily disabled');
    
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return;
    }

    const roles = message.guild.roles.cache.filter(role =>
      role.permissions.bitfield === 0
    )
    const roleMenuSizeLimit = 4; // 7 is normal
    // const emojis = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
    const emojisAdd = ['🔴','🔵','🟤','🟣','🟢','🟡','🟠'];
    const emojisRmv = ['🟥','🟦','🟫','🟪','🟩','🟨','🟧'];


    function create() {
      
      let role_list = roles.map(role => role = role.name);
      let amountOfPages = 1;
      if (role_list.length > roleMenuSizeLimit) {
        amountOfPages = Math.ceil(role_list.length / roleMenuSizeLimit);
      }

      for (let pageNum = 0; pageNum < amountOfPages; pageNum++) {
        let output = `__**ROLE MENU ${pageNum + 1}**__\nCircle to add, Square to remove.\n`;
        let page_roles = role_list.slice(pageNum * roleMenuSizeLimit, roleMenuSizeLimit + (pageNum * roleMenuSizeLimit));
        let rolesOnPage = page_roles.length;
        for (let roleNum = 0; roleNum < page_roles.length; roleNum++) {
          output += `${emojisAdd[roleNum]} ${emojisRmv[roleNum]} ${page_roles[roleNum]} [0]\n`;
        }
        
        message.channel.send(output)
        .then(async msg => {
          for (let role = 0; role < rolesOnPage; role++) {
            await msg.react(emojisAdd[role]);
            await msg.react(emojisRmv[role]);
          }
        });
      }
    }

    function update() {
      message.channel.messages.fetch({limit: 10})
      .then(messages => {
        const returned_roles = message.guild.roles.cache.filter(r => r.permissions.bitfield === 0)
        const returned_messages = messages.filter(m => m.author.id === m.client.user.id && m.content.startsWith('__**ROLE MENU')).array().reverse();
        let roleMenuList = '';
        for (const msg of returned_messages.map(m => m = m.content)) {
          // console.log(msg);
          roleMenuList += (msg.split('\n').slice(2))
        }
        roleMenuList = roleMenuList.split(',');

        //if more roles than in menu then add role to last page
        
        //if less roles than in menu then move end role to fill gap 
          //and remove emojis for it if from different page 
          //and move position of role to match position in menus
        //if role name is different than in menu then compare between list and messages and update accordingly
        //if role is rearrange then reorder roles accordingly
        console.log(returned_roles.map(r => r = r.name));
        console.log(roleMenuList);
        // console.log(returned_messages.map(m => m = m.content));

      }).catch(console.error)
    }

    if (args[0] === 'create') {
      create();
    } else if (args[0] === 'update') {
      update();
    } else if (args[0] === 'organise') {
      organise();
    }

    message.delete();

  }
};

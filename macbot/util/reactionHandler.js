module.exports = {
  async execute(reaction, user) {

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.log('Something went wrong when fetching the message: ', error)
        return;
      }
    }

    function find_member() {

      let roleString = message.content.split('\n')
      .find(ele => ele.includes(reaction.emoji.name));

      let numIndex = roleString.indexOf('[');

      roleString = roleString.substring(6, numIndex - 1);

      const member = reaction.message.guild.members.cache.find(member => member.id === user.id);

      return {member: member, roleString: roleString};
    }

    function check_emoji() {

      let roleString = message.content.split('\n').find(ele => ele.includes(reaction.emoji.name))

      if (!roleString) { // ignore emojis that don't correspond to a role
        return false;
      } else {
        return true;
      }
    }

    function make_new_message(amount, roleString) {
      const content = reaction.message.content;
      const startIndex = content.indexOf(roleString) + roleString.length + 2;
      const endIndex = content.indexOf(']', startIndex);
      const roleMenuNum = parseInt(content.substring(startIndex, endIndex)) + amount;
      const newMsg = content.substring(0,startIndex) + roleMenuNum + content.substring(endIndex);
      return newMsg
    }

    async function add_role(input) {

      const role = message.guild.roles.cache.find(role =>
        // role exists in the guild
        input.roleString === role.name
        // role has no permissions
        && role.permissions.bitfield === 0
        // user does not have the role
        && !input.member.roles.cache.some(role => role.name === input.roleString)
      );

      const userReactions = reaction.message.reactions.cache
      .filter(reaction => reaction.users.cache.has(user.id))
      try {
        if (role) {
          await reaction.message.edit(make_new_message(1, input.roleString));
          console.log('message update');
          await input.member.roles.add(role);
          console.log('role added');
        }
        for (const reaction of userReactions.values()) {
          await reaction.users.remove(user.id);
          console.log('reaction removed');
        }
      } catch (error) {
        console.log(error);
      }
      
    }

    async function remove_role(input) {

      const role = message.guild.roles.cache.find(role =>
        // role exists in the guild
        input.roleString === role.name
        // role has no permissions
        && role.permissions.bitfield === 0
        // user does have the role
        && input.member.roles.cache.some(role => role.name === input.roleString)
      );

      const userReactions = reaction.message.reactions.cache
      .filter(reaction => reaction.users.cache.has(user.id))
      try {
        if (role) {
          await reaction.message.edit(make_new_message(-1, input.roleString));
          console.log('message update');
          await input.member.roles.remove(role);
          console.log('role removed');
        }
        for (const reaction of userReactions.values()) {
          await reaction.users.remove(user.id);
          console.log('reaction removed');
        }
      } catch (error) {
        console.log(error);
      }

    }

    if (user.bot) return;

    const emojisAdd = ['🔴','🔵','🟤','🟣','🟢','🟡','🟠'];
    const emojisRmv = ['🟥','🟦','🟫','🟪','🟩','🟨','🟧'];
    const message = reaction.message;
    let timers = {};

    let action = '';
    if (emojisAdd.includes(reaction.emoji.name)) {
      action = 'ADD_ROLE';
    } else if (emojisRmv.includes(reaction.emoji.name)) {
      action = 'REMOVE_ROLE';
    }

    const input = check_emoji();
    if (message.content.startsWith('__**ROLE MENU') //role menu message
      && message.author.id === message.client.user.id //message from bot
      && check_emoji()) { //check if the reaction has a role

      const input = find_member();
      if (action === 'ADD_ROLE') {
        add_role(input);
      } else if (action === 'REMOVE_ROLE') {
        remove_role(input);
      }


    }


  }
};
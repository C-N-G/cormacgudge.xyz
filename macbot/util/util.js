module.exports = {
  convert_time (seconds) {
    if (seconds < 60) {
      return `${seconds}`;
    }

    let minutes = Math.floor(seconds/60);
    let returnSeconds = seconds - minutes*60;
    if (returnSeconds < 10) returnSeconds = '0' + returnSeconds;

    if (minutes < 60) {
      return `${minutes}:${returnSeconds}`;
    }

    let hours = Math.floor(seconds/60/60);
    minutes -= hours*60;
    if (minutes < 10) minutes = '0' + minutes;
    return `${hours}:${minutes}:${returnSeconds}`;
  },

  check_bot_location (message, location) {
    if (location === 'same-voice') {
      const voiceChannel = message.member.voice.channel;
      if (!message.guild.voice) {
        return false;
      }
      const botVoiceChannel = message.guild.voice.channel;
      if (!voiceChannel || voiceChannel !== botVoiceChannel) {
        return false;
      } else {
        return true;
      }
    } else if (location === 'in-voice') {
      if (!message.guild.voice) {
        return false;
      } else {
        return true;
      }
    }
  },

  sort(array) {
    /*
    takes in array of values
    sets the first array value as the smallest
    loops through the array and checks if any value is smaller than smallest
    if it is smaller then set the smallest to that values
    push the smallest value into the return array
    remove the smallest value from the input array
    set the smallest var to the first value of this new input array
    repeat until done
    */

    let values = [];
    let smallest = array[0];
    const loops = array.length;

    while (values.length < loops) {
      for(var i = 0; i < array.length; i++) {
        if (array[i] <= smallest) smallest = array[i];
      }
    values.push(smallest);
    array.splice(array.indexOf(smallest), 1);
    smallest = array[0];
    }

    return values;
  },

  random(input) {
    return Math.round(Math.random()*Math.round(input));
  },

  get_time() {
    const now = new Date();
    return `[${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}]`;
  }

};

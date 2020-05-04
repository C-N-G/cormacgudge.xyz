module.exports = {
  convert_time (seconds) {
    if (seconds < 60) {
      return `${seconds}`;
    }

    let minutes = Math.floor(seconds/60);
    let returnSeconds = seconds - minutes*60;
    if (returnSeconds <= 10) returnSeconds = '0' + returnSeconds;

    if (minutes < 60) {
      return `${minutes}:${returnSeconds}`;
    }

    let hours = Math.floor(seconds/60/60);
    minutes -= hours*60;
    if (minutes <= 10) minutes = '0' + minutes;
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
  }
};

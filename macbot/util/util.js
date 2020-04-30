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
  }


};

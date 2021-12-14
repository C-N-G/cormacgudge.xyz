exports.render = function(req, res) {
  res.render('baristassist', {
    meta_title: 'BaristAssist',
    meta_desc: 'Barista Ticketing System',
    meta_js: `/javascripts/baristassist.js?${Math.floor(Math.random()*9999999)}`,
    meta_css: '/stylesheets/baristassist.css'
  });
};
exports.index = function(io) {

  let ticketID = 0;
  let ticketCount = 0;
  let ticketQueue = [];

  function add_ticket(ticketName, ticketInfo) {
    ticketInfo = ticketInfo.split("&");

    ticketInfo.forEach((ele, index) => {
      if (ele.includes('=Custom')) {
        let property = ele.slice(0, -7);
        let customValue = ticketInfo[index + 1].split('=')[1].replaceAll('+', '-');
        ticketInfo[index] = `${property}=${customValue}`
      }
    });

    ticketInfo = ticketInfo.filter(ele => !ele.startsWith('Custom'))

    let ticketGroup = false;
    const groupIndex = ticketInfo.indexOf("Grouped=true")
    if (groupIndex != -1) {
      ticketGroup = ticketQueue[ticketQueue.length - 1].id;
      ticketInfo.splice(groupIndex, 1);
    }

    let ticketQuantity;
    const quantityIndex = ticketInfo.findIndex(ele => ele.startsWith("Quantity="))
    if (quantityIndex != -1) {
      ticketQuantity = ticketInfo[quantityIndex].slice(9);
      ticketInfo.splice(quantityIndex, 1);
    }

    ticketInfo = ticketInfo.map((ele) => {
      let temp = ele.split("=")
      // temp.push(temp[0])
      // temp.shift()
      // use to reverse word order
      return temp.join(" ")
    })
    if (!ticketGroup) {
      ticketID++;
      ticketCount++;
    }
    const ticket = {id: ticketID, name: ticketName, info: ticketInfo, group: ticketGroup, quantity: ticketQuantity, count:ticketCount};
    baristassist.emit("add_ticket", ticket);
    ticketQueue.push(ticket); // TODO add max size
  }

  function remove_ticket(ticket) {
    let index;
    while (index != -1) {
      index = ticketQueue.findIndex(ele => ele.id == ticket.id);
      if (index == -1) {
        break;
      }
      ticketQueue.splice(index, 1);
    }
    baristassist.emit("remove_ticket", ticket);
  }

  function show_notification(notification) {
    baristassist.emit("show_notification", notification);
  }

  function option(type) {
    switch (type) {
      case "resetOrderCount":
        ticketCount = 0;
        show_notification("Order count reset successfully");
        break;
    
      default:
        break;
    }
  }

  function main(socket) {
    console.log('USER HAS CONNECTED TO BARISASSIST');
    socket.emit('sync_ticket', ticketQueue);
    socket.on('add_ticket', add_ticket);
    socket.on('remove_ticket', remove_ticket);
    socket.on("option", option);
  }

  var baristassist = io
    .of('/baristassist')
    .on('connection', main);

}
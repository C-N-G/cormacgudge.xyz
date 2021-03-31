exports.render = function(req, res) {
  res.render('baristassist', {
    meta_title: 'BaristAssist',
    meta_desc: 'Barista Ticketing System',
    meta_js: '/javascripts/baristassist.js',
    meta_css: '/stylesheets/baristassist.css'
  });
};
exports.index = function(io) {

  let ticketID = 1;
  let ticketQueue = [];

  function add_ticket(ticketName, ticketInfo) {
    ticketInfo = ticketInfo.split("&");

    let ticketGroup = false;
    const groupIndex = ticketInfo.indexOf("Grouped=true")
    if (groupIndex != -1) {
      ticketGroup = ticketID - 1;
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
    const ticket = {id: ticketID, name: ticketName, info: ticketInfo, group: ticketGroup, quantity: ticketQuantity};
    baristassist.emit("add_ticket", ticket);
    ticketQueue.push(ticket); // TODO add max size
    if (!ticketGroup) {
      ticketID++;
    }
  }

  function remove_ticket(ticketID) {
    const index = ticketQueue.findIndex(ele => ele.id == ticketID);
    ticketQueue.splice(index, 1);
    baristassist.emit("remove_ticket", ticketID);
  }

  function main(socket) {
    console.log('USER HAS CONNECTED TO BARISASSIST');
    socket.emit('sync_ticket', ticketQueue);
    socket.on('add_ticket', add_ticket);
    socket.on('remove_ticket', remove_ticket);
  }

  var baristassist = io
    .of('/baristassist')
    .on('connection', main);

}
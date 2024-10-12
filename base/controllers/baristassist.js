exports.render = function(req, res) {
  res.render('baristassist', {
    meta_title: 'BaristAssist',
    meta_desc: 'Barista Ticketing System',
    meta_js: `/javascripts/baristassist.js?random=${Math.floor(Math.random()*9999999)}`,
    meta_css: `/stylesheets/baristassist.css?random=${Math.floor(Math.random()*9999999)}`
  });
};
exports.index = async function(io) {

  let sheet, todaySheet, updateTimer, lastOrder;
  let ticketCount = 1;
  let ticketQueue = [];
  let ticketHistory = [];
  let todayTotal = 0;

  /**
   * adds a ticket item to the system
   * @param {string} ticketName - the name of the ticket item
   * @param {Array} ticketInfo - the parameters of the ticket
   * @returns - if the operation was a success
   */
  function add_ticket(ticketName, ticketInfo) {

    // local vars
    let ticketGroup = false;
    let ticketQuantity, purchaser;

    // split the ticket info string into an array
    ticketInfo = ticketInfo.split("&");

    // handle custom values in the info string
    ticketInfo.forEach((ele, index) => {
      if (ele.includes('=Custom')) {
        let property = ele.slice(0, -7);
        let customValue = ticketInfo[index + 1].split('=')[1].replaceAll('+', '-');
        ticketInfo[index] = `${property}=${customValue}`;
      }
    });

    // remove the custom flag
    ticketInfo = ticketInfo.filter(ele => !ele.startsWith('Custom'));

    let thisTicketCount = ticketCount;

    // group handling if the ticket is part of a group
    const groupIndex = ticketInfo.indexOf("Grouped=true");
    if (groupIndex != -1) {
      // if the id of the group ticket doesn't exist anymore then don't add the ticket
      if (!ticketQueue[ticketQueue.length - 1]?.id) {
        return false;
      }
      const latestMasterTicket = find_latest_non_grouped_ticket();
      ticketGroup = latestMasterTicket.id;
      thisTicketCount = latestMasterTicket.count;
      ticketInfo.splice(groupIndex, 1);
    }

    // handle the ticket quantity
    const quantityIndex = ticketInfo.findIndex(ele => ele.startsWith("Quantity="));
    if (quantityIndex != -1) {
      ticketQuantity = ticketInfo[quantityIndex].slice(9);
      ticketInfo.splice(quantityIndex, 1);
    }

    // handle the ticket name
    const nameIndex = ticketInfo.findIndex(ele => ele.startsWith("Name="));
    if (nameIndex != -1) {
      purchaser = ticketInfo[nameIndex].slice(5);
      ticketInfo.splice(nameIndex, 1);
    }

    // update the ticket info to look presentable
    ticketInfo = ticketInfo.map((ele) => {
      let temp = ele.split("=");
      // temp.push(temp[0])
      // temp.shift()
      // use to reverse word order
      return temp.join(" ");
    });

    // increament counts if ticket isn't part of a group
    if (!ticketGroup) {
      ticketCount++;
    }

    // put it all together
    const ticket = {
      id: createTicketId(), // unique identifier for the ticket
      name: ticketName, // the name of the item on the ticket
      info: ticketInfo, // the options of the ticket
      groupId: ticketGroup, // the the id of the ticket for which this ticket belongs to if grouped
      quantity: ticketQuantity, // the quantity of the ticket
      count: thisTicketCount, // the count of the ticket, shown in the app sort of like the id
      purchaser: purchaser // the name of the person making the order
    };

    // update last order
    lastOrder = ticket;
    
    // send the ticket to all clients
    baristassist.emit("add_ticket", ticket);

    // add the ticket to the server queue
    ticketQueue.push(ticket); // TODO add max size

    // add the order to the spreadsheet
    if (process.env.npm_lifecycle_event !== "devstart") {
      const now = new Date().toLocaleString("en-IE").replace(",", "").split(" ");
      sheet.addRow({
        Date: now[0],
        Time: now[1],
        Quantity: ticketQuantity,
        Item: ticketName,
      });
    }

    // update the stats on the client
    update_total()

    return true;

  }

  function remove_ticket(ticket) {
    let quantity = 0 // so when removing grouped tickets the quantity is correctly updated in the active tickets
    const ticketsToRemove = ticketQueue.filter(ele => ele.id === ticket.id || ele.groupId === ticket.id || ele.id === ticket.groupId || (ele.groupId === ticket.groupId) && ele.groupId !== false);
    ticketsToRemove.forEach(ticket => {
      quantity += parseInt(ticket.quantity);
      ticketQueue = ticketQueue.filter(ele => ele.id !== ticket.id);
      if (ticketHistory.length >= 25) { 
        // bug related to group orders disappearing if they're cut in the middle
        ticketHistory.shift();
      }
      ticketHistory.push(ticket);
    })
    ticket.quantity = quantity;
    baristassist.emit("remove_ticket", ticket);
  }

  function edit_ticket(originalTicket, ticketInfo) {

    let targetTicket = ticketQueue.some(ticket => ticket?.id === originalTicket?.id);

    if (!targetTicket) return console.error("could not find target ticket to edit");

    // local vars
    let ticketQuantity, purchaser;

    // split the ticket info string into an array
    ticketInfo = ticketInfo.split("&");

    // handle custom values in the info string
    ticketInfo.forEach((ele, index) => {
      if (ele.includes('=Custom')) {
        let property = ele.slice(0, -7);
        let customValue = ticketInfo[index + 1].split('=')[1].replaceAll('+', '-');
        ticketInfo[index] = `${property}=${customValue}`;
      }
    });

    // remove the custom flag
    ticketInfo = ticketInfo.filter(ele => !ele.startsWith('Custom'));

    // handle the ticket quantity
    const quantityIndex = ticketInfo.findIndex(ele => ele.startsWith("Quantity="));
    if (quantityIndex != -1) {
      ticketQuantity = ticketInfo[quantityIndex].slice(9);
      ticketInfo.splice(quantityIndex, 1);
    }

    // handle the ticket name
    const nameIndex = ticketInfo.findIndex(ele => ele.startsWith("Name="));
    if (nameIndex != -1) {
      purchaser = ticketInfo[nameIndex].slice(5);
      ticketInfo.splice(nameIndex, 1);
    }

    // update the ticket info to look presentable
    ticketInfo = ticketInfo.map((ele) => {
      let temp = ele.split("=");
      return temp.join(" ");
    });

    // put it all together
    const ticket = {
      id: originalTicket.id, // unique identifier for the ticket
      name: originalTicket.name, // the name of the item on the ticket
      info: ticketInfo, // the options of the ticket
      groupId: originalTicket.groupId, // the the id of the ticket for which this ticket belongs to if grouped
      quantity: ticketQuantity, // the quantity of the ticket
      count: originalTicket.count, // the count of the ticket, shown in the app sort of like the id
      purchaser: purchaser // the name of the person making the order
    };

    // update the ticket in the server queue
    ticketQueue = ticketQueue.map(ticket => {
      if (ticket.id === originalTicket.id) {
        ticket.info = ticketInfo;
        ticket.quantity = ticketQuantity;
        ticket.purchaser = purchaser;
        return ticket;
      } else return ticket;
    })

    baristassist.emit("edit_ticket", ticket);

  }

  function show_notification(notification) {
    baristassist.emit("show_notification", notification);
  }

  function option(type) {
    switch (type) {
      case "resetOrderCount":
        ticketCount = 1;
        ticketQueue = [];
        show_notification("Order count reset successfully");
        break;
    
      default:
        break;
    }
  }

  function update_total() {

    async function make_update() {
      await todaySheet.loadCells("F26:F26");
      todayTotal = todaySheet.getCellByA1("F26").value;
      baristassist.emit("update_stats", todayTotal);
    }

    clearTimeout(updateTimer);
    updateTimer = setTimeout(make_update, 3*1000);

  }

  async function load_spreadsheet() {

      // load spreadsheet
        const { GoogleSpreadsheet } = require('google-spreadsheet');
        const { client_email, private_key } = require('../config.json');
        const doc = new GoogleSpreadsheet("1hT4ndFl-fzei3sGLo_YD_4SrGEhpNqo-aRq_yT27N8w");
        await doc.useServiceAccountAuth({
          client_email: client_email,
          private_key: private_key,
        });
        await doc.loadInfo();
  
        // load worksheet on spreadsheet
        const thisYear = String(new Date().getFullYear());
        sheet = doc.sheetsByTitle[thisYear];
        await sheet.setHeaderRow(["Date", "Time", "Quantity", "Item"]);
  
        todaySheet = doc.sheetsByTitle["Today"];
        await todaySheet.loadCells("F26:F26");
        todayTotal = todaySheet.getCellByA1("F26").value;

        update_total();
  
        // https://www.npmjs.com/package/google-spreadsheet
        // https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        // https://console.cloud.google.com/apis/api/sheets.googleapis.com/metrics?project=baristassist
  
        //sqlite also a possibility for a database


  }

  function find_latest_non_grouped_ticket() {

    let index = ticketQueue.length - 1;
    while (index >= 0) {
      if (ticketQueue[index].groupId === false) {
        return ticketQueue[index];
      }
      index--;
    }
    return false;

  }

  function main(socket) {

    console.log('USER HAS CONNECTED TO BARISTASSIST');

    socket.emit('sync_ticket', {ticketQueue: ticketQueue, lastOrder: lastOrder, ticketHistory: ticketHistory});
    socket.emit("update_stats", todayTotal);
    socket.on('add_ticket', add_ticket);
    socket.on('remove_ticket', remove_ticket);
    socket.on("edit_ticket", edit_ticket);
    socket.on("option", option);
    
    update_total()

  }

  function createTicketId(length = 16) {
    const array = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";
    const output = [];
    for (let i = 0; i < length; i++) {
        output.push(array[Math.floor(Math.random() * array.length)]);
    }
    return output.join("");
  }

  load_spreadsheet();

  var baristassist = io
    .of('/baristassist')
    .on('connection', main);

}
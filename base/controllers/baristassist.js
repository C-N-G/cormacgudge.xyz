exports.render = function(req, res) {
  res.render('baristassist', {
    meta_title: 'BaristAssist',
    meta_desc: 'Barista Ticketing System',
    meta_js: `/javascripts/baristassist.js?random=${Math.floor(Math.random()*9999999)}`,
    meta_css: `/stylesheets/baristassist.css?random=${Math.floor(Math.random()*9999999)}`
  });
};
exports.index = async function(io) {

  let sheet, todaySheet;
  let ticketID = 0;
  let ticketCount = 0;
  let ticketQueue = [];
  let todayTotal = 0;
  let updateTimer;

  /**
   * adds a ticket item to the system
   * @param {string} ticketName - the name of the ticket item
   * @param {string} ticketInfo - the parameters of the ticket
   * @returns - if the operation was a success
   */
  function add_ticket(ticketName, ticketInfo) {

    // local vars
    let ticketGroup = false;
    let ticketGroupCount = null;
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

    // group handling if the ticket is part of a group
    const groupIndex = ticketInfo.indexOf("Grouped=true");
    if (groupIndex != -1) {
      // if the id of the group ticket doesn't exist anymore then don't add the ticket
      if (!ticketQueue[ticketQueue.length - 1]?.id) return false;
      ticketGroup = ticketQueue[ticketQueue.length - 1].id;
      ticketInfo.splice(groupIndex, 1);
      //if a new order hasn't been made since rest
      //use the ID instead of the ticket count
      //since the id will be the ticket count of the last ticket
      if (ticketCount == 0) ticketGroupCount = ticketID;
      else ticketGroupCount = ticketCount;
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
      ticketID++;
      ticketCount++;
    }

    // put it all together
    const ticket = {
      id: ticketID, // unique identifier for the ticket
      name: ticketName, // the name of the item on the ticket
      info: ticketInfo, // the options of the ticket
      group: ticketGroup, // the the id of the ticket for which this ticket belongs to if grouped
      quantity: ticketQuantity, // the quantity of the ticket
      count: ticketCount, // the count of the ticket, shown in the app sort of like the id
      groupCount: ticketGroupCount, // the count of the ticket in the specific group
      purchaser: purchaser // the name of the person making the order
    };
    
    // send the ticket to all clients
    baristassist.emit("add_ticket", ticket);

    // add the ticket to the server queue
    ticketQueue.push(ticket); // TODO add max size

    // add the order to the spreadsheet
    const now = new Date().toLocaleString("en-IE").replace(",", "").split(" ");
    sheet.addRow({
      Date: now[0],
      Time: now[1],
      Quantity: ticketQuantity,
      Item: ticketName,
    });

    // update the stats on the client
    update_total()

    return true;

  }

  function remove_ticket(ticket) {
    let index;
    let quantity = 0 // so when removing grouped tickets the quantity is correctly updated in the active tickets
    while (index != -1) {
      index = ticketQueue.findIndex(ele => ele.id == ticket.id);
      if (index == -1) {
        break;
      }
      quantity += parseInt(ticketQueue[index].quantity);
      ticketQueue.splice(index, 1);
    }
    ticket.quantity = quantity;
    baristassist.emit("remove_ticket", ticket);
  }

  function show_notification(notification) {
    baristassist.emit("show_notification", notification);
  }

  function option(type) {
    switch (type) {
      case "resetOrderCount":
        ticketCount = 0;
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

  function main(socket) {

    console.log('USER HAS CONNECTED TO BARISTASSIST');

    socket.emit('sync_ticket', ticketQueue);
    socket.emit("update_stats", todayTotal);
    socket.on('add_ticket', add_ticket);
    socket.on('remove_ticket', remove_ticket);
    socket.on("option", option);
    
    update_total()

  }

  load_spreadsheet();

  var baristassist = io
    .of('/baristassist')
    .on('connection', main);

}
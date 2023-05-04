exports.render = function(req, res) {
  res.render('baristassist', {
    meta_title: 'BaristAssist',
    meta_desc: 'Barista Ticketing System',
    meta_js: `/javascripts/baristassist.js?random=${Math.floor(Math.random()*9999999)}`,
    meta_css: '/stylesheets/baristassist.css'
  });
};
exports.index = async function(io) {

  let sheet, todaySheet;
  let ticketID = 0;
  let ticketCount = 0;
  let ticketQueue = [];
  let todayTotal = 0;
  let updateTimer;

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
    let ticketGroupCount = null;
    const groupIndex = ticketInfo.indexOf("Grouped=true")
    if (groupIndex != -1) {
      ticketGroup = ticketQueue[ticketQueue.length - 1].id;
      ticketInfo.splice(groupIndex, 1);
      //if a new order hasn't been made since rest
      //use the ID instead of the ticket count
      //since the id will be the ticket count of the last ticket
      if (ticketCount == 0) ticketGroupCount = ticketID;
      else ticketGroupCount = ticketCount;
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
    const ticket = {
      id: ticketID, 
      name: ticketName, 
      info: ticketInfo, 
      group: ticketGroup, 
      quantity: ticketQuantity, 
      count: ticketCount, 
      groupCount: ticketGroupCount
    };
    baristassist.emit("add_ticket", ticket);
    ticketQueue.push(ticket); // TODO add max size

    const now = new Date().toLocaleString("en-IE").replace(",", "").split(" ");
    sheet.addRow({
      Date: now[0],
      Time: now[1],
      Quantity: ticketQuantity,
      Item: ticketName,
    });

    clearTimeout(updateTimer);
    updateTimer = setTimeout(update_total, 3*1000);

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
        show_notification("Order count reset successfully");
        break;
    
      default:
        break;
    }
  }

  async function update_total() {
    await todaySheet.loadCells("F26:F26");
    todayTotal = todaySheet.getCellByA1("F26").value;
    baristassist.emit("update_stats", todayTotal);
  }

  function load_spreadsheet() {
    return new Promise( async (resolve, reject) => {

      // load spreadsheet
      try {
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
        todaySheet.loadCells("F26:F26").then(() => {
          todayTotal = todaySheet.getCellByA1("F26").value;
        });
        
  
        // https://www.npmjs.com/package/google-spreadsheet
        // https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        // https://console.cloud.google.com/apis/api/sheets.googleapis.com/metrics?project=baristassist
  
        //sqlite also a possibility for a database

      } catch(error) {

        console.log(error);

      }

      if (todayTotal !== undefined) resolve();
      else reject();

    })
  }

  async function main(socket) {

    await load_spreadsheet();

    console.log('USER HAS CONNECTED TO BARISTASSIST');

    socket.emit('sync_ticket', ticketQueue);
    socket.emit("update_stats", todayTotal);
    socket.on('add_ticket', add_ticket);
    socket.on('remove_ticket', remove_ticket);
    socket.on("option", option);

  }

  var baristassist = io
    .of('/baristassist')
    .on('connection', main);

}
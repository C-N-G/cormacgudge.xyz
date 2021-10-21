$( document ).ready(function(){

  
  let socket = io('/baristassist');
  let items;
  let showingNotification = false;

  socket.on("add_ticket", add_ticket);
  socket.on("remove_ticket", remove_ticket);
  socket.on("sync_ticket", sync_ticket);
  socket.on("show_notification", show_notification);

  function render_config(item) {
    const ticketNumber = (ele) => ele.name == item;
    let ticketIndex = items.findIndex(ticketNumber);

    $('.config-list').append(`<h1 style="text-align: center; margin: 0;">${item}</h1>`)

    let custom = false;

    for (let property in items[ticketIndex].options) {
      let options = items[ticketIndex].options[property];
      $('.config-list').append(`<form><fieldset data-role="controlgroup" data-type="horizontal"><legend><strong>${property}:</strong></legend></fieldest></form>`)
      options.forEach((option, i) => {
        let check = false
        if (option.startsWith("DEF.")) {
          option = option.slice(4);
          check = true;
        }
        $(`<input type="radio" name="${property}" id="${property + i}" value="${option}" ${check ? `checked="checked"` : ""}><label for="${property + i}">${option}</label>`).appendTo(".config-list > form:last > fieldset")
        if (option === 'Custom') {
          custom = property + i;
          $('.config-list').append(`
          <form><fieldset id="field-${custom}" data-role="controlgroup" data-type="horizontal"></fieldest>
            <input type="text" name="Custom${item}${property}" id="Custom${item}${property}" value="" maxlength="10">
          </form>`)
          $(`#field-${custom}`).hide();
          $(`#${custom}`).parent().on("change", (event) => {
            if (event.target.value == 'Custom') {
              $(`#field-${custom}`).show();
            } else {
              $(`#field-${custom}`).hide();
            }
          });
        }
      });
    }

    $('.config-list').append(`
    <strong>Quantity:</strong>
    <form>
    <fieldset data-role="controlgroup" data-type="horizontal">
      <label for="Quantity"><strong>Quantity:</strong></label>
      <select name="Quantity" id="Quantity">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
      </select>
    </fieldset>
    <form>
    `)

    $('.config-list').append(`<button class="btn-order">Order</buitton>`)
    $('.config-list > .btn-order').on("click", function(){
      const ticketInfo = $("form").serialize();
      change_view("create");
      const ticketName = item;
      socket.emit("add_ticket", ticketName, ticketInfo);
    })

    if ($('.view-list').children().length) {
      $('.config-list').append(`<button class="btn-group-order">Group With Last Order</buitton>`)
      $('.config-list > .btn-group-order').on("click", function(){
        const ticketInfo = $("form").serialize() + "&Grouped=true";
        change_view("create");
        const ticketName = item;
        socket.emit("add_ticket", ticketName, ticketInfo);
      })
    }
    
    $(".config-list").trigger('create');

  }

  function render_ticket_types() {
    items = [
      {name: "Americano", price: 2, options: {
        Milk: ["Black", "DEF.Regular", "Skimmed", "Oat"],
        Strength: ["Weak", "DEF.Medium", "Strong"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"],
        Size: ["8oz", "DEF.12oz"]
      }},
      {name: "Cappuccino", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Strength: ["Weak", "DEF.Medium", "Strong"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"],
        Size: ["8oz", "DEF.12oz"]
      }},
      {name: "Flat-White", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Strength: ["Weak", "DEF.Medium", "Strong"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"]
      }},
      {name: "Latte", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Strength: ["Weak", "DEF.Medium", "Strong"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"]
      }},
      {name: "Macchiato", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Shots: ["DEF.Single", "Double"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"]
      }},
      {name: "Espresso", price: 2, options: {
        Shots: ["DEF.Single", "Double"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"]
      }},
      {name: "Cortado", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Shots: ["DEF.Single", "Double"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"]
      }},
      {name: "Hot-Chocolate", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Size: ["8oz", "DEF.12oz"],
        Age: ["DEF.Adult", "Child"]
      }},
      {name: "Chai-Latte", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Size: ["8oz", "DEF.12oz"],
        Chocolate: ["DEF.Yes", "No"]
      }},
      {name: "Babyccino", price: 2, options: {
        Chocolate: ["DEF.Yes", "No"]
      }},
      {name: "Mocha", price: 2, options: {
        Milk: ["DEF.Regular", "Skimmed", "Oat"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"],
        Size: ["8oz", "DEF.12oz"]
      }},
      {name: "Tea", price: 2, options: {
        Type: ["DEF.Regular", "Custom"],
        Bag: ["DEF.In", "Out"],
        Milk: ["DEF.Regular", "Skimmed", "Oat", "None"],
        Sugar: ["DEF.0", "1", "2", "3", "4", "5"],
        Size: ["8oz", "DEF.12oz"]
      }},
    ]
    items.forEach((item, i) => {
      let column;
      if (i%2 == 1) {
        column = "ui-block-b";
      } else {
        column ="ui-block-a";
      }
      $('.order-list').append(`<div class="${column}"><button class="btn-add-ticket">${item.name}</button></div>`)
    });
  }

  function change_view(target) {
    $('.ui-header > .ui-icon-arrow-l').show();
    $('.ui-header > .ui-icon-delete').hide();
    $('#viewport').children().hide(); // hide all menus
    $('.config-list').children().remove();
    switch (target) {
      case 'create':
        $('.ui-header > h1').text("Create Ticket");
        $('.order-menu').show();
        break;
      case 'view':
        $('.ui-header > h1').text("View Tickets");
        $('.view-menu').show();
        break;
      case 'menu':
        $('.ui-header > h1').text("BaristAssist");
        $('.ui-header > .ui-icon-arrow-l').hide();
        $('.menu').show();
        break;
      case 'config':
        $('.ui-header > .ui-icon-delete').show();
        $('.config-menu').show();
        break;
      case 'option':
        $('.ui-header > h1').text("Options");
        $('.option-menu').show();
        break;
      default:
        break;
    }
  }

  function add_ticket(ticket) {
    let height = ticket.info.length > 3 ? ticket.info.length * 1.3 : 3 * 1.3;
    if (ticket.group) {
      const subOrders = $(`.view-list > #ticket${ticket.group}`).children().length / 2
      $(`.view-list > #ticket${ticket.group}`).append(`
        <div class="ui-block-a">
          <div class="ui-bar ui-bar-a" style="height:${height}em;text-align-last: justify">
            ${ticket.name}<br>
            Quantity #${ticket.quantity}<br>
            #${ticket.group}.${subOrders}
          </div>
        </div>
        <div class="ui-block-b">
          <div class="ui-bar ui-bar-a" style="height:${height}em;text-align-last: justify">
            ${ticket.info.join("<br>")}
          </div>
        </div>
    `) 
    } else {
      $('.view-list').prepend(`
        <div id="ticket${ticket.id}" class="ui-grid-a" style="margin-bottom:1em;touch-action:manipulation;position:relative">
          <div class="ui-block-a">
            <div class="ui-bar ui-bar-a" style="height:${height}em;text-align-last: justify">
              ${ticket.name}<br>
              Quantity #${ticket.quantity}<br>
              #${ticket.count}
            </div>
          </div>
          <div class="ui-block-b">
            <div class="ui-bar ui-bar-a" style="height:${height}em;text-align-last: justify">
              ${ticket.info.join("<br>")}
            </div>
          </div>
        </div>
      `)
      $(`#ticket${ticket.id}`).on("swiperight", function(event) {
        socket.emit("remove_ticket", ticket);
      })
    }
    $(".view-list").trigger('create');
  }

  function remove_ticket(ticket) {
    $(`#ticket${ticket.id}`).animate({left: "200vw"}, 400, function() {
      $(this).remove();
    });
  }

  function sync_ticket(ticketQueue) {
    $('.view-list').children().remove();
    ticketQueue.forEach(ticket => {
      add_ticket(ticket);
    });
  }

  function show_notification(notification) {

    if (showingNotification) {
      return;
    }
    showingNotification = true;
    $(".ui-header").prepend(`
    <div style="
    background-color: rgba(150,150,150,0.8);
    z-index: 1;
    text-shadow: none;
    color: black;
    padding-top: 0.5em;
    position: fixed;
    text-align: center;
    left: 50vw;
    top: 100vh;
    width: 100vw;
    height: 10vh;
    margin-left: -50vw;" id="popupNotification">
      <p>${notification}</p>
    </div>
    `);
    $("#popupNotification").animate({
      top:"-=10vh"
    }, 250, function() {
      setTimeout(() => {
        $("#popupNotification").animate({
          top:"+=10vh"
        }, 150, function() {
          $("#popupNotification").remove();
          showingNotification = false;
        })
      }, 1500);
    });

  }

  render_ticket_types();
  change_view("menu");

  $('#createBtn').on("click", function(){
    change_view('create')
  });

  $('#viewBtn').on("click", function(){
    change_view('view')
  });
  
  $('#menuBtn').on("click", function(){
    change_view('menu')
  });

  $('#optionBtn').on("click", function(){
    change_view('option')
  });

  $('#resetOrderCount').on("click", function(){
    socket.emit("option", "resetOrderCount");
  });

  $('#cancelBtn').on("click", function(){
    change_view('create')
  });

  $('.btn-add-ticket').on("click", function(){
    change_view("config");
    let ticket = $(this).text();
    render_config(ticket);
  });

  

});
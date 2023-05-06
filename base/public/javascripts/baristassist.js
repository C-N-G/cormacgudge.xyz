$( document ).ready(main);

let socket, items, showingNotification, currentTheme, theme, activeOrders, connected;

/**
 * 
 * @param {string} item - name of the item to render
 * @param {object} ticket - if edting a ticket this will be the ticket data object
 */
function render_config(item, ticket) {
  const ticketNumber = (ele) => ele.name == item;
  let ticketIndex = items.findIndex(ticketNumber);

  $('.config-list').append(`<h1 style="text-align: center; margin: 0;">${item}</h1>`)

  let custom = false;
  let itemOptions = items[ticketIndex].options

  if (ticket) {
    // TODO config with ticket options for editing
  }

  for (let property in itemOptions) {
    let options = itemOptions[property];
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
    {name: "Espresso", price: 2, options: {
      Shots: ["DEF.Single", "Double"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
    }},
    {name: "Macchiato", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Shots: ["DEF.Single", "Double"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
    }},
    {name: "Americano", price: 2, options: {
      Milk: ["Black", "DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Cappuccino", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Latte", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
    }},
    {name: "Flat-White", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
    }},
    {name: "Mocha", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Cortado", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Shots: ["DEF.Single", "Double"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
    }},
    {name: "Hot-Chocolate", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Age: ["DEF.Adult", "Child"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Chai-Latte", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Chocolate: ["DEF.Yes", "No"],
      Cinnamon: ["Yes", "DEF.No"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Dirty-Chai", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
      Chocolate: ["DEF.Yes", "No"],
      Cinnamon: ["Yes", "DEF.No"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Tea", price: 2, options: {
      Type: ["DEF.Regular", "Custom"],
      Bag: ["DEF.In", "Out"],
      Milk: ["DEF.Regular", "Skimmed", "Oat", "None"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Size: ["8oz", "DEF.12oz"],
    }},
    {name: "Babyccino", price: 2, options: {
      Chocolate: ["DEF.Yes", "No"],
      Milk: ["DEF.Regular", "Oat"],
    }},
    {name: "Iced-Coffee", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Strength: ["Weak", "DEF.Medium", "Strong", "Decaf"],
      Sugar: ["DEF.0", "0.5", "1", "2", "3", "4", "5"],
      Syrup: ["DEF.None", "Hazelnut", "Vanilla", "Caramel"],
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
      $('#activeBtn').hide();
      $('#activeBtn').show();
      $('.ui-header > h1').text("View Tickets");
      $('.view-menu').show();
      break;
    case 'menu':
      $('.ui-header > h1').text("BaristAssist");
      $('.ui-header > .ui-icon-arrow-l').hide();
      $('.menu').show();
      break;
    case 'config':
      $('.ui-header > .ui-icon-arrow-l').hide();
      $('.ui-header > .ui-icon-delete').show();
      $('.config-menu').show();
      break;
    case 'option':
      $('.ui-header > h1').text("Options");
      $('.option-menu').show();
      break;
    case 'stat':
      $('.ui-header > h1').text("Stats");
      $('.stat-menu').show();
      break;
    default:
      break;
  }
}

function add_ticket(ticket) {
  let height = ticket.info.length > 3 ? ticket.info.length * 1.3 : 3 * 1.3;
  activeOrders += parseInt(ticket.quantity);
  $('#activeBtn').text(activeOrders);
  if (ticket.group) {
    const subOrders = $(`.view-list > #ticket${ticket.group}`).children().length / 2
    $(`.view-list > #ticket${ticket.group}`).append(`
      <div class="ui-block-a">
        <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
          ${ticket.name}<br>
          Quantity #${ticket.quantity}<br>
          #${ticket.groupCount}.${subOrders}
        </div>
      </div>
      <div class="ui-block-b">
        <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
          ${ticket.info.join("<br>")}
        </div>
      </div>
  `) 
  } else {
    $('.view-list').prepend(`
      <div id="ticket${ticket.id}" class="ui-grid-a" style="margin-bottom:1em;touch-action:manipulation;position:relative">
        <div class="ui-block-a">
          <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
            ${ticket.name}<br>
            Quantity #${ticket.quantity}<br>
            #${ticket.count}
          </div>
        </div>
        <div class="ui-block-b">
          <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
            ${ticket.info.join("<br>")}
          </div>
        </div>
      </div>
    `)
    $(`#ticket${ticket.id}`).on("swiperight", function(event) {
      socket.emit("remove_ticket", ticket);
    })
    // TODO edit tickets
    // $(`#ticket${ticket.id}`).on("swipeleft", function(event) {
    //   change_view("config");
    //   render_config(ticket.name, ticket);
    // })
  }
  $(".view-list").trigger('create');
}

function remove_ticket(ticket) {
  activeOrders -= parseInt(ticket.quantity);
  $('#activeBtn').text(activeOrders);
  $(`#ticket${ticket.id}`).animate({left: "200vw"}, 400, function() {
    $(this).remove();
  });
}

function sync_ticket(ticketQueue) {
  $('.view-list').children().remove();
  activeOrders = 0;
  $('#activeBtn').text(activeOrders);
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
  position: fixed;
  text-align: center;
  left: -100vw;
  top: 45vh;
  width: 90vw;
  border-radius: .3123em; " id="popupNotification">
    <p>${notification}</p>
  </div>
  `);
  $("#popupNotification").animate({
    left:"+=105vw"
  }, 250, function() {
    setTimeout(() => {
      $("#popupNotification").animate({
        left:"+=100vw"
      }, 150, function() {
        $("#popupNotification").remove();
        showingNotification = false;
      })
    }, 1250);
  });

}

function update_stats(stats) {
  $("#statBtn").text("Total Today: " + stats);
}

function seasonal_changes() {
  let now = new Date()
  if (now.getMonth() == 11 && now.getDate() >= 20 && now.getDate() <= 29) {
    $('.subheading').text("Happy Christmas");
  } else if (now.getMonth() == 11 && now.getDate() >= 30) {
    $('.subheading').text("Happy New Year");
  } else if (now.getMonth() == 0 && now.getDate() <= 3) {
    $('.subheading').text("Happy New Year");
  } else {
    $('.subheading').remove();
  }
}

function change_theme() {

  let target_theme = theme == "a" ? "b" : "a";
  theme = target_theme;
  localStorage.setItem("theme", target_theme);

  set_theme(target_theme);

}

function set_theme (target_theme) {
  $(".ui-mobile-viewport")
    .removeClass("ui-overlay-a ui-overlay-b")
    .addClass("ui-overlay-" + target_theme);

  $(".ui-mobile-viewport")
    .find(".ui-page")
    .removeClass("ui-page-theme-a ui-page-theme-b")
    .addClass("ui-page-theme-" + target_theme);

  $(".ui-mobile-viewport")
    .find(".ui-content")
    .removeClass("ui-page-theme-a ui-page-theme-b")
    .addClass("ui-page-theme-" + target_theme);

  $(".ui-mobile-viewport")
    .find(".ui-header")
    .removeClass("ui-bar-a ui-bar-b")
    .addClass("ui-bar-" + target_theme);
  
  $(".ui-mobile-viewport")
    .find(".ui-btn")
    .removeClass("ui-btn-a ui-btn-b")
    .addClass("ui-btn-" + target_theme);

  $(".ui-mobile-viewport")
    .find(".ui-bar")
    .removeClass("ui-bar-a ui-bar-b")
    .addClass("ui-bar-" + target_theme);
}

function add_button_events() {
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

  $('#statBtn').on("click", function(){
    change_view('stat')
  });

  $('#activeBtn').on("click", function(){
    change_view('view')
  });

  $('#resetOrderCount').on("click", function(){
    socket.emit("option", "resetOrderCount");
  });

  $('#darkModeToggle').on("click", function(){
    change_theme();
  });

  $('#cancelBtn').on("click", function(){
    change_view('create')
  });

  $('.btn-add-ticket').on("click", function(){
    change_view("config");
    let ticket = $(this).text();
    render_config(ticket);
  });
}

function check_connection() {
  connected = socket.connected;
  if (connected === false) {
    show_notification("CONNECTION ERROR");
    $('.ui-header > h1').css("color", "red");
  } else {
    $('.ui-header > h1').css("color", "white");
  }
}

function main() {

  socket = io('/baristassist');
  showingNotification = false;
  currentTheme = localStorage.getItem("theme");
  theme = currentTheme ? currentTheme : "a";
  activeOrders = 0;
  connected = socket.connected;

  socket.on("add_ticket", add_ticket);
  socket.on("remove_ticket", remove_ticket);
  socket.on("sync_ticket", sync_ticket);
  socket.on("show_notification", show_notification);
  socket.on("update_stats", update_stats);
  socket.on("connect_error", check_connection);
  socket.on("connect", check_connection);

  seasonal_changes();
  render_ticket_types();
  add_button_events();
  change_view("menu");

  $(document).on("pagecreate", function() {
    if (theme == "b") {
      set_theme(theme);
    }
  })
  
};
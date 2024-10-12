let socket, items, showingNotification, currentTheme, theme, activeOrders, connected, lastOrder;

/**
 * 
 * @param {string} item - name of the item to render
 * @param {object} ticket - if edting a ticket this will be the ticket data object
 */
function render_config(item, ticket) {

  const ticketNumber = (ele) => ele.name == item;
  let ticketIndex = items.findIndex(ticketNumber);
  let custom = false;
  let itemOptions = items[ticketIndex].options;
  
  let newOptions = {};
  if (ticket) {
    ticket.info.forEach(option => {
      const [itemName, itemProperty] = option.split(" ");
      newOptions[itemName] = itemProperty;
    })
  }
  
  $('.config-list').append(`<form id="ticket-form"></form>`);

  const ticketString = ticket ? `Editing ${ticket.name} #${ticket.count}` : `${item} #${get_order_id()}`;
  $('#ticket-form').append(`<h1 id="ticket-name" style="text-align: center; margin: 0;">${ticketString}</h1>`);

  for (let property in itemOptions) {
    const options = itemOptions[property];
    const optionsWithoutDefaults = options.map(opt => opt.startsWith("DEF.") ? opt.slice(4) : opt);
    $('#ticket-form').append(`<fieldset data-role="controlgroup" data-type="horizontal"><legend><strong>${property}:</strong></legend></fieldest>`);
    options.forEach((option, i) => {
      let check = false; // set if the option should be checked or not

      // handle the default param, setting checked state if found
      if (option.startsWith("DEF.")) {
        option = option.slice(4);
        check = ticket ? false : true; // do not make it checked if editing a ticket
      }

      // handle checked state if editing a ticket
      if (ticket && newOptions[property] === option) check = true; // use ticket selected options if present
      // handled checked state when editing ticket with custom field
      else if (ticket && optionsWithoutDefaults.includes(newOptions[property]) === false && option === "Custom") check = true; 

      // add input option
      $(`
        <input 
          type="radio" 
          name="${property}" 
          id="${property + i}" 
          value="${option}" 
          ${check ? `checked="checked"` : ""}
        />
        <label for="${property + i}">
          ${option}
        </label>
      `).appendTo("#ticket-form > fieldset:last")

      // handle custom field
      if (option === 'Custom') {
        custom = property + i;
        $('#ticket-form').append(`
        <fieldset id="field-${custom}" data-role="controlgroup" data-type="horizontal">
          <input type="text" name="Custom${item}${property}" id="Custom${item}${property}" value="${ticket ? newOptions[property] : ""}" maxlength="10">
        </fieldest>`)
        // hide if not editing a ticket and this field isn't checked
        if ((ticket && check) !== true) $(`#field-${custom}`).hide();
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

  // handle quantity section of form
  $('#ticket-form').append(`
  <fieldset data-role="controlgroup" data-type="horizontal">
    <legend><strong>Quantity:</strong></legend>
    <label for="Quantity"><strong>Quantity:</strong></label>
    <select name="Quantity" id="Quantity">
      <option value="1" ${ticket && ticket.quantity === "1" ? "selected" : ""}>1</option>
      <option value="2" ${ticket && ticket.quantity === "2" ? "selected" : ""}>2</option>
      <option value="3" ${ticket && ticket.quantity === "3" ? "selected" : ""}>3</option>
      <option value="4" ${ticket && ticket.quantity === "4" ? "selected" : ""}>4</option>
      <option value="5" ${ticket && ticket.quantity === "5" ? "selected" : ""}>5</option>
      <option value="6" ${ticket && ticket.quantity === "6" ? "selected" : ""}>6</option>
      <option value="7" ${ticket && ticket.quantity === "7" ? "selected" : ""}>7</option>
    </select>
  </fieldset>
  `)

  // handle name section of form
  $('#ticket-form').append(`
  <fieldset data-role="controlgroup" data-type="horizontal">
    <legend><strong>Name:</strong></legend>
    <label for="Name">Name:</label>
    <input type="text" name="Name" id="Name" value="${ticket && ticket.purchaser !== "" ? ticket.purchaser : ""}" placeholder="Optional" maxlength="10">
  </fieldset>
  `)

  if (!ticket) {
    $('#ticket-form').append(`<button class="btn-order">Order</buitton>`)
    $('#ticket-form > .btn-order').on("click", function(e){
      e.preventDefault();
      const ticketInfo = $("#ticket-form").serialize();
      change_view("create");
      const ticketName = item;
      socket.emit("add_ticket", ticketName, ticketInfo);
    })
  
    if ($('.view-list').children().length) {
      $('#ticket-form').append(`<button class="btn-group-order">Group With Last Order</buitton>`)
      $('#ticket-form > .btn-group-order').on("click", function(e){
        e.preventDefault();
        const ticketInfo = $("#ticket-form").serialize() + "&Grouped=true";
        change_view("create");
        history.back();
        const ticketName = item;
        socket.emit("add_ticket", ticketName, ticketInfo);
      })
    }
  } else if (ticket) {
    $('#ticket-form').append(`<button class="btn-order">Update</buitton>`)
    $('#ticket-form > .btn-order').on("click", function(e){
      e.preventDefault();
      const ticketInfo = $("#ticket-form").serialize();
      change_view("view");
      history.back();
      socket.emit("edit_ticket", ticket, ticketInfo);
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
    {name: "Matcha-Latte", price: 2, options: {
      Milk: ["DEF.Regular", "Skimmed", "Oat"],
      Size: ["8oz", "DEF.12oz"],
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
  $('.ui-header > #menuBtn').show();
  $('.ui-header > #cancelBtn').hide();
  $('.ui-header > #cancelEditBtn').hide();
  $('#viewport').children().hide(); // hide all menus
  $('.config-list').children().remove();
  switch (target) {
    case 'create':
      $('.ui-header > h1').text("Create Ticket");
      $('.order-menu').show();
      break;
    case 'edit':
      $('.ui-header > h1').text("Edit Ticket");
      $('.ui-header > #menuBtn').hide();
      $('.ui-header > #cancelEditBtn').show();
      $('.config-menu').show();
      break;
    case 'view':
      $('#activeBtn').hide();
      $('#activeBtn').show();
      $('.ui-header > h1').text("Pending Tickets");
      $('.view-menu').show();
      break;
    case 'config':
      $('.ui-header > #menuBtn').hide();
      $('.ui-header > #cancelBtn').show();
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
    case 'completed':
      $('.ui-header > h1').text("Completed Tickets");
      $('.completed-menu').show();
      break;
    case 'menu': // because the history stage seemingly couldn't be changed on page load
    default:
      $('.ui-header > h1').text("BaristAssist");
      $('.ui-header > #menuBtn').hide();
      $('.menu').show();
      break;
  }
}

function add_ticket(ticket) {

  update_last_order(ticket)
  
  const height = ticket.info.length > 3 ? ticket.info.length * 1.3 : 3 * 1.3;

  activeOrders += parseInt(ticket.quantity);
  $('#activeBtn').text(activeOrders);

  const subOrders = ticket.groupId ? $(`.view-list > div[data-group-id='${ticket.groupId}']`) : null;
  const subOrderTargetId = subOrders && subOrders.length > 0 ? subOrders[subOrders.length - 1].id : "ticket" + ticket.groupId;
  const subOrderNum = subOrders ? subOrders.length + 1 : 1;
  const displayCount = ticket.groupId ? ticket.count + "." + subOrderNum : ticket.count;

  const ticketHTML = `
    <div class="ui-block-a">
      <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
        ${ticket.name}<br>
        Quantity #${ticket.quantity}<br>
        #${displayCount} ${ticket.purchaser}
      </div>
    </div>
    <div class="ui-block-b">
      <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
        ${ticket.info.join("<br>")}
      </div>
    </div>
  `;

  if (ticket.groupId) {
    $(`.view-list > #${subOrderTargetId}`).after(`
      <div id="ticket${ticket.id}" data-group-id="${ticket.groupId}" data-ticket='${JSON.stringify(ticket)}' class="ui-grid-a" style="margin-top:-1em;margin-bottom:1em;touch-action:manipulation;position:relative">
        ${ticketHTML}
      </div>
    `);
  } else {
    $('.view-list').prepend(`
      <div id="ticket${ticket.id}" data-ticket='${JSON.stringify(ticket)}' class="ui-grid-a" style="margin-bottom:1em;touch-action:manipulation;position:relative">
        ${ticketHTML}
      </div>
    `);
  }

  $(`#ticket${ticket.id}`).on("swiperight", () => {
    socket.emit("remove_ticket", ticket);
  })

  $(`#ticket${ticket.id}`).on("swipeleft", function(event) {
    change_view("edit");
    ticket.count = displayCount;
    render_config(ticket.name, ticket);
    history.pushState({page: "create"}, "");
  })


  $(".view-list").trigger('create');
}

function add_ticket_to_completed(ticket) {
  const height = ticket.info.length > 4 ? ticket.info.length * 1.3 : 4 * 1.3;
  const currentTime = new Date();
  const timeString = `${currentTime.toTimeString().split(" ")[0].slice(0, -3)}`

  const subOrders = ticket.groupId ? $(`.completed-list > div[data-group-id='${ticket.groupId}']`) : null;
  const subOrderTargetId = subOrders && subOrders.length > 0 ? subOrders[subOrders.length - 1].id : "ticket" + ticket.groupId;
  const subOrderNum = subOrders ? subOrders.length + 1 : 1;

  const ticketHTML = `
    <div class="ui-block-a">
      <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
        ${ticket.name}<br>
        Quantity #${ticket.quantity}<br>
        #${ticket.groupId ? ticket.count + "." + subOrderNum : ticket.count} ${ticket.purchaser}<br>
        Completed ${timeString}
      </div>
    </div>
    <div class="ui-block-b">
      <div class="ui-bar ui-bar-${theme}" style="height:${height}em;text-align-last: justify">
        ${ticket.info.join("<br>")}
      </div>
    </div>
  `;

  if (ticket.groupId) {
    $(`.completed-list > #${subOrderTargetId}`).after(`
      <div id="ticket${ticket.id}" data-group-id="${ticket.groupId}" data-ticket='${JSON.stringify(ticket)}' class="ui-grid-a" style="margin-top:-1em;margin-bottom:1em;touch-action:manipulation;position:relative">
        ${ticketHTML}
      </div>
    `);
  } else {
    $('.completed-list').prepend(`
      <div id="ticket${ticket.id}" data-ticket='${JSON.stringify(ticket)}' class="ui-grid-a" style="margin-bottom:1em;touch-action:manipulation;position:relative">
        ${ticketHTML}
      </div>
    `);
  }

  $(".completed-list").trigger('create');
}

function edit_ticket(ticket) {
  const ele = $(`#ticket${ticket.id}`);
  ele.animate({right: "50vw"}, 150);
  ele.animate({right: "0vw"}, 150, function() {

    const subOrders = ticket.groupId ? $(`.view-list > div[data-group-id='${ticket.groupId}']`) : false;
    const subOrderNum = subOrders ? subOrders.length + 1 : 1;

    const leftHTML = `
        ${ticket.name}<br>
        Quantity #${ticket.quantity}<br>
        #${ticket.count} ${ticket.purchaser}
    `;

    const rightHTML = `${ticket.info.join("<br>")}`;

    $(`#ticket${ticket.id} > div.ui-block-a > div.ui-bar`).html(leftHTML);
    $(`#ticket${ticket.id} > div.ui-block-b > div.ui-bar`).html(rightHTML);
    $(`#ticket${ticket.id}`).data(ticket, JSON.stringify(ticket));
    $(`#ticket${ticket.id}`).off("swipeleft").on("swipeleft", function(event) {
      change_view("edit");
      render_config(ticket.name, ticket);
      history.pushState({page: "create"}, "");
    })
  });
}

function remove_ticket(ticket) {
  $(`#ticket${ticket.id}, div[data-group-id='${ticket.id}'], #ticket${ticket.groupId}, div[data-group-id='${ticket.groupId}']`).animate({left: "200vw"}, 400, function() {
    const removedTicket = $(this).data("ticket");
    activeOrders -= parseInt(removedTicket.quantity);
    $('#activeBtn').text(activeOrders)
    $(this).remove();
    if ($(`.completed-list > div`).length >= 25) {
      $(`.completed-list > div:last`).remove();
    }
    add_ticket_to_completed(removedTicket);
  });
}

function sync_ticket(syncObj) {
  $('.view-list').children().remove();
  activeOrders = 0;
  $('#activeBtn').text(activeOrders);
  syncObj.ticketQueue.forEach(ticket => {
    add_ticket(ticket);
  });
  $('.completed-list').children().remove();
  syncObj.ticketHistory.forEach(ticket => {
    add_ticket_to_completed(ticket);
  });
  update_last_order(syncObj.lastOrder);
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

function add_events() {
  $('#createBtn').on("click", () => {
    change_view('create');
    history.pushState({page: "create"}, "");
  });

  $('#viewBtn').on("click", () => {
    change_view('view');
    history.pushState({page: "view"}, "");
  });

  $('#completedBtn').on("click", () => {
    change_view('completed');
    history.pushState({page: "completed"}, "");
  });
  
  $('#menuBtn').on("click", () => {
    change_view('menu');
    history.pushState({page: "menu"}, "");
  });

  $('#optionBtn').on("click", () => {
    change_view('option');
    history.pushState({page: "option"}, "");
  });

  $('#statBtn').on("click", () => {
    change_view('stat');
    history.pushState({page: "stat"}, "");
  });

  $('#activeBtn').on("click", () => {
    change_view('view');
    history.pushState({page: "view"}, "");
  });

  $('#resetOrderCount').on("click", () => {
    socket.emit("option", "resetOrderCount");
  });

  $('#darkModeToggle').on("click", () => {
    change_theme();
  });

  $('#cancelBtn').on("click", () => {
    change_view('create');
    history.back();
  });

  $('#cancelEditBtn').on("click", () => {
    change_view('view');
    history.back();
  });

  $('.btn-add-ticket').on("click", function() {
    change_view("config");
    let ticket = $(this).text();
    render_config(ticket);
    history.pushState({page: "create"}, "");
  });

  addEventListener("popstate", (event) => {
    change_view(event.state.page);
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

function get_order_id() {

  if (lastOrder) {
    return lastOrder.count + 1;
  } else {
    return 1;
  }

}

function update_last_order(ticket) {

  lastOrder = ticket;

  let data = $("#ticket-name").text();
  if (data) {
    data = data.split(" ");
    data[1] = "#" + (get_order_id());
    data = data.join(" ");
    $("#ticket-name").text(data)
  }

}

function main() {

  history.pushState({page: "menu"}, "");

  socket = io('/baristassist');
  showingNotification = false;
  currentTheme = localStorage.getItem("theme");
  theme = currentTheme ? currentTheme : "a";
  activeOrders = 0;
  connected = socket.connected;

  socket.on("add_ticket", add_ticket);
  socket.on("remove_ticket", remove_ticket);
  socket.on("edit_ticket", edit_ticket);
  socket.on("sync_ticket", sync_ticket);
  socket.on("show_notification", show_notification);
  socket.on("update_stats", update_stats);
  socket.on("connect_error", check_connection);
  socket.on("connect", check_connection);

  seasonal_changes();
  render_ticket_types();
  add_events();
  change_view("menu");

  $(document).on("pagecreate", function() {
    if (theme == "b") {
      set_theme(theme);
    }
  })
  
};

$(document).ready(main);
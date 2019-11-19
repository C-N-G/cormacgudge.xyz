var mysql = require('mysql');

var connection = mysql.createConnection({
    host: "localhost",
    user: "nw_crawler",
    password: "password",
    database: 'nw_db'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "INSERT INTO nw_players (id, name, kills, deaths, last_online) VALUES (297939, 'mac', 0, 0, NOW())";
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
});

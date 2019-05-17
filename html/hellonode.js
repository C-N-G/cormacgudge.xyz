var http = require('http');
var url = require('url');
var dt = require('./myfirstmodule');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  //res.write("The date and time are currently: " + dt.myDateTime());
  //res.write('Hello World!');
  //res.write(req.url);
  var q = url.parse(req.url, true).query;
  var txt = q.year + " " + q.month;
  res.end(txt);
}).listen(8080);

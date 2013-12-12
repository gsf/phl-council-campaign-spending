var fs = require('fs');
var http = require('http');
var st = require('st');
var url = require('url');

// Timestamp logs
require('logstamp')(console);

var port = process.argv[2] || process.env.PORT || 1776;

http.createServer(function (req, res) {
  var head, layout, main, nav, pn, sub, template;

  console.log(req.method, req.url);

  if (url.parse(req.url).pathname == '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(__dirname + '/static/index.html').pipe(res);
    return;
  }

  st({path: __dirname + '/static'})(req, res);
}).listen(port, function () {
  console.log('Listening on port', port);
});


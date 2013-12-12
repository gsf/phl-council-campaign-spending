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

  req.parsedUrl = url.parse(req.url, true);
  if (req.parsedUrl.pathname == '/') {
    if (req.parsedUrl.query.f == 'j') {
      return require('./api.js')(req, res);
    }
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(__dirname + '/static/index.html').pipe(res);
    return;
  }

  st({path: __dirname + '/static', passthrough: true})(req, res, function () {
    console.warn('Warning: Not Found');
    res.statusCode = 404;
    res.end('Not Found');
  });
}).listen(port, function () {
  console.log('Listening on port', port);
});


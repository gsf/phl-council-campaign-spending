var es = require('es')({
  _index: 'campaign-spending',
  server: {
    auth: process.env.ESAUTH || '',
    host: process.env.ESHOST || 'localhost',
    port: process.env.ESPORT || '9200'
  }
});

function error (err, res) {
  console.error(err.stack);
  res.statusCode = 500;
  res.end('{"message": "Internal Error"}');
}

function badRequest (res) {
  console.warn('Warning: Bad Request');
  res.statusCode = 400;
  res.end('{"message": "Bad Request"}');
}

module.exports = function (req, res) {
  var params = req.parsedUrl.query;
  var query = {
    from: params.from
  };
  res.setHeader('Content-Type', 'application/json');
  if (params.q) {
    query.query = {
      queryString: {
        defaultOperator: 'AND',
        query: params.q
      }
    };
  } else {
    query.query = {matchAll: {}};
    query.sort = [{amount: 'desc'}];
  }
  es.search(query, function(err, data) {
    if (err) return error(err, res);
    var newdata = JSON.stringify({
      total: data.hits.total,
      records: data.hits.hits.map(function (hit) {
        return hit._source;
      })
    });
    res.end(newdata);
  });
};

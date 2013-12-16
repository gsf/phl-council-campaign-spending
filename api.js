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
    from: params.from,
    facets: {
      name: {terms: {field: "name.raw", size: 20}},
      category: {terms: {field: "category.raw"}},
      amount: {
        range: {
          field: 'amount',
          ranges: [
            {to: 99},
            {from: 100, to: 999},
            {from: 1000, to: 9999},
            {from: 10000, to: 99999},
            {from: 100000}
          ]
        }
      }
    }
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
  if (params.sort == 'amount') {
    query.sort = [{amount: 'desc'}];
  } else if (params.sort == 'newest') {
    query.sort = [{date: 'desc'}];
  } else if (params.sort == 'oldest') {
    query.sort = [{date: 'asc'}];
  }
  es.search(query, function(err, data) {
    if (err) return error(err, res);
    var newdata = JSON.stringify({
      total: data.hits.total,
      records: data.hits.hits.map(function (hit) {
        return hit._source;
      }),
      facets: data.facets
    });
    res.end(newdata);
  });
};

var accounting = require('accounting');
var http = require('http');
var hyperglue = require('hyperglue');
var qs = require('querystring');

var queryStr = window.location.search.substr(1);
var params = qs.parse(queryStr);
var resultsElem = document.querySelector('.results');
var from = 0;
var total = 0;

function getPath (path, cb) {
  http.get({path: path}, function (res) {
    var data = '';
    res.on('data', function (chunk) {data += chunk});
    res.on('end', function () {
      cb(data)
    });
  });
}

function getResult (cb) {
  var path = '/api?' + queryStr;
  if (from) path += '&from=' + from;
  getPath(path, function (data) {
    var result = JSON.parse(data);
    cb(result);
  });
}

function renderRecord (html, record, index) {
  return hyperglue(html, {
    '.index': index,
    '.id a': {
      href: '/?q=id:' + record.id,
      _text: record.id
    },
    '.date a': {
      href: '/?q=date:' + record.date,
      _text: record.date
    },
    '.category a': {
      href: '/?q=category:"' + encodeURIComponent(record.category) + '"',
      _text: record.category
    },
    '.name a': {
      href: '/?q=name:"' + encodeURIComponent(record.name) + '"',
      _text: record.name
    },
    '.amount span': accounting.formatMoney(record.amount),
    '.description span': record.description,
    '.address span': record.address,
    '.payee a': {
      href: '/?q=payee:"' + encodeURIComponent(record.payee) + '"',
      _text: record.payee
    }
  });
}

function renderRecords (result, html) {
  var record;
  for (var i=0; i<result.records.length; i++) {
    record = result.records[i];
    resultsElem.appendChild(renderRecord(html, record, i+1+from));
  }
}

function cap (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function renderFacets (facetName, result) {
  if (!result.facets[facetName].total) return;
  document.querySelector('.' + facetName + '.facet').innerHTML = '<h2>' +
    cap(facetName) + '</h2><ul>' +
    result.facets[facetName].terms.map(function (facet) {
      return '<li><a href="/?q=' + encodeURIComponent(
        (params.q ? params.q + ' ' : '') +
        facetName + ':"' + facet.term + '"'
      ) + '">' + facet.term + '</a> (' + facet.count + ')</li>';
    }).join('') + '</ul>';
}

function renderRangeFacets (facetName, result) {
  document.querySelector('.' + facetName + '.facet').innerHTML = '<h2>' +
    cap(facetName) + '</h2><ul>' +
    result.facets[facetName].ranges.map(function (facet) {
      if (!facet.count) return;
      return '<li><a href="/?q=' + encodeURIComponent(
        (params.q ? params.q + ' ' : '') + facetName +
        ':[' + (facet.from || '*') + ' TO ' + (facet.to || '*') + ']'
        ) + '">$' + (facet.from ? Number(facet.from).toLocaleString() : '0') +
        ' to ' + (facet.to ? '$' + Number(facet.to).toLocaleString() : '∞') +
        '</a> (' + facet.count + ')</li>';
    }).join('') + '</ul>';
}

function renderSort (result) {
  var q = params.q ? encodeURIComponent(params.q) : '';
  var relevance = params.sort ?
    '<a href="/?q=' + q + '">relevance</a>' : 'relevance';
  var amount = ((params.sort == 'amount' || (!params.sort && !q)) ?
    'amount' : '<a href="/?q=' + q + '&sort=amount">amount</a>');
  var newest = (params.sort == 'newest' ?
    'newest' : '<a href="/?q=' + q + '&sort=newest">newest</a>');
  var oldest = (params.sort == 'oldest' ?
    'oldest' : '<a href="/?q=' + q + '&sort=oldest">oldest</a>');
  document.querySelector('.sort').innerHTML = 'Sort by ' + (q && relevance + ' ') +
    amount + ' ' + newest + ' ' + oldest;
}

function renderTop (result) {
  total = result.total;
  document.querySelector('.search').value = params.q || '';
  document.querySelector('.total').innerHTML = total || 0;
  if (total) {
    renderFacets('name', result);
    renderFacets('category', result);
    renderRangeFacets('amount', result);
    renderSort();
  }
}

getResult(function (result) {
  renderTop(result);
  getPath('/record.html', function (html) {
    renderRecords(result, html);
    setInterval(function () {
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 100 && total > from) {
        getResult(function (result) {
          renderRecords(result, html);
        });
        from += 10;
      }
    }, 250);
  });
});

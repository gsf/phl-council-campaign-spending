var accounting = require('accounting');
var h = require('hyperscript');
var http = require('http');
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

function renderRecord (record, index) {
  return h('div.record',
    h('div.index', index),
    h('div.id',
      h('span.label', 'ID: '),
      h('a', {href: '/?q=id:' + record.id}, record.id)),
    h('div.name',
      h('span.label', 'Name: '),
      h('a', {href: '/?q=name:"' + encodeURIComponent(record.name) + '"'}, record.name)),
    h('div.amount',
      h('span.label', 'Amount: '),
      h('span', accounting.formatMoney(record.amount))),
    h('div.payee',
      h('span.label', 'Payee: '),
      h('a', {href: '/?q=payee:"' + encodeURIComponent(record.payee) + '"'}, record.payee)),
    h('div.address',
      h('span.label', 'Address: '),
      h('span', record.address)),
    h('div.date',
      h('span.label', 'Date: '),
      h('a', {href: '/?q=date:' + record.date}, record.date)),
    h('div.description',
      h('span.label', 'Description: '),
      h('span', record.description)),
    h('div.category',
      h('span.label', 'Category: '),
      h('a', {href: '/?q=category:"' + encodeURIComponent(record.category) + '"'}, record.category)));
}

function renderRecords (result) {
  var record;
  for (var i=0; i<result.records.length; i++) {
    record = result.records[i];
    resultsElem.appendChild(renderRecord(record, i+1+from));
  }
}

function renderFacets (facetName, result) {
  if (!result.facets[facetName].total) return;
  document.querySelector('.' + facetName + '.facet').appendChild(h('ul',
    result.facets[facetName].terms.map(function (facet) {
      return h('li', 
        h('a', {href: '/?q=' + encodeURIComponent(
          (params.q ? params.q + ' ' : '') +
          facetName + ':"' + facet.term + '"'
        )}, facet.term),
        h('span', ' (' + facet.count + ')')
      );
    })
  ));
}

function renderRangeFacets (facetName, result) {
  document.querySelector('.' + facetName + '.facet').appendChild(h('ul',
    result.facets[facetName].ranges.map(function (facet) {
      if (!facet.count) return;
      return h('li', 
        h('a', {href: '/?q=' + encodeURIComponent(
        (params.q ? params.q + ' ' : '') + facetName +
        ':[' + (facet.from || '*') + ' TO ' + (facet.to || '*') + ']'
        )}, '$' + (facet.from ? Number(facet.from).toLocaleString() : '0') +
        ' to ' + (facet.to ? '$' + Number(facet.to).toLocaleString() : '∞')),
        h('span', ' (' + facet.count + ')')
      );
    })
  ));
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
  renderRecords(result);
  setInterval(function () {
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 100 && total > (from + 10)) {
      from += 10;
      getResult(function (result) {
        renderRecords(result);
      });
    }
  }, 250);
});

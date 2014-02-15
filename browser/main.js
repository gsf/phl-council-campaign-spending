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
  return h('.record',
    h('.index', index),
    h('.headshot', 
      h('img', {src: 'images/' + encodeURI(record.councilperson) + '.jpg', height: 100, width: 100})),
    h('.id',
      h('span.label', 'ID: '),
      h('a', {href: '/?q=id:' + record.id}, record.id)),
    h('.councilperson',
      h('span.label', 'Councilperson: '),
      h('a', {href: '/?q=councilperson:"' + encodeURIComponent(record.councilperson) + '"'}, record.councilperson)),
    h('.amount',
      h('span.label', 'Amount: '),
      h('span', accounting.formatMoney(record.amount))),
    h('.payee',
      h('span.label', 'Payee: '),
      h('a', {href: '/?q=payee:"' + encodeURIComponent(record.payee) + '"'}, record.payee)),
    h('.address',
      h('span.label', 'Address: '),
      h('span', record.address)),
    h('.date',
      h('span.label', 'Date: '),
      h('a', {href: '/?q=date:' + record.date}, record.date)),
    h('.description',
      h('span.label', 'Description: '),
      h('span', record.description)),
    h('.category',
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
    '<a href="/?q=' + q + '">Relevance</a>' : 'Relevance';
  var amount = ((params.sort == 'amount' || (!params.sort && !q)) ?
    'Amount' : '<a href="/?q=' + q + '&sort=amount">Amount</a>');
  var newest = (params.sort == 'newest' ?
    'Newest' : '<a href="/?q=' + q + '&sort=newest">Newest</a>');
  var oldest = (params.sort == 'oldest' ?
    'Oldest' : '<a href="/?q=' + q + '&sort=oldest">Oldest</a>');
  document.querySelector('.sort').innerHTML = 'Sort results: ' + (q && relevance + ' ') +
    amount + ' ' + newest + ' ' + oldest;
}

function renderTop (result) {
  total = result.total;
  document.getElementById('search').value = params.q || '';
  document.querySelector('.total').innerHTML = accounting.formatNumber(total) || 0;
  if (total) {
    renderFacets('councilperson', result);
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

function hideTop () {
  if (params.q) {
    document.querySelector('.hero').style.display = 'none';
    var controlPs = document.querySelector('.controls').getElementsByTagName('p');
    for (var i = 0; i < controlPs.length; i++) {
      controlPs[i].style.display = 'none';
    }
  }
}
hideTop();

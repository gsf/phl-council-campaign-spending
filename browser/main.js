var http = require('http');
var hyperglue = require('hyperglue');
var qs = require('querystring');

function getRecordHtml (cb) {
  http.get({path: '/record.html'}, function (res) {
    var data = '';
    res.on('data', function (chunk) {data += chunk});
    res.on('end', function () {
      cb(data);
    });
  });
}

function render (html, record, index) {
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
    '.amount span': '$' + Number(record.amount).toLocaleString(),
    '.description span': record.description,
    '.address span': record.address,
    '.payee a': {
      href: '/?q=payee:"' + encodeURIComponent(record.payee) + '"',
      _text: record.payee
    }
  });
}

var queryStr = window.location.search.substr(1);
var params = qs.parse(queryStr);

document.querySelector('.search').value = params.q || '';

getRecordHtml(function (html) {
  http.get({path: '/?f=j&' + queryStr}, function (res) {
    var data = '';
    res.on('data', function (chunk) {data += chunk});
    res.on('end', function () {
      var index;
      var result = JSON.parse(data);
      var record;
      document.querySelector('.total').innerHTML = result.total;
      var resultsElem = document.querySelector('.results');
      for (var i=0; i<result.records.length; i++) {
        index = i+1;
        record = result.records[i];
        console.log(record);
        resultsElem.appendChild(render(html, record, index));
      }
    });
  });
});

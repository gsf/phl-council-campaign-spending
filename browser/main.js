var http = require('http');
var hyperglue = require('hyperglue');
var qs = require('querystring');

var queryStr = window.location.search.substr(1);
var apiStr = '/?f=j&' + queryStr;
var params = qs.parse(queryStr);
var from = 0;
var total = 0;
var resultsElem = document.querySelector('.results');
var recordHTML;
var facetsSet = false;

document.querySelector('.search').value = params.q || '';

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

function getPath (path, cb) {
  http.get({path: path}, function (res) {
    var data = '';
    res.on('data', function (chunk) {data += chunk});
    res.on('end', function () {
      cb(data)
    });
  });
}

function cap (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function renderFacets (facetName, result) {
  if (!result.facets[facetName].total) return;
  document.querySelector('.' + facetName + '.facets').innerHTML = '<h2>' +
    cap(facetName) + '</h2><ul>' +
    result.facets[facetName].terms.map(function (facet) {
      return '<li><a href="/?q=' + encodeURIComponent(
        (params.q ? params.q + ' ' : '') +
        facetName + ':"' + facet.term + '"'
      ) + '">' + facet.term + '</a> (' + facet.count + ')</li>';
    }).join('') + '</ul>';
}

function renderRangeFacets (facetName, result) {
  document.querySelector('.' + facetName + '.facets').innerHTML = '<h2>' +
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

function appendRecords (html) {
  var path = apiStr;
  if (from) path += '&from=' + from;
  getPath(path, function (data) {
    var result = JSON.parse(data);
    var record;
    if (!facetsSet && result.total) {
      renderFacets('name', result);
      renderFacets('category', result);
      renderRangeFacets('amount', result);
      facetsSet = true;
    }
    total = result.total;
    document.querySelector('.total').innerHTML = result.total;
    for (var i=0; i<result.records.length; i++) {
      record = result.records[i];
      resultsElem.appendChild(render(html, record, i+1+from));
    }
    from += 10;
  });
}

getPath('/record.html', function (html) {
  recordHTML = html;
  appendRecords(html);
});


setInterval(function () {
  if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 100 && total > from) {
    console.log(from);
    appendRecords(recordHTML);
  }
}, 250);

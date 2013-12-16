var csv = require('csv');
var fs = require('fs');

// base32 according to http://www.crockford.com/wrmg/base32.html
var alphabet = '0123456789abcdefghjkmnpqrstvwxyz';
function generateId () {
  var id = '';
  for (var i=0; i<4; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function zeroPad (num) {
  return ('0' + num).slice(-2);
}

csv()
.from.stream(fs.createReadStream(__dirname+'/campaign-spending.csv'), {columns: true, trim: true})
.to.path(__dirname+'/campaign-spending.out')
.transform(function (row) {
  process.stdout.write('.');
  var id = generateId();
  var dateArray = row['Date'].split('/');
  return JSON.stringify({
    index: {
      _id: id
    }
  }) + '\n' +
  JSON.stringify({
    id: id,
    councilperson: row.Councilperson,
    payee: row.Payee,
    address: row['Payee Address'],
    date: dateArray[2] + '-' + zeroPad(dateArray[0]) + '-' + zeroPad(dateArray[1]),
    amount: row.Amount.substr(1).replace(',', ''),
    description: row.Description,
    category: row.Category
  }) + '\n';
})
.on('end', function (count) {
  console.log(count);
})
.on('error', function (err) {
  console.error(err.stack);
});

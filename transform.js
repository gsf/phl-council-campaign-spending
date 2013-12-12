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

csv()
.from.stream(fs.createReadStream(__dirname+'/campaign-spending.csv'), {columns: true, trim: true})
.to.path(__dirname+'/campaign-spending.out')
.transform(function (row) {
  process.stdout.write('.');
  var id = generateId();
  return JSON.stringify({
    index: {
      _id: id
    }
  }) + '\n' +
  JSON.stringify({
    id: id,
    name: row.Councilperson,
    payee: row.Payee,
    address: row['Payee Address'],
    date: row['Date'],
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

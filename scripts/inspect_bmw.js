const fs = require('fs');

const cat = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const bmw = cat.products.find(p => p.id === 'real-B0DDBSMF34');

console.log('BMW before update:');
bmw.offers.forEach(o => console.log(o.store, o.variantTitle, o.image));

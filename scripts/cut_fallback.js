const fs = require('fs');
const f = require('path').join(__dirname, '..', 'services', 'dynamicProductScraper.js');
let s = fs.readFileSync(f, 'utf8');
const a = s.indexOf('  // 2. If external marketplace returned fewer than 2 items');
const b = s.indexOf('  // 3. Assemble Multi-Platform Offers');
if (a === -1 || b === -1) throw new Error('markers not found');
s = s.slice(0, a) + '  // 2. No synthetic products: if the live source returns nothing, nothing is added.\n\n' + s.slice(b);
fs.writeFileSync(f, s);
console.log('synthetic fallback removed');

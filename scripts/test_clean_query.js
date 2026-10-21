const fs = require('fs');
const catalog = require('../data/catalog.json');

function getShortCleanQuery(title, brand) {
  if (!title) return 'Produkt';
  
  const modelPattern = title.match(/\b(WF-\d{3,4}\w*|WH-\d{3,4}\w*|iPhone\s*\d+\w*|Galaxy\s*S\d+\w*|[A-Z]{1,4}-\d{3,5}\w*|Nitro\s*V?\d*|PlayStation\s*5|Xbox\s*Series\s*[XS]|Switch|iPad\s*\w*|MacBook\s*\w*)\b/i);
  const b = brand || (title.match(/\b(Sony|Apple|Samsung|Bosch|Bose|Acer|Lenovo|MSW|VEVOR|DeLonghi|Ninja|Emma|Nike|Adidas|Puma|Lattafa|Dior|Chanel|Kärcher|Tretmann|Philips)\b/i) || [])[1] || '';
  
  if (modelPattern && b && !modelPattern[1].toLowerCase().includes(b.toLowerCase())) {
    return (b + ' ' + modelPattern[1]).replace(/\s+/g, ' ').trim();
  }
  
  let clean = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Generalüberholt|Refurbished|Gebraucht|Neu|Premium|Professional|Original/gi, '')
    .split(/[:|;–—]/)[0]
    .replace(/[^\w\sÄÖÜäöüß.-]/g, ' ')
    .trim();
    
  let rawWords = clean.split(/\s+/).filter(w => !/^(mit|für|in|den|und|die|der|das|ein|eine|ear|true|wireless|noise|cancelling|kabellose)$/i.test(w));
  
  const seen = new Set();
  const words = [];
  if (b) {
    seen.add(b.toLowerCase());
    words.push(b);
  }
  for (const w of rawWords) {
    if (!seen.has(w.toLowerCase())) {
      seen.add(w.toLowerCase());
      words.push(w);
    }
  }
  return words.slice(0, 3).join(' ');
}

const sony = catalog.products.find(p => p.asin === 'B0C4TLFZSZ');
console.log('Sony WF-1000XM5:', getShortCleanQuery(sony.title, sony.brand));

const iphone16 = catalog.products.find(p => p.title.includes('iPhone 16'));
console.log('iPhone 16:', getShortCleanQuery(iphone16.title, iphone16.brand));

const bosch = catalog.products.find(p => p.title.includes('Bosch'));
console.log('Bosch:', getShortCleanQuery(bosch.title, bosch.brand));

const acer = catalog.products.find(p => p.title.includes('Acer'));
console.log('Acer:', getShortCleanQuery(acer.title, acer.brand));

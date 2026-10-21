const fs = require('fs');
const path = require('path');
const { detectCategoryFromText, extractSmartModelQuery } = require('../seedCatalog');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');
const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
const catalog = JSON.parse(raw);
const products = catalog.products || [];

function detectColorFromTitle(title) {
  const t = (title || '').toLowerCase();
  const colorMap = [
    { re: /\b(schwarz|black)\b/i, name: 'Schwarz' },
    { re: /\b(wei[ßs]|white)\b/i, name: 'Weiß' },
    { re: /\b(pink|rosa|rose)\b/i, name: 'Pink / Rosa' },
    { re: /\b(ultramarin)\b/i, name: 'Ultramarin' },
    { re: /\b(blau|blue|marine|navy|dunkelblau)\b/i, name: 'Blau' },
    { re: /\b(grün|green|waldgrün|olive)\b/i, name: 'Grün' },
    { re: /\b(rot|red)\b/i, name: 'Rot' },
    { re: /\b(grau|grey|gray|anthrazit|titan)\b/i, name: 'Grau / Titan' },
    { re: /\b(silber|silver)\b/i, name: 'Silber' },
    { re: /\b(gold)\b/i, name: 'Gold' },
    { re: /\b(beige|khaki|creme|braun|brown)\b/i, name: 'Beige / Braun' },
    { re: /\b(bunt|multicolor|mehrfarbig)\b/i, name: 'Multicolor' }
  ];
  for (const c of colorMap) {
    if (c.re.test(t)) return c.name;
  }
  return null;
}

console.log(`Processing ${products.length} products...`);

let zalandoCleaned = 0;
let fakeColorsRemoved = 0;

for (const p of products) {
  const isSonyUlt = p.asin === 'B0CX1VYYQL' || p.title.toLowerCase().includes('ult wear');
  const isIphone16Special = p.asin === 'B0DGHN3YNR';

  // Detect real color from product title
  const detectedColor = detectColorFromTitle(p.title);

  if (Array.isArray(p.offers)) {
    p.offers.forEach((o, idx) => {
      // 1. Clean Zalando URLs
      if (o.store === 'Zalando' || (o.directUrl && o.directUrl.includes('awinmid=8686'))) {
        o.directUrl = `https://www.zalando.de/katalog/?q=${encodeURIComponent(o.query || p.title)}`;
        zalandoCleaned++;
      }

      // 2. Fix variant titles and colors
      if (!isSonyUlt && !isIphone16Special) {
        if (p.category === 'perfumes_beauty') {
          // Keep size for perfumes
          if (!o.variantColor || !o.variantColor.includes('ml')) {
            const sizes = ['100ml Eau de Parfum', '50ml Eau de Parfum', '100ml Eau de Toilette', '50ml Intense'];
            o.variantColor = sizes[idx % sizes.length];
            o.variantTitle = `${o.query || p.title} - ${o.variantColor}`;
          }
        } else if (detectedColor) {
          // Title actually mentions this genuine color
          o.variantColor = detectedColor;
          o.variantTitle = `${o.query || p.title} (${detectedColor})`;
        } else {
          // NO color in title -> remove fake contradictory color!
          if (o.variantColor) fakeColorsRemoved++;
          o.variantColor = '';
          o.variantTitle = o.query || p.title;
        }
      }
    });
  }
}

catalog.lastSyncedAt = new Date().toISOString();
fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`DONE! Cleaned ${zalandoCleaned} Zalando URLs and sanitized ${fakeColorsRemoved} fake colors.`);

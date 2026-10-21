const fs = require('fs');
const path = require('path');
const { scrapeRealAmazonProducts } = require('../seedCatalog');

async function syncCatalogTo285() {
  const catalogPath = path.join(__dirname, '../data/catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const existingAsins = new Set(catalog.products.map(p => p.asin));

  console.log('Current catalog count:', catalog.products.length);

  // 1. Fetch 20 Autoradios
  console.log('Fetching 20 Autoradios...');
  const radios = await scrapeRealAmazonProducts('Autoradio Bluetooth CarPlay', 'auto_car', 'مستلزمات وأجهزة السيارات', 20, 15);
  let addedRadios = 0;
  for (const r of radios) {
    if (!existingAsins.has(r.asin)) {
      catalog.products.push(r);
      existingAsins.add(r.asin);
      addedRadios++;
    }
  }
  console.log(`Added ${addedRadios} new autoradios.`);

  // 2. Fetch 20 Ausbeulspotters
  console.log('Fetching 20 Ausbeulspotters...');
  const spotters = await scrapeRealAmazonProducts('Ausbeulspotter Karosserie', 'auto_car', 'مستلزمات وأجهزة السيارات', 20, 15);
  let addedSpotters = 0;
  for (const s of spotters) {
    if (!existingAsins.has(s.asin)) {
      catalog.products.push(s);
      existingAsins.add(s.asin);
      addedSpotters++;
    }
  }
  console.log(`Added ${addedSpotters} new spotters.`);

  catalog.totalProducts = catalog.products.length;
  catalog.lastSyncedAt = new Date().toISOString();

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`New catalog count permanently saved: ${catalog.products.length}`);
}

syncCatalogTo285().catch(console.error);

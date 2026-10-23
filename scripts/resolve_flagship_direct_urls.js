const fs = require('fs');
const path = require('path');
const { storeUrlResolver, isDirectProductUrl } = require('../services/storeUrlResolver');

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');
const OFFERS_PATH = path.join(ROOT, 'data', 'product_offers.json');

const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8'));

console.log(`Starting Flagship Direct URL Pre-Resolver for top products...`);

(async () => {
  let resolvedCount = 0;
  // Resolve flagship / popular products across their attached platforms
  const targetProducts = cat.products.slice(0, 15);

  for (let i = 0; i < targetProducts.length; i++) {
    const p = targetProducts[i];
    console.log(`\n[${i + 1}/${targetProducts.length}] Resolving for: "${p.title.slice(0, 50)}..."`);

    if (Array.isArray(p.offers)) {
      for (const o of p.offers) {
        if (o.store === 'Amazon') continue; // Amazon already direct via ASIN
        const currentUrl = o.direct_affiliate_url || o.directUrl || '';
        if (isDirectProductUrl(currentUrl, o.store)) {
          console.log(`  -> ${o.store}: Already direct!`);
          continue;
        }

        console.log(`  -> ${o.store}: Resolving direct link...`);
        const direct = await storeUrlResolver.resolveDirectProductUrl(o.store, p.title, p.asin, p.id, p.brand, settings);
        if (direct) {
          o.direct_affiliate_url = direct;
          o.directUrl = direct;
          resolvedCount++;
          console.log(`     ✔️ SUCCESS: ${direct}`);
        } else {
          console.log(`     ❌ Not found or skipped.`);
        }
      }
    }
  }

  // Persist updated catalog and offers
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2), 'utf8');

  // Also update product_offers.json
  const offersMap = JSON.parse(fs.readFileSync(OFFERS_PATH, 'utf8'));
  cat.products.forEach(p => {
    (p.offers || []).forEach(o => {
      const match = (offersMap || []).find(x => x.product_id === p.id && x.store.toLowerCase() === o.store.toLowerCase());
      if (match && (o.direct_affiliate_url || o.directUrl)) {
        match.direct_affiliate_url = o.direct_affiliate_url || o.directUrl;
        match.directUrl = match.direct_affiliate_url;
      }
    });
  });
  fs.writeFileSync(OFFERS_PATH, JSON.stringify(offersMap, null, 2), 'utf8');

  console.log(`\n🎉 Pre-resolution finished! Resolved ${resolvedCount} new 100% direct product URLs.`);
})();

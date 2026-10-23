const fs = require('fs');
const path = require('path');
const { storeUrlResolver, isDirectProductUrl } = require('../services/storeUrlResolver');

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');
const OFFERS_PATH = path.join(ROOT, 'data', 'product_offers.json');

const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8'));

console.log(`Starting Batch 2 Direct URL Pre-Resolver (Products 15 to 35)...`);

(async () => {
  let resolvedCount = 0;
  const targetProducts = cat.products.slice(15, 35);

  for (let i = 0; i < targetProducts.length; i++) {
    const p = targetProducts[i];
    console.log(`\n[${i + 1}/${targetProducts.length}] Resolving: "${p.title.slice(0, 45)}..."`);

    if (Array.isArray(p.offers)) {
      for (const o of p.offers) {
        if (o.store === 'Amazon') continue;
        const currentUrl = o.direct_affiliate_url || o.directUrl || '';
        if (isDirectProductUrl(currentUrl, o.store)) continue;

        try {
          const direct = await storeUrlResolver.resolveDirectProductUrl(o.store, p.title, p.asin, p.id, p.brand, settings);
          if (direct) {
            o.direct_affiliate_url = direct;
            o.directUrl = direct;
            resolvedCount++;
            console.log(`  -> ${o.store}: ✔️ ${direct.slice(0, 75)}...`);
          }
        } catch (e) {}
      }
    }
  }

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

  console.log(`\n🎉 Batch 2 complete! Resolved ${resolvedCount} new direct product URLs.`);
})();

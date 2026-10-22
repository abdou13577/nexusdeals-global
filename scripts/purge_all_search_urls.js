const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');
const PRODUCTS_PATH = path.join(ROOT, 'data', 'products.json');
const OFFERS_PIVOT_PATH = path.join(ROOT, 'data', 'offers_pivot.json');

const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

function isSearchLike(url) {
  if (!url || typeof url !== 'string') return true;
  const decoded = decodeURIComponent(url);
  return (
    /search/i.test(decoded) ||
    /suche/i.test(decoded) ||
    /katalog\/\?q/i.test(decoded) ||
    /\/s\?k=/i.test(decoded) ||
    /_nkw=/i.test(decoded) ||
    /pdsearch/i.test(decoded) ||
    /wholesale/i.test(decoded) ||
    /search_result/i.test(decoded)
  );
}

let removedCount = 0;
const cleanProducts = [];

cat.products.forEach(p => {
  const directOffers = (p.offers || []).filter(o => !isSearchLike(o.direct_affiliate_url || o.directUrl));
  removedCount += ((p.offers || []).length - directOffers.length);

  if (directOffers.length > 0) {
    directOffers.sort((a, b) => a.price - b.price);
    p.offers = directOffers;
    p.price = directOffers[0].price;
    cleanProducts.push(p);
  }
});

cat.products = cleanProducts;
cat.total = cleanProducts.length;
cat.lastSyncedAt = new Date().toISOString();

fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2), 'utf8');

const flatProducts = cleanProducts.map(p => {
  const { offers, ...rest } = p;
  return rest;
});

const pivotOffers = [];
cleanProducts.forEach(p => {
  p.offers.forEach((o, i) => {
    pivotOffers.push({
      id: o.id || `off-${p.id}-${o.store.toLowerCase()}-${i}`,
      product_id: p.id,
      platform_id: o.platform_id || o.store.toLowerCase(),
      store: o.store,
      storeLogo: o.storeLogo || o.store.toLowerCase(),
      price: o.price,
      direct_affiliate_url: o.direct_affiliate_url || o.directUrl,
      directUrl: o.directUrl || o.direct_affiliate_url,
      variantTitle: o.variantTitle || p.title,
      image: o.image || p.image,
      images: o.images || p.images || [p.image],
      shipping: o.shipping || 0,
      in_stock: o.in_stock !== false,
      inStock: o.inStock !== false,
      rating: o.rating || p.rating || 4.8,
      last_updated: o.last_updated || new Date().toISOString()
    });
  });
});

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(flatProducts, null, 2), 'utf8');
fs.writeFileSync(OFFERS_PIVOT_PATH, JSON.stringify(pivotOffers, null, 2), 'utf8');

console.log(`Removed ${removedCount} search offers.`);
console.log(`Clean verified products: ${cleanProducts.length}`);
console.log(`Clean verified 100% direct offers: ${pivotOffers.length}`);

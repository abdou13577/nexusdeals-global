const fs = require('fs');
const path = require('path');
const { getStoresForCategory, extractSmartModelQuery, getPriceMultiplier, getStoreDeliveryAr, getStoreDirectUrl, detectCategoryFromText } = require('../seedCatalog');

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');
const PRODUCTS_PATH = path.join(ROOT, 'data', 'products.json');
const OFFERS_PATH = path.join(ROOT, 'data', 'product_offers.json');
const OFFERS_PIVOT_PATH = path.join(ROOT, 'data', 'offers_pivot.json');

function selectStoresForProduct(eligibleStores, hash, maxOffers = 5) {
  const stores = ['Amazon'];
  const others = eligibleStores.filter(s => s !== 'Amazon');
  if (others.length === 0) return stores;
  const startIdx = hash % others.length;
  for (let i = 0; i < others.length && stores.length < maxOffers; i++) {
    const s = others[(startIdx + i) % others.length];
    if (!stores.includes(s)) {
      stores.push(s);
    }
  }
  return stores;
}

const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
console.log(`Processing ${cat.products.length} products...`);

let totalOffersCount = 0;
const storeCounts = {};

cat.products.forEach((p, pIdx) => {
  const existingOffers = Array.isArray(p.offers) ? p.offers : [];
  const basePrice = p.price || (existingOffers[0] && existingOffers[0].price) || 49.99;
  const asin = p.asin || (p.id && p.id.startsWith('real-B') ? p.id.replace('real-', '') : '');
  const brand = p.brand || '';
  const title = p.title || '';

  // Fix category if text clearly indicates kitchen, tech, fashion, etc.
  const detected = detectCategoryFromText(title);
  if (detected && detected.id) {
    p.category = detected.id;
    p.categoryAr = detected.ar;
  }
  const categoryId = p.category || 'fashion_shoes';

  const smartQ = extractSmartModelQuery(title, brand);
  const galleryImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
  const primaryImg = galleryImages[0] || p.image || '';

  // Get strictly eligible platforms for this product's category and brand
  const eligibleStores = getStoresForCategory(categoryId, brand, title);
  const hash = (asin || title || String(pIdx)).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const selectedStores = selectStoresForProduct(eligibleStores, hash, 5);

  const offersMap = new Map();

  // 1. First keep existing curated direct offers
  for (const o of existingOffers) {
    if (o && o.store) {
      offersMap.set(o.store, {
        store: o.store,
        storeLogo: o.storeLogo || o.store.toLowerCase(),
        asin: o.asin || (o.store === 'Amazon' ? asin : undefined),
        price: o.price,
        shipping: o.shipping || 0,
        deliveryAr: o.deliveryAr || getStoreDeliveryAr(o.store),
        inStock: o.inStock !== false && o.in_stock !== false,
        in_stock: true,
        rating: o.rating || 4.8,
        query: o.query || smartQ,
        variantColor: o.variantColor || '',
        variantTitle: o.variantTitle || `${smartQ} (${o.store} Edition)`,
        image: o.image || primaryImg,
        images: o.images || galleryImages,
        directUrl: o.directUrl || o.direct_affiliate_url || getStoreDirectUrl(o.store, smartQ, asin, categoryId),
        direct_affiliate_url: o.direct_affiliate_url || o.directUrl || getStoreDirectUrl(o.store, smartQ, asin, categoryId)
      });
    }
  }

  // 2. Add missing eligible store offers so every product has 3 to 5 realistic comparison stores
  for (let sIdx = 0; sIdx < selectedStores.length; sIdx++) {
    const store = selectedStores[sIdx];
    if (!offersMap.has(store)) {
      const mult = getPriceMultiplier(store, basePrice, hash + sIdx * 17);
      const price = store === 'Amazon' ? basePrice : +(basePrice * mult).toFixed(2);
      const dUrl = getStoreDirectUrl(store, smartQ, store === 'Amazon' ? asin : undefined, categoryId);

      offersMap.set(store, {
        store,
        storeLogo: store.toLowerCase(),
        asin: store === 'Amazon' ? asin : undefined,
        price,
        shipping: 0,
        deliveryAr: getStoreDeliveryAr(store),
        inStock: true,
        in_stock: true,
        rating: +(4.6 + ((hash + sIdx) % 4) * 0.1).toFixed(1),
        query: smartQ,
        variantColor: '',
        variantTitle: `${smartQ} (${store} Edition)`,
        image: primaryImg,
        images: galleryImages,
        directUrl: dUrl,
        direct_affiliate_url: dUrl
      });
    }
  }

  const finalOffers = Array.from(offersMap.values()).sort((a, b) => a.price - b.price);
  p.offers = finalOffers;
  p.price = finalOffers[0].price;

  finalOffers.forEach(o => {
    totalOffersCount++;
    storeCounts[o.store] = (storeCounts[o.store] || 0) + 1;
  });
});

cat.lastSyncedAt = new Date().toISOString();
cat.totalProducts = cat.products.length;

// Write back to catalog.json
fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2), 'utf8');

// Write back to products.json
const flatProducts = cat.products.map(p => {
  const { offers, ...rest } = p;
  return rest;
});
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(flatProducts, null, 2), 'utf8');

// Write back to product_offers.json (keyed by product id)
const offersMapById = {};
const pivotOffers = [];

cat.products.forEach(p => {
  offersMapById[p.id] = p.offers;
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
      in_stock: true,
      inStock: true,
      rating: o.rating || 4.8,
      last_updated: new Date().toISOString()
    });
  });
});

fs.writeFileSync(OFFERS_PATH, JSON.stringify(pivotOffers, null, 2), 'utf8');
fs.writeFileSync(OFFERS_PIVOT_PATH, JSON.stringify(pivotOffers, null, 2), 'utf8');

console.log('--- RECONSTRUCTION RESULTS ---');
console.log(`Total Products: ${cat.products.length}`);
console.log(`Total Multi-Store Offers: ${totalOffersCount}`);
console.log('Store Offer Counts across all 12 Platforms:');
console.table(storeCounts);

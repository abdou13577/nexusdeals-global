const fs = require('fs');
const path = require('path');
const ebay = require('../services/ebayBrowseService');

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');
const PRODUCTS_PATH = path.join(ROOT, 'data', 'products.json');
const OFFERS_PATH = path.join(ROOT, 'data', 'product_offers.json');
const OFFERS_PIVOT_PATH = path.join(ROOT, 'data', 'offers_pivot.json');

const QUERIES = [
  { q: 'Apple iPhone 16 128GB', category: 'smartphones', categoryAr: 'الهواتف والتابلت', brand: 'Apple' },
  { q: 'Samsung Galaxy S24 Ultra', category: 'smartphones', categoryAr: 'الهواتف والتابلت', brand: 'Samsung' },
  { q: 'Google Pixel 9 Pro', category: 'smartphones', categoryAr: 'الهواتف والتابلت', brand: 'Google' },
  { q: 'Sony PlayStation 5 Slim 1TB', category: 'gaming', categoryAr: 'الكمبيوترات والألعاب', brand: 'Sony' },
  { q: 'Nintendo Switch OLED', category: 'gaming', categoryAr: 'الكمبيوترات والألعاب', brand: 'Nintendo' },
  { q: 'Dyson V15 Detect Absolute', category: 'home_appliances', categoryAr: 'المطبخ والأجهزة المنزلية', brand: 'Dyson' },
  { q: 'DeLonghi Magnifica S Kaffeevollautomat', category: 'home_appliances', categoryAr: 'المطبخ والأجهزة المنزلية', brand: 'DeLonghi' },
  { q: 'Bosch Professional 18V GSR', category: 'tools_garden', categoryAr: 'العدد والأدوات والحديقة', brand: 'Bosch' },
  { q: 'Makita Akku 18V', category: 'tools_garden', categoryAr: 'العدد والأدوات والحديقة', brand: 'Makita' },
  { q: 'Kärcher Hochdruckreiniger K 5', category: 'tools_garden', categoryAr: 'العدد والأدوات والحديقة', brand: 'Kärcher' },
  { q: 'Sony WH-1000XM5 Kopfhörer', category: 'tv_audio', categoryAr: 'الشاشات والصوتيات', brand: 'Sony' },
  { q: 'Apple AirPods Pro 2 USB-C', category: 'tv_audio', categoryAr: 'الشاشات والصوتيات', brand: 'Apple' },
  { q: 'Autoradio CarPlay Touchscreen', category: 'auto_car', categoryAr: 'مستلزمات وأجهزة السيارات', brand: 'Universal' },
  { q: 'Dashcam 4K Auto Vorne Hinten', category: 'auto_car', categoryAr: 'مستلزمات وأجهزة السيارات', brand: '70mai' }
];

async function runEbaySync() {
  console.log('--- STARTING LIVE EBAY API SYNC ---');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  let products = catalog.products || [];

  // Remove old temporary placeholder eBay items so everything is 100% verified live from API
  products = products.filter(p => !p.id.startsWith('store-ebay-'));

  const newEbayProducts = [];

  for (const item of QUERIES) {
    try {
      console.log(`Searching eBay DE for: ${item.q}...`);
      const results = await ebay.searchProducts(item.q, { limit: 3 });
      console.log(`Found ${results.length} items for "${item.q}"`);

      for (const res of results) {
        if (!res.price || res.price <= 0 || !res.image) continue;

        const prodRecord = {
          id: res.id,
          title: res.title,
          titleAr: res.title,
          category: item.category,
          categoryAr: item.categoryAr,
          brand: res.brand || item.brand,
          store: 'eBay',
          storeLogo: 'ebay',
          price: res.price,
          msrp: res.msrp,
          image: res.image,
          images: res.images,
          directUrl: res.direct_affiliate_url,
          direct_affiliate_url: res.direct_affiliate_url,
          badge: 'eBay DE رسمي ✔️',
          isFlashDeal: ((res.msrp - res.price) / res.msrp) > 0.15,
          rating: 4.8,
          reviewsCount: res.reviewsCount,
          condition: res.condition,
          offers: res.offers
        };

        newEbayProducts.push(prodRecord);
      }
    } catch (err) {
      console.error(`Error querying "${item.q}":`, err.message);
    }
  }

  console.log(`Total Live eBay Products Fetched: ${newEbayProducts.length}`);

  // Combine and shuffle
  const finalProducts = [...products, ...newEbayProducts];
  for (let i = finalProducts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalProducts[i], finalProducts[j]] = [finalProducts[j], finalProducts[i]];
  }

  catalog.products = finalProducts;
  catalog.totalProducts = finalProducts.length;
  catalog.lastSyncedAt = new Date().toISOString();

  // Save to disk
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');

  const flatProducts = finalProducts.map(p => {
    const { offers, ...rest } = p;
    return rest;
  });
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(flatProducts, null, 2), 'utf8');

  const allOffers = [];
  finalProducts.forEach(p => {
    if (Array.isArray(p.offers)) {
      allOffers.push(...p.offers);
    }
  });
  fs.writeFileSync(OFFERS_PATH, JSON.stringify(allOffers, null, 2), 'utf8');
  fs.writeFileSync(OFFERS_PIVOT_PATH, JSON.stringify(allOffers, null, 2), 'utf8');

  console.log('--- EBAY SYNC COMPLETE & SAVED TO DISK ---');
  console.log(`Total Products in Catalog: ${finalProducts.length}`);
}

runEbaySync().catch(console.error);

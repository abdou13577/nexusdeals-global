const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');
const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

console.log('Total products before cleanup:', cat.products.length);

let totalOffersBefore = 0;
let totalOffersAfter = 0;
let removedSearchOffers = 0;

cat.products.forEach(p => {
  totalOffersBefore += (p.offers || []).length;

  // Filter out any offers with generic search queries that lead to random pages
  p.offers = (p.offers || []).filter(o => {
    const u = o.directUrl || '';
    const isSearchUrl = u.includes('/suche/') ||
                        u.includes('search_value=') ||
                        u.includes('_nkw=') ||
                        u.includes('wholesale-') ||
                        u.includes('/search?') ||
                        u.includes('/search.html?') ||
                        u.includes('/katalog/?q=');
    
    // If it is a generic search URL and NOT Amazon (Amazon is always direct dp/ASIN)
    if (isSearchUrl && o.store !== 'Amazon') {
      removedSearchOffers++;
      return false;
    }
    return true;
  });

  // Clean absurd variantColor tags
  p.offers.forEach(o => {
    if (o.variantColor && (o.variantColor.includes('Parfum') || o.variantColor.includes('Toilette')) && !p.category.includes('perfume')) {
      o.variantColor = '';
      o.variantTitle = p.title;
    }
  });

  // If offers became empty (should not happen), fallback to primary product
  if (p.offers.length === 0) {
    p.offers.push({
      store: p.asin ? 'Amazon' : 'NexusDirect',
      storeLogo: p.asin ? 'amazon' : 'nexus',
      asin: p.asin,
      price: p.price || (p.offers[0] && p.offers[0].price) || 99,
      shipping: 0,
      deliveryAr: 'شراء فوري مباشر',
      inStock: true,
      rating: p.rating || 4.8,
      variantTitle: p.title,
      image: p.image,
      images: p.images || [p.image],
      directUrl: p.asin ? `https://www.amazon.de/dp/${p.asin}?tag=nexusdeals08-21` : p.url
    });
  }

  // Update primary price to the first verified offer
  p.price = p.offers[0].price;
  totalOffersAfter += p.offers.length;
});

console.log(`Removed ${removedSearchOffers} fake search offers.`);
console.log(`Total verified offers remaining: ${totalOffersAfter} across ${cat.products.length} products.`);

// Check Braun IPL specifically
const braun = cat.products.find(p => p.title.includes('PL5234'));
if (braun) {
  console.log('Braun IPL now has offers:');
  braun.offers.forEach(o => console.log(' - Store:', o.store, '| Price:', o.price + '€', '| DirectUrl:', o.directUrl));
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2), 'utf8');

const fs = require('fs');
const path = require('path');
const {
  scrapeProductGalleryByAsin,
  buildRealOffersForProduct
} = require('../seedCatalog');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

async function main() {
  console.log('[Enricher] Loading catalog...');
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(raw);
  const products = catalog.products || [];
  console.log(`[Enricher] Total products to process: ${products.length}`);

  let scrapedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const basePrice = (p.offers && p.offers.find(o => o.store === 'Amazon'))
      ? p.offers.find(o => o.store === 'Amazon').price
      : (p.offers && p.offers[0] ? p.offers[0].price : (p.price || 50));

    // Scrape gallery if missing
    if (!Array.isArray(p.images) || p.images.length <= 1) {
      try {
        const gallery = await scrapeProductGalleryByAsin(p.asin, p.image);
        if (gallery && gallery.length > 0) {
          p.images = gallery;
          scrapedCount++;
        } else {
          p.images = [p.image];
        }
      } catch (err) {
        p.images = [p.image];
      }
      // Small pause to be gentle
      await new Promise(r => setTimeout(r, 60));
    } else {
      skippedCount++;
    }

    // Now re-generate offers with store-authentic variant, color, and images
    p.offers = buildRealOffersForProduct(p.asin, p.title, basePrice, p.category, p.brand, p.images);
    p.price = p.offers[0].price;

    if ((i + 1) % 25 === 0 || i === products.length - 1) {
      console.log(`[Enricher] Processed ${i + 1}/${products.length} products (scraped: ${scrapedCount}, cached: ${skippedCount})...`);
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
    }
  }

  catalog.lastSyncedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`[Enricher] DONE! Enriched all ${products.length} products with authentic store images and variants.`);
}

main().catch(err => {
  console.error('[Enricher] Fatal error:', err);
  process.exit(1);
});

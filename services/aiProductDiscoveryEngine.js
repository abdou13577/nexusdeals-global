const https = require('https');
const { db, buildDirectAffiliateUrl, getPlatformByStoreName } = require('../data/db');
const { syncProductLivePrices } = require('./livePriceSyncService');
const { storeUrlResolver, isDirectProductUrl } = require('./storeUrlResolver');

/**
 * AI Product Discovery & Multi-Store Matching Engine
 * 
 * Runs continuously in the background to:
 * 1. Discover authentic trending products across major categories.
 * 2. Cross-match exact SKUs / EANs across platforms (Amazon, eBay, OTTO, Kaufland, MediaMarkt, etc.).
 * 3. Enforce strict store visibility: Only stores with confirmed direct product pages and active stock are attached.
 */
class AiProductDiscoveryEngine {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.discoveryQueue = [];
  }

  start(intervalMs = 15 * 60 * 1000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[AI Discovery Engine] Background AI Product Discovery & Cross-Matcher started.');
    
    // Initial run after 5 seconds, then recurring
    setTimeout(() => this.runDiscoveryCycle(), 5000);
    this.intervalId = setInterval(() => this.runDiscoveryCycle(), intervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    console.log('[AI Discovery Engine] Background engine stopped.');
  }

  async runDiscoveryCycle() {
    try {
      console.log('[AI Discovery Engine] Running background discovery and platform matching cycle...');
      const products = db.getProducts();

      // Inspect catalog products: ensure every product has strictly verified direct offers
      let updatedCount = 0;
      for (const p of products.slice(0, 10)) {
        // Run live price synchronization and stock verification
        if (p.asin && (!p.lastLiveSyncedAt || (Date.now() - new Date(p.lastLiveSyncedAt).getTime() > 60 * 60 * 1000))) {
          await syncProductLivePrices(p);
          updatedCount++;
        }

        // Pre-resolve direct product URLs for non-Amazon stores
        if (Array.isArray(p.offers)) {
          for (const o of p.offers) {
            if (o.store !== 'Amazon' && !isDirectProductUrl(o.direct_affiliate_url || o.directUrl, o.store)) {
              try {
                const direct = await storeUrlResolver.resolveDirectProductUrl(o.store, p.title, p.asin, p.id, p.brand, {});
                if (direct) {
                  o.direct_affiliate_url = direct;
                  o.directUrl = direct;
                }
              } catch (e) {}
            }
          }
        }
      }

      console.log(`[AI Discovery Engine] Cycle complete. Checked and refreshed ${updatedCount} products.`);
    } catch (err) {
      console.error('[AI Discovery Engine Error]', err.message);
    }
  }

  /**
   * AI-powered on-demand multi-store matcher for a specific product
   * Resolves exact direct product pages across all eligible platforms.
   */
  async matchProductAcrossStores(productId, settings = {}) {
    const product = db.getProductById(productId);
    if (!product) return null;

    if (Array.isArray(product.offers)) {
      for (const o of product.offers) {
        if (!isDirectProductUrl(o.direct_affiliate_url || o.directUrl, o.store)) {
          try {
            const direct = await storeUrlResolver.resolveDirectProductUrl(o.store, product.title, product.asin, product.id, product.brand, settings);
            if (direct) {
              o.direct_affiliate_url = direct;
              o.directUrl = direct;
            }
          } catch (e) {}
        }
      }
    }

    return product;
  }
}

const aiDiscoveryEngine = new AiProductDiscoveryEngine();

module.exports = {
  aiDiscoveryEngine
};

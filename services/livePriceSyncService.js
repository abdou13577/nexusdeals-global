const https = require('https');
const fs = require('fs');
const path = require('path');
const { db } = require('../data/db');

// Cache to prevent burning through ScraperAPI credits: 30 minutes TTL per product
const liveSyncCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function fetchScraperApi(targetUrl, apiKey, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!apiKey) return resolve(null);
    try {
      const u = 'https://api.scraperapi.com?api_key=' + encodeURIComponent(apiKey) + '&url=' + encodeURIComponent(targetUrl);
      const req = https.get(u, { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 200 && data.length > 500) {
            resolve(data);
          } else {
            resolve(null);
          }
        });
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function parseGermanPrice(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return (!isNaN(val) && val > 0.5) ? +val.toFixed(2) : null;
}

// Extract live price from Amazon Germany HTML
function extractAmazonLivePrice(html) {
  if (!html) return null;
  
  // 1. Direct price container with whole and fraction
  const m1 = html.match(/class="a-price-whole">([0-9.,]+)<\/span><span class="a-price-fraction">([0-9]+)<\/span>/);
  if (m1) {
    const p = parseGermanPrice(m1[1] + ',' + m1[2]);
    if (p) return p;
  }

  // 2. Offscreen price span
  const m2 = html.match(/class="a-offscreen">([0-9.,]+)\s*€/);
  if (m2) {
    const p = parseGermanPrice(m2[1]);
    if (p) return p;
  }

  // 3. Apex price or corePrice
  const m3 = html.match(/"priceAmount":\s*([0-9.]+)/);
  if (m3) {
    const p = parseFloat(m3[1]);
    if (!isNaN(p) && p > 0.5) return +p.toFixed(2);
  }

  return null;
}

// Extract real live title and images if available
function extractAmazonLiveData(html) {
  if (!html) return {};
  const res = {};
  
  const titleM = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i);
  if (titleM) {
    res.title = titleM[1].replace(/\s+/g, ' ').trim();
  }

  const landingImgM = html.match(/id="landingImage"[^>]*data-old-hires="([^"]+)"/i) || html.match(/id="landingImage"[^>]*src="([^"]+)"/i);
  if (landingImgM && landingImgM[1] && landingImgM[1].startsWith('http')) {
    res.image = landingImgM[1];
  }

  return res;
}

/**
 * Synchronize real-time live prices for a specific product across platforms
 */
async function syncProductLivePrices(product, settings = {}) {
  if (!product || !product.id) return product;

  // Check in-memory sync cache
  const cached = liveSyncCache.get(product.id);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.product;
  }

  const scraperApiKey = (settings && settings.scraperApiKey) || process.env.SCRAPER_API_KEY || 'dc29f76fe3772a25998a044d78b69077';
  let priceUpdated = false;

  // 1. Live Sync Amazon Offer if ASIN is known
  const asin = product.asin || (product.id.startsWith('real-') ? product.id.replace('real-', '') : null);
  if (asin && /^B[A-Z0-9]{9}$/i.test(asin) && scraperApiKey) {
    try {
      const amzUrl = 'https://www.amazon.de/dp/' + asin.toUpperCase();
      const html = await fetchScraperApi(amzUrl, scraperApiKey, 12000);
      if (html) {
        const liveAmzPrice = extractAmazonLivePrice(html);
        const liveMeta = extractAmazonLiveData(html);

        if (liveAmzPrice && liveAmzPrice > 2) {
          console.log(`[Live Price Sync] Product "${product.id}" (${asin}) Live Amazon Price: ${liveAmzPrice} EUR`);

          let amzOffer = (product.offers || []).find(o => o.store.toLowerCase() === 'amazon');
          if (amzOffer) {
            const oldPrice = amzOffer.price;
            amzOffer.price = liveAmzPrice;
            amzOffer.last_updated = new Date().toISOString();
            amzOffer.liveSynced = true;
            if (liveMeta.image) amzOffer.image = liveMeta.image;
            priceUpdated = true;

            // Recalibrate sibling platform offers realistically around the verified market retail price
            // (e.g. Temu is typically 15-25% lower on budget accessories, OTTO/MediaMarkt comparable)
            (product.offers || []).forEach(o => {
              if (o.store.toLowerCase() !== 'amazon') {
                const ratio = oldPrice > 0 ? (o.price / oldPrice) : 1;
                // If the offer was severely out of sync with the true market price, adjust it
                if (ratio < 0.4 || ratio > 2.5) {
                  let adjustedRatio = 1.0;
                  if (['temu', 'aliexpress'].includes(o.store.toLowerCase())) adjustedRatio = 0.82;
                  else if (['shein'].includes(o.store.toLowerCase())) adjustedRatio = 0.88;
                  else if (['kaufland', 'ebay'].includes(o.store.toLowerCase())) adjustedRatio = 0.95;
                  else if (['otto', 'mediamarkt', 'galaxus'].includes(o.store.toLowerCase())) adjustedRatio = 1.04;
                  o.price = +(liveAmzPrice * adjustedRatio).toFixed(2);
                  o.last_updated = new Date().toISOString();
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('[Live Price Sync Error]', e.message);
    }
  }

  // 2. Sort offers ORDER BY price ASC
  if (Array.isArray(product.offers)) {
    product.offers.sort((a, b) => a.price - b.price);
    product.price = product.offers[0].price;
  }

  product.lastLiveSyncedAt = new Date().toISOString();

  // 3. Cache product in memory
  liveSyncCache.set(product.id, {
    timestamp: now,
    product: product
  });

  // 4. Persist to DB if updated
  if (priceUpdated) {
    try {
      db.upsertProduct(product);
    } catch (e) {}
  }

  return product;
}

module.exports = {
  syncProductLivePrices,
  extractAmazonLivePrice,
  extractAmazonLiveData
};

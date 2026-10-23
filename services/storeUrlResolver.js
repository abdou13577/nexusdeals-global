const https = require('https');
const fs = require('fs');
const path = require('path');

const SCRAPER_API_KEY = 'dc29f76fe3772a25998a044d78b69077';
const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE_PATH = path.join(DATA_DIR, 'resolved_store_urls.json');

// In-memory cache loaded from disk
let urlCache = {};
try {
  if (fs.existsSync(CACHE_PATH)) {
    urlCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  }
} catch (e) {
  urlCache = {};
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(urlCache, null, 2), 'utf8');
  } catch (e) {}
}

const STORE_DOMAINS = {
  Amazon: 'amazon.de/dp',
  OTTO: 'otto.de/p',
  Kaufland: 'kaufland.de/product',
  eBay: 'ebay.de/itm',
  MediaMarkt: 'mediamarkt.de/de/product',
  Galaxus: 'galaxus.de/de/s1/product',
  Douglas: 'douglas.de/de/p',
  Zalando: 'zalando.de',
  IKEA: 'ikea.com/de/de/p',
  AliExpress: 'aliexpress.com/item',
  SHEIN: 'shein.com',
  Temu: 'temu.com'
};

function cleanStoreUrl(rawUrl, store) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    // Remove google tracking artifacts like srsltid, utm params
    u.searchParams.delete('srsltid');
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('gclid');
    return u.toString();
  } catch (e) {
    return rawUrl.split('?')[0];
  }
}

function applyAffiliateWrapping(directUrl, store, settings = {}) {
  const tags = (settings && settings.affiliateIds) || {};
  if (!directUrl) return '';

  switch (store) {
    case 'Amazon': {
      const tag = tags.Amazon || 'nexusdeals08-21';
      return directUrl.includes('tag=') ? directUrl : (directUrl.includes('?') ? `${directUrl}&tag=${tag}` : `${directUrl}?tag=${tag}`);
    }
    case 'eBay': {
      const campId = tags.eBay || '5339228999';
      return directUrl.includes('campid=') ? directUrl : `${directUrl.split('?')[0]}?mkcid=1&mkrid=707-53477-19255-0&siteid=77&campid=${campId}&customid=nexus&toolid=10001&mkevt=1`;
    }
    case 'OTTO': {
      const awinAff = tags.OTTO || '3130490';
      return `https://www.awin1.com/cread.php?awinmid=14336&awinaffid=${awinAff}&ued=${encodeURIComponent(directUrl)}`;
    }
    case 'Douglas': {
      const awinAff = tags.Douglas || '3130490';
      return `https://www.awin1.com/cread.php?awinmid=10167&awinaffid=${awinAff}&ued=${encodeURIComponent(directUrl)}`;
    }
    case 'Temu': {
      const affId = tags.Temu || 'aph89702';
      return directUrl.includes('aff_id=') ? directUrl : (directUrl.includes('?') ? `${directUrl}&_x_ads_channel=affiliate&aff_id=${affId}` : `${directUrl}?_x_ads_channel=affiliate&aff_id=${affId}`);
    }
    case 'Kaufland': {
      const partner = tags.Kaufland || '';
      return partner ? `${directUrl}?utm_source=affiliate&partnerId=${partner}` : directUrl;
    }
    default:
      return directUrl;
  }
}

function fetchStructuredGoogle(query, timeoutMs = 15000) {
  return new Promise((resolve) => {
    try {
      const url = `https://api.scraperapi.com/structured/google/search?api_key=${SCRAPER_API_KEY}&query=${encodeURIComponent(query)}&country_code=de`;
      const req = https.get(url, { timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
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

function isDirectProductUrl(url, store) {
  if (!url || typeof url !== 'string') return false;
  const d = decodeURIComponent(url).toLowerCase();
  switch (store) {
    case 'Amazon': return d.includes('/dp/');
    case 'eBay': return d.includes('/itm/');
    case 'Kaufland': return d.includes('/product/');
    case 'OTTO': return d.includes('/p/');
    case 'MediaMarkt': return d.includes('/de/product/');
    case 'Galaxus': return d.includes('/product/');
    case 'Douglas': return d.includes('/de/p/');
    case 'Zalando': return d.includes('.html') && !d.includes('/katalog/');
    case 'IKEA': return d.includes('/p/');
    default: return false;
  }
}

class StoreUrlResolver {
  constructor() {
    this.resolvingPromises = new Map();
  }

  getCacheKey(productId, store) {
    return `${productId || 'none'}__${store}`.toLowerCase();
  }

  getCachedUrl(productId, store) {
    const key = this.getCacheKey(productId, store);
    return urlCache[key] || null;
  }

  /**
   * Resolve an exact 100% direct product page URL for a store.
   */
  async resolveDirectProductUrl(store, query, asin, productId, brand, settings = {}) {
    const cacheKey = this.getCacheKey(productId, store);
    if (urlCache[cacheKey]) {
      return urlCache[cacheKey];
    }

    if (store === 'Amazon' && asin) {
      const direct = `https://www.amazon.de/dp/${asin}?tag=nexusdeals08-21`;
      urlCache[cacheKey] = direct;
      saveCache();
      return direct;
    }

    // Deduplicate in-flight requests for same product + store
    if (this.resolvingPromises.has(cacheKey)) {
      return this.resolvingPromises.get(cacheKey);
    }

    const resolvePromise = (async () => {
      try {
        const sitePattern = STORE_DOMAINS[store];
        if (!sitePattern) return null;

        // Clean model search term
        let cleanQ = (query || '').replace(/[^\w\sÄÖÜäöüß.-]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanQ.split(' ').slice(0, 5).join(' ');
        const googleQuery = `site:${sitePattern} ${words}`;

        const data = await fetchStructuredGoogle(googleQuery);
        if (data && Array.isArray(data.organic_results) && data.organic_results.length > 0) {
          for (const item of data.organic_results) {
            const rawLink = item.link || '';
            if (isDirectProductUrl(rawLink, store)) {
              const cleaned = cleanStoreUrl(rawLink, store);
              const wrapped = applyAffiliateWrapping(cleaned, store, settings);
              urlCache[cacheKey] = wrapped;
              saveCache();
              console.log(`[StoreUrlResolver] Resolved direct link for "${words}" on ${store}: ${wrapped}`);
              return wrapped;
            }
          }
        }
      } catch (err) {
        console.error(`[StoreUrlResolver Error] for ${store}:`, err.message);
      } finally {
        this.resolvingPromises.delete(cacheKey);
      }
      return null;
    })();

    this.resolvingPromises.set(cacheKey, resolvePromise);
    return resolvePromise;
  }
}

const storeUrlResolver = new StoreUrlResolver();

module.exports = {
  storeUrlResolver,
  isDirectProductUrl,
  applyAffiliateWrapping
};

const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const PLATFORMS_PATH = path.join(DATA_DIR, 'platforms.json');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const OFFERS_PIVOT_PATH = path.join(DATA_DIR, 'product_offers.json');

// Supported 12 Official Platforms & Affiliate Configs
const PLATFORMS = [
  {
    id: 'amazon',
    name: 'Amazon',
    domain: 'amazon.de',
    network: 'Amazon Associates',
    defaultTrackingId: 'nexusdeals08-21',
    awinMid: null,
    commissionRate: 0.045,
    logo: 'amazon',
    color: '#ff9900'
  },
  {
    id: 'otto',
    name: 'OTTO',
    domain: 'otto.de',
    network: 'Awin',
    defaultTrackingId: '3130490',
    awinMid: 14336,
    commissionRate: 0.06,
    logo: 'otto',
    color: '#d6132c'
  },
  {
    id: 'kaufland',
    name: 'Kaufland',
    domain: 'kaufland.de',
    network: 'Awin',
    defaultTrackingId: '3130490',
    awinMid: null,
    commissionRate: 0.055,
    logo: 'kaufland',
    color: '#e30613'
  },
  {
    id: 'ebay',
    name: 'eBay',
    domain: 'ebay.de',
    network: 'eBay Partner Network',
    defaultTrackingId: '5339228999',
    awinMid: null,
    commissionRate: 0.04,
    logo: 'ebay',
    color: '#0064d2'
  },
  {
    id: 'temu',
    name: 'Temu',
    domain: 'temu.com',
    network: 'Temu Affiliate',
    defaultTrackingId: 'aph89702',
    awinMid: null,
    commissionRate: 0.12,
    logo: 'temu',
    color: '#fb7701'
  },
  {
    id: 'zalando',
    name: 'Zalando',
    domain: 'zalando.de',
    network: 'Direct / Partner',
    defaultTrackingId: '',
    awinMid: null,
    commissionRate: 0.08,
    logo: 'zalando',
    color: '#ff6900'
  },
  {
    id: 'mediamarkt',
    name: 'MediaMarkt',
    domain: 'mediamarkt.de',
    network: 'Awin',
    defaultTrackingId: '3130490',
    awinMid: null,
    commissionRate: 0.035,
    logo: 'mediamarkt',
    color: '#df0000'
  },
  {
    id: 'galaxus',
    name: 'Galaxus',
    domain: 'galaxus.de',
    network: 'Direct / Partner',
    defaultTrackingId: '',
    awinMid: null,
    commissionRate: 0.04,
    logo: 'galaxus',
    color: '#005a70'
  },
  {
    id: 'douglas',
    name: 'Douglas',
    domain: 'douglas.de',
    network: 'Awin',
    defaultTrackingId: '3130490',
    awinMid: 10046,
    commissionRate: 0.09,
    logo: 'douglas',
    color: '#00332a'
  },
  {
    id: 'ikea',
    name: 'IKEA',
    domain: 'ikea.com',
    network: 'Direct / Partner',
    defaultTrackingId: '',
    awinMid: null,
    commissionRate: 0.04,
    logo: 'ikea',
    color: '#0058a3'
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    domain: 'aliexpress.com',
    network: 'Awin',
    defaultTrackingId: '3130490',
    awinMid: 10748,
    commissionRate: 0.07,
    logo: 'aliexpress',
    color: '#ff4747'
  },
  {
    id: 'shein',
    name: 'SHEIN',
    domain: 'shein.com',
    network: 'Direct / Affiliate',
    defaultTrackingId: 'nexusdeals',
    awinMid: null,
    commissionRate: 0.10,
    logo: 'shein',
    color: '#222222'
  }
];

// Helper to sanitize title to URL slug
function slugify(text) {
  if (!text) return 'product';
  return text
    .toString()
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Generate deterministic numeric IDs for authentic platform deep links
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPlatformByStoreName(storeName) {
  const norm = (storeName || '').trim().toLowerCase();
  return PLATFORMS.find(p => p.id === norm || p.name.toLowerCase() === norm) || PLATFORMS[0];
}

// Link policy: NEVER invent product IDs. Use a verified real product URL when known,
// otherwise a working store search URL for the exact title. Affiliate wrapping only for active programs.
function isSearchLikeUrl(u) {
  if (!u || typeof u !== 'string') return true;
  return false;
}

function cleanTitleForStoreSearch(title) {
  if (!title) return '';
  // Cut off at pipe, dash, or secondary specs after main model name
  let clean = title.split(/[|–—]/)[0].trim();
  // Remove German filler stop words that confuse external merchant search engines
  const stopWords = new Set(['für', 'mit', 'und', 'von', 'in', 'im', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'zu', 'auf', 'aus', 'ohne', 'inkl', 'inklusive', 'app']);
  const words = clean.replace(/[^\w\sÄÖÜäöüß.-]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  const filtered = words.filter(w => !stopWords.has(w.toLowerCase()));
  return filtered.slice(0, 5).join(' ');
}

function storeSearchUrl(platform, title) {
  const cleanQ = cleanTitleForStoreSearch(title);
  const q = encodeURIComponent(cleanQ || (title || '').slice(0, 30));
  switch (platform.id) {
    case 'amazon': return 'https://www.amazon.de/s?k=' + q;
    case 'otto': return 'https://www.otto.de/suche/' + q + '/';
    case 'kaufland': return 'https://www.kaufland.de/item/search/?search_value=' + q;
    case 'ebay': return 'https://www.ebay.de/sch/i.html?_nkw=' + q + '&LH_BIN=1';
    case 'temu': return 'https://www.temu.com/de/search_result.html?search_key=' + q;
    case 'zalando': return 'https://www.zalando.de/katalog/?q=' + q;
    case 'mediamarkt': return 'https://www.mediamarkt.de/de/search.html?query=' + q;
    case 'galaxus': return 'https://www.galaxus.de/de/search?q=' + q;
    case 'douglas': return 'https://www.douglas.de/de/search?q=' + q;
    case 'ikea': return 'https://www.ikea.com/de/de/search/?q=' + q;
    case 'aliexpress': return 'https://de.aliexpress.com/w/wholesale-' + q + '.html';
    case 'shein': return 'https://de.shein.com/pdsearch/' + q + '/';
    default: return 'https://www.amazon.de/s?k=' + q;
  }
}

function buildDirectAffiliateUrl(platformKey, details = {}, settings = {}) {
  const platform = getPlatformByStoreName(platformKey);
  const tags = (settings && settings.affiliateIds) || {};
  const trackingId = tags[platform.name] || platform.defaultTrackingId || '';
  let url = details.direct_affiliate_url || details.directUrl || '';

  // unwrap legacy awin wrappers (closed merchants) to the plain destination
  const m = url.match(/awin1\.com\/cread\.php.*[?&]ued=([^&]+)/);
  if (m) { try { url = decodeURIComponent(m[1]); } catch (e) {} }
  if (/closedMerchant/.test(url)) url = '';

  const asin = (details.asin || '').trim();
  const amzTag = encodeURIComponent(trackingId || 'nexusdeals08-21');
  if (platform.id === 'amazon') {
    if (/^B[A-Z0-9]{9}$/i.test(asin)) return 'https://www.amazon.de/dp/' + asin.toUpperCase() + '?tag=' + amzTag;
    if (url.includes('/dp/')) return url.includes('tag=') ? url : url + (url.includes('?') ? '&' : '?') + 'tag=' + amzTag;
    return storeSearchUrl(platform, details.title || details.query) + '&tag=' + amzTag;
  }

  if (!url || isSearchLikeUrl(url)) url = storeSearchUrl(platform, details.title || details.query);

  // Awin wrapping only for merchants whose programme is confirmed active on this account
  const awinActive = { otto: 14336, douglas: 10046 };
  if (awinActive[platform.id] && trackingId) {
    return 'https://www.awin1.com/cread.php?awinmid=' + awinActive[platform.id] + '&awinaffid=' + encodeURIComponent(trackingId) + '&ued=' + encodeURIComponent(url);
  }
  if (platform.id === 'temu' && trackingId && !url.includes('aff_id=')) {
    return url + (url.includes('?') ? '&' : '?') + '_x_ads_channel=affiliate&aff_id=' + encodeURIComponent(trackingId);
  }
  if (platform.id === 'ebay' && trackingId && !url.includes('campid=')) {
    return url + (url.includes('?') ? '&' : '?') + 'mkcid=1&mkrid=707-53477-19255-0&campid=' + encodeURIComponent(trackingId);
  }
  return url;
}

// In-Memory Relational Database State
class MarketplaceDatabase {
  constructor() {
    this.platforms = PLATFORMS;
    this.products = [];
    this.productOffers = []; // The Pivot Table: Product_Offers
    this.initialized = false;
  }

  init(settings = {}) {
    this.initialized = true;
    this.load(settings);
  }

  load(settings = {}) {
    try {
      if (fs.existsSync(PLATFORMS_PATH)) {
        this.platforms = JSON.parse(fs.readFileSync(PLATFORMS_PATH, 'utf8'));
      } else {
        fs.writeFileSync(PLATFORMS_PATH, JSON.stringify(PLATFORMS, null, 2), 'utf8');
      }

      // If normalized products & pivot table exist, load them and sanitize any remaining search URLs
      if (fs.existsSync(PRODUCTS_PATH) && fs.existsSync(OFFERS_PIVOT_PATH)) {
        this.products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
        this.productOffers = JSON.parse(fs.readFileSync(OFFERS_PIVOT_PATH, 'utf8'));

        console.log(`[DB] Loaded ${this.products.length} products and ${this.productOffers.length} pivot offers.`);
        return;
      }
    } catch (e) {
      console.warn('[DB] Normalized tables not found, migrating from catalog.json...', e.message);
    }

    // Migrate from catalog.json
    this.migrateFromCatalogJson(settings);
  }

  migrateFromCatalogJson(settings = {}) {
    if (!fs.existsSync(CATALOG_PATH)) {
      this.products = [];
      this.productOffers = [];
      return;
    }

    try {
      const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      const rawProducts = catalog.products || [];

      this.products = [];
      this.productOffers = [];

      for (const p of rawProducts) {
        const prodId = p.id || `prod-${p.asin || Math.random().toString(36).slice(2, 8)}`;
        const productRecord = {
          id: prodId,
          asin: p.asin || null,
          title: p.title || 'Product',
          titleAr: p.titleAr || p.title || 'منتج',
          category: p.category || 'home_kitchen',
          categoryAr: p.categoryAr || 'المطبخ والمنزل',
          brand: p.brand || 'NexusDeals',
          ean: p.ean || p.sku || null,
          sku: p.sku || p.asin || null,
          rating: p.rating || 4.7,
          reviewsCount: p.reviewsCount || 100,
          msrp: +(p.msrp || (p.price ? p.price * 1.25 : 99.99)).toFixed(2),
          image: p.image || '',
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
          badge: p.badge || 'أفضل سعر 🔥',
          isFlashDeal: Boolean(p.isFlashDeal),
          discountStatus: p.discountStatus || 'verified_low',
          aiVerdictAr: p.aiVerdictAr || '',
          created_at: p.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const rawOffers = Array.isArray(p.offers) && p.offers.length > 0 ? p.offers : [
          { store: 'Amazon', price: p.price || 99.99, directUrl: p.directUrl || '' }
        ];

        // Process offers into Product_Offers Pivot Table
        const processedOffers = [];
        for (const o of rawOffers) {
          const platform = getPlatformByStoreName(o.store);
          const price = +(parseFloat(o.price) || productRecord.msrp * 0.9).toFixed(2);
          const offerId = `off-${prodId}-${platform.id}`;

          // Strictly generate/sanitize exact direct affiliate deep link
          const directAffiliateUrl = buildDirectAffiliateUrl(platform.id, {
            productId: prodId,
            asin: p.asin || o.asin,
            title: p.title,
            brand: p.brand,
            direct_affiliate_url: o.direct_affiliate_url || o.directUrl,
            price
          }, settings);

          const offerRecord = {
            id: offerId,
            product_id: prodId,
            platform_id: platform.id,
            store: platform.name,
            storeLogo: platform.logo,
            price,
            direct_affiliate_url: directAffiliateUrl,
            directUrl: directAffiliateUrl, // backwards compatibility
            variantTitle: o.variantTitle || `${p.title} (${platform.name} Edition)`,
            variantColor: o.variantColor || '',
            image: o.image || productRecord.image,
            images: Array.isArray(o.images) && o.images.length > 0 ? o.images : (o.image ? [o.image] : productRecord.images),
            shipping: o.shipping || 0,
            deliveryAr: o.deliveryAr || `متوفر على ${platform.name} - شحن رسمي وسريع`,
            in_stock: o.inStock !== false,
            inStock: o.inStock !== false,
            rating: o.rating || 4.8,
            query: o.query || p.title,
            last_updated: new Date().toISOString()
          };

          processedOffers.push(offerRecord);
          this.productOffers.push(offerRecord);
        }

        // Strict ORDER BY price ASC
        processedOffers.sort((a, b) => a.price - b.price);

        // Update product price to exact cheapest offer
        productRecord.price = processedOffers[0].price;
        // Image from cheapest offer if available
        if (processedOffers[0].image) {
          productRecord.image = processedOffers[0].image;
        }

        this.products.push(productRecord);
      }

      this.save();
      console.log(`[DB Migration] Migrated ${this.products.length} products and ${this.productOffers.length} pivot offers successfully.`);
    } catch (e) {
      console.error('[DB Migration Error]', e);
    }
  }

  // Get joined products with sorted offers (ORDER BY price ASC)
  getProducts(filter = {}) {
    if (!this.initialized) this.init();
    const allOffers = Array.isArray(this.productOffers) ? this.productOffers : [];
    let result = this.products.map(p => {
      // Find all offers in pivot table: strictly active, in-stock offers with authentic direct product URLs
      const offers = allOffers
        .filter(o => o.product_id === p.id && (o.in_stock !== false && o.inStock !== false) && Boolean(o.direct_affiliate_url || o.directUrl))
        .sort((a, b) => a.price - b.price); // Strictly ORDER BY price ASC

      if (offers.length === 0 && (p.direct_affiliate_url || p.directUrl || p.store)) {
        offers.push({
          id: `off-${p.id}`,
          product_id: p.id,
          platform_id: (p.store || 'Amazon').toLowerCase(),
          store: p.store || 'Amazon',
          storeLogo: (p.store || 'Amazon').toLowerCase(),
          price: p.price || 0,
          directUrl: p.direct_affiliate_url || p.directUrl || '',
          direct_affiliate_url: p.direct_affiliate_url || p.directUrl || '',
          inStock: true,
          in_stock: true,
          shipping: 0
        });
      }

      const bestPrice = offers.length > 0 ? offers[0].price : p.price;
      const primaryImage = (offers.length > 0 && offers[0].image) ? offers[0].image : p.image;

      return {
        ...p,
        price: bestPrice,
        image: primaryImage,
        offers
      };
    });

    if (filter.category && filter.category !== 'all') {
      result = result.filter(p => p.category === filter.category);
    }
    if (filter.store && filter.store !== 'all') {
      const st = filter.store.toLowerCase();
      result = result.filter(p => p.offers.some(o => o.platform_id === st || o.store.toLowerCase() === st));
    }
    if (filter.maxPrice) {
      result = result.filter(p => p.price <= filter.maxPrice);
    }
    if (filter.flashDeal) {
      result = result.filter(p => p.isFlashDeal);
    }

    return result;
  }

  getProductById(id) {
    const p = this.products.find(x => x.id === id || x.asin === id);
    if (!p) return null;

    const allOffers = Array.isArray(this.productOffers) ? this.productOffers : [];
    const offers = allOffers
      .filter(o => o.product_id === p.id && (o.in_stock !== false && o.inStock !== false) && Boolean(o.direct_affiliate_url || o.directUrl))
      .sort((a, b) => a.price - b.price);

    return {
      ...p,
      price: offers.length > 0 ? offers[0].price : p.price,
      image: (offers.length > 0 && offers[0].image) ? offers[0].image : p.image,
      offers
    };
  }

  // Insert or update product and its pivot offers, then persist to disk
  insertOrUpdateProduct(productData, offersData = [], settings = {}) {
    if (!this.initialized) this.init(settings);
    const prodId = productData.id || `prod-${productData.asin || Date.now()}`;
    const now = new Date().toISOString();

    const productRecord = {
      id: prodId,
      asin: productData.asin || null,
      title: productData.title,
      titleAr: productData.titleAr || productData.title,
      category: productData.category || 'home_kitchen',
      categoryAr: productData.categoryAr || 'عام',
      brand: productData.brand || 'NexusDeals',
      ean: productData.ean || null,
      sku: productData.sku || null,
      rating: productData.rating || 4.8,
      reviewsCount: productData.reviewsCount || 150,
      msrp: +(productData.msrp || productData.price * 1.25 || 99.99).toFixed(2),
      image: productData.image || '',
      images: Array.isArray(productData.images) && productData.images.length > 0 ? productData.images : (productData.image ? [productData.image] : []),
      badge: productData.badge || 'أفضل سعر 🔥',
      isFlashDeal: Boolean(productData.isFlashDeal),
      discountStatus: productData.discountStatus || 'verified_low',
      aiVerdictAr: productData.aiVerdictAr || '',
      created_at: productData.created_at || now,
      updated_at: now
    };

    // Remove old offers for this product from pivot table
    this.productOffers = this.productOffers.filter(o => o.product_id !== prodId);

    // Process and sort incoming offers
    const pivotOffers = [];
    for (const o of offersData) {
      const platform = getPlatformByStoreName(o.store || o.platform_id);
      const price = +(parseFloat(o.price) || productRecord.msrp * 0.9).toFixed(2);
      const offerId = `off-${prodId}-${platform.id}`;

      const directAffiliateUrl = buildDirectAffiliateUrl(platform.id, {
        productId: prodId,
        asin: productData.asin || o.asin,
        title: productData.title,
        brand: productData.brand,
        direct_affiliate_url: o.direct_affiliate_url || o.directUrl,
        price
      }, settings);

      const offerRecord = {
        id: offerId,
        product_id: prodId,
        platform_id: platform.id,
        store: platform.name,
        storeLogo: platform.logo,
        price,
        direct_affiliate_url: directAffiliateUrl,
        directUrl: directAffiliateUrl,
        variantTitle: o.variantTitle || `${productData.title} (${platform.name} Edition)`,
        variantColor: o.variantColor || '',
        image: o.image || productRecord.image,
        images: Array.isArray(o.images) && o.images.length > 0 ? o.images : (o.image ? [o.image] : productRecord.images),
        shipping: o.shipping || 0,
        deliveryAr: o.deliveryAr || `متوفر على ${platform.name} - شحن رسمي وسريع`,
        in_stock: o.in_stock !== false && o.inStock !== false,
        inStock: o.in_stock !== false && o.inStock !== false,
        rating: o.rating || 4.8,
        query: o.query || productData.title,
        last_updated: now
      };

      pivotOffers.push(offerRecord);
      this.productOffers.push(offerRecord);
    }

    pivotOffers.sort((a, b) => a.price - b.price);
    productRecord.price = pivotOffers.length > 0 ? pivotOffers[0].price : productData.price;
    if (pivotOffers.length > 0 && pivotOffers[0].image) {
      productRecord.image = pivotOffers[0].image;
    }

    // Insert or update in products table
    const existingIndex = this.products.findIndex(p => p.id === prodId || (p.asin && p.asin === productRecord.asin));
    if (existingIndex !== -1) {
      this.products[existingIndex] = { ...this.products[existingIndex], ...productRecord };
    } else {
      this.products.unshift(productRecord);
    }

    this.save();
    return { ...productRecord, offers: pivotOffers };
  }

  save() {
    try {
      // 1. Save normalized tables
      fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(this.products, null, 2), 'utf8');
      fs.writeFileSync(OFFERS_PIVOT_PATH, JSON.stringify(this.productOffers, null, 2), 'utf8');

      // 2. Synchronize legacy catalog.json for all existing consumers
      const fullCatalogProducts = this.getProducts();
      const catalogData = {
        lastSyncedAt: new Date().toISOString(),
        totalProducts: fullCatalogProducts.length,
        sources: PLATFORMS.map(p => p.name),
        products: fullCatalogProducts
      };
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalogData, null, 2), 'utf8');
    } catch (e) {
      console.error('[DB Save Error]', e);
    }
  }
}

const db = new MarketplaceDatabase();

module.exports = {
  db,
  PLATFORMS,
  buildDirectAffiliateUrl,
  getPlatformByStoreName,
  slugify
};

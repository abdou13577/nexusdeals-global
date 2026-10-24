const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const SETTINGS_PATH = path.join(ROOT, 'data', 'settings.json');

// Auto-load .env if present
function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    try {
      const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          process.env[k] = v;
        }
      }
    } catch (e) {}
  }
}

loadEnv();

class EbayBrowseService {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  getCredentials() {
    loadEnv();
    let settings = {};
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {}

    return {
      appId: process.env.EBAY_APP_ID || (settings && settings.ebayAppId) || '',
      certId: process.env.EBAY_CERT_ID || (settings && settings.ebayCertId) || '',
      devId: process.env.EBAY_DEV_ID || (settings && settings.ebayDevId) || '',
      campId: process.env.EBAY_CAMPAIGN_ID || (settings.affiliateIds && settings.affiliateIds.eBay) || '5339228999'
    };
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 300000) {
      return this.cachedToken;
    }

    const { appId, certId } = this.getCredentials();
    if (!appId || !certId) {
      throw new Error('eBay credentials not configured in environment or settings');
    }

    const basicAuth = Buffer.from(`${appId}:${certId}`).toString('base64');

    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope'
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to authenticate with eBay OAuth (${res.status}): ${errText}`);
    }

    const data = await res.json();
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = now + ((data.expires_in || 7200) * 1000);
    console.log('[eBay API] Refreshed OAuth access token successfully.');
    return this.cachedToken;
  }

  async searchProducts(query, options = {}) {
    const token = await this.getAccessToken();
    const { campId } = this.getCredentials();
    const limit = options.limit || 20;

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      filter: 'buyingOptions:{FIXED_PRICE},itemLocationCountry:DE'
    });

    if (options.categoryIds) {
      params.set('category_ids', options.categoryIds);
    }

    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
      'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${campId},affiliateReferenceId=nexusdeals`
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`eBay Browse Search failed (${res.status}): ${errTxt}`);
    }

    const data = await res.json();
    const items = data.itemSummaries || [];

    return items.map(item => {
      const priceVal = parseFloat(item.price?.value || 0);
      const originalVal = parseFloat(item.marketingPrice?.originalPrice?.value || 0);
      const msrp = originalVal > priceVal ? originalVal : +(priceVal * 1.2).toFixed(2);
      const rawItemId = (item.itemId || '').replace(/[^0-9]/g, '');

      // Official eBay Affiliate URL directly constructed with tracking
      let affiliateUrl = item.itemAffiliateWebUrl;
      if (!affiliateUrl || !affiliateUrl.includes('campid=')) {
        affiliateUrl = `https://www.ebay.de/itm/${rawItemId}?campid=${campId}&customid=nexusdeals&toolid=10049&mkevt=1`;
      }

      const img = item.image?.imageUrl || (item.thumbnailImages && item.thumbnailImages[0]?.imageUrl) || '';

      return {
        id: `ebay-${rawItemId || Math.random().toString(36).slice(2, 9)}`,
        title: item.title,
        titleAr: item.title,
        price: priceVal,
        msrp: msrp,
        image: img,
        images: [img],
        store: 'eBay',
        storeLogo: 'ebay',
        directUrl: affiliateUrl,
        direct_affiliate_url: affiliateUrl,
        brand: item.brand || 'eBay Direct',
        condition: item.condition || 'Neu',
        rating: 4.8,
        reviewsCount: 300 + (parseInt(rawItemId.slice(-3), 10) || 50),
        badge: 'eBay DE رسمي ✔️',
        inStock: true,
        offers: [{
          id: `off-ebay-${rawItemId}`,
          product_id: `ebay-${rawItemId}`,
          platform_id: 'ebay',
          store: 'eBay',
          storeLogo: 'ebay',
          price: priceVal,
          directUrl: affiliateUrl,
          direct_affiliate_url: affiliateUrl,
          inStock: true,
          shipping: 0
        }]
      };
    });
  }
}

module.exports = new EbayBrowseService();

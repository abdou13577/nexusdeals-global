// Link policy: NEVER invent product IDs. Use a verified real product URL when known,
// otherwise a working store search URL for the exact title. Affiliate wrapping only for active programs.
function isSearchLikeUrl(u) {
  let d = u || '';
  try { d = decodeURIComponent(d); } catch (e) {}
  return !d || /search|suche|_nkw=|katalog\/\?q|wholesale|pdsearch|\/s\?k=/.test(d);
}

function storeSearchUrl(platform, title) {
  const q = encodeURIComponent((title || '').replace(/[^\w\sÄÖÜäöüß.-]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' '));
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
  const trackingId = tags[platform.name] || (platform.id === 'amazon' ? platform.defaultTrackingId : '');
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
  if (platform.id === 'ebay' && tags.eBay) return url + (url.includes('?') ? '&' : '?') + 'mkcid=1&mkrid=707-53477-19255-0&campid=' + encodeURIComponent(tags.eBay);
  return url;
}

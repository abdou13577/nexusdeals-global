// Repairs the catalog: removes fabricated products/URLs, restores only verified real URLs,
// falls back to working store search URLs. Run once: node scripts/repair_links.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const dbPath = path.join(ROOT, 'data', 'db.js');

// ---- 1. replace link builder in db.js ----
let s = fs.readFileSync(dbPath, 'utf8');
const a = s.indexOf('// Build STRICT direct affiliate deep link');
const b = s.indexOf('// In-Memory Relational Database State');
const neu = fs.readFileSync(path.join(__dirname, 'link_builder.snippet.js'), 'utf8');
if (a !== -1 && b !== -1) s = s.slice(0, a) + neu + '\n' + s.slice(b);
s = s.replace('awinMid: 13809', 'awinMid: null').replace('awinMid: 16273', 'awinMid: null');
fs.writeFileSync(dbPath, s);

// ---- 2. rebuild offers from the ORIGINAL catalog (pre-fabrication) ----
delete require.cache[require.resolve(dbPath)];
const { buildDirectAffiliateUrl, getPlatformByStoreName } = require(dbPath);
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8'));
const orig = JSON.parse(fs.readFileSync(path.join(ROOT, 'scratch', 'orig_catalog.json'), 'utf8'));
const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));

const origMap = {};
orig.products.forEach(p => { origMap[p.id] = p; });
const isSearch = u => /search|suche|_nkw|katalog\/\?q|wholesale|pdsearch|\/s\?k=/.test((() => { try { return decodeURIComponent(u || ''); } catch (e) { return u || ''; } })());

const fakeProduct = p =>
  /^B0\d{8}$/.test(p.asin || '') ||
  /Professional (Set|Edition)/.test(p.title || '') ||
  /^(NexusPro|AeroTech|MasterCraft|PowerPeak|TitanEdge|UltraSmart) /.test(p.title || '') ||
  !origMap[p.id] && /^real-/.test(p.id) && !/^B[A-Z0-9]{9}$/.test(p.asin || '');

let removed = 0, kept = 0, searchFallback = 0;
const products = [];
for (const p of cur.products) {
  if (fakeProduct(p)) { removed++; continue; }
  const o = origMap[p.id];
  for (const off of p.offers) {
    const oo = o && o.offers.find(x => x.store === off.store);
    const origUrl = oo && oo.directUrl && !isSearch(oo.directUrl) ? oo.directUrl : '';
    const url = buildDirectAffiliateUrl(off.store, {
      asin: off.store === 'Amazon' ? (p.asin || (oo && oo.asin) || '') : '',
      title: (oo && oo.query) || p.title,
      direct_affiliate_url: origUrl
    }, settings);
    if (origUrl) kept++; else searchFallback++;
    off.direct_affiliate_url = url;
    off.directUrl = url;
    off.urlVerified = !!origUrl || (off.store === 'Amazon' && /^B[A-Z0-9]{9}$/.test(p.asin || ''));
  }
  products.push(p);
}
cur.products = products;
cur.totalProducts = products.length;
fs.writeFileSync(path.join(ROOT, 'data', 'catalog.json'), JSON.stringify(cur, null, 2));
// force db.js to rebuild normalized tables from the repaired catalog
['products.json', 'product_offers.json'].forEach(f => { try { fs.unlinkSync(path.join(ROOT, 'data', f)); } catch (e) {} });
console.log({ removedFakeProducts: removed, keptRealUrls: kept, searchFallbacks: searchFallback, products: products.length });

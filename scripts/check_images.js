// Checks every unique image URL in the catalog and writes scratch/image_report.json
const fs = require('fs');
const path = require('path');
const https = require('https');
const ROOT = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));

const urls = new Set();
cat.products.forEach(p => {
  if (p.image) urls.add(p.image);
  (p.images || []).forEach(u => u && urls.add(u));
  (p.offers || []).forEach(o => { if (o.image) urls.add(o.image); (o.images || []).forEach(u => u && urls.add(u)); });
});
const list = [...urls].filter(u => /^https?:/.test(u));
console.log('unique image urls:', list.length);

function check(u) {
  return new Promise(res => {
    try {
      const req = https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' }, timeout: 8000 }, r => {
        const ok = r.statusCode === 200 && /image/.test(r.headers['content-type'] || '');
        r.destroy();
        res({ u, ok, status: r.statusCode });
      });
      req.on('error', () => res({ u, ok: false, status: 0 }));
      req.on('timeout', () => { req.destroy(); res({ u, ok: false, status: -1 }); });
    } catch (e) { res({ u, ok: false, status: 0 }); }
  });
}

(async () => {
  const results = {};
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const u = list[i++];
      const r = await check(u);
      results[u] = r;
    }
  }
  await Promise.all(Array.from({ length: 25 }, worker));
  const dead = Object.values(results).filter(r => !r.ok);
  fs.writeFileSync(path.join(ROOT, 'scratch', 'image_report.json'), JSON.stringify(results, null, 1));
  console.log('alive:', list.length - dead.length, 'dead:', dead.length);
  const prodDead = cat.products.filter(p => results[p.image] && !results[p.image].ok);
  console.log('products with dead main image:', prodDead.length);
})();

const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        timeout: 6000
      }, res => {
        resolve({ url, status: res.statusCode, location: res.headers.location });
      });
      req.on('error', e => resolve({ url, status: 500, err: e.message }));
    } catch (e) {
      resolve({ url, status: 500, err: e.message });
    }
  });
}

async function testStoreUrls() {
  // Test if OTTO direct product URLs or search redirects to product
  const urls = [
    'https://www.otto.de/p/delonghi-kaffeevollautomat-magnifica-s-ecam-22-110-b-117865910/',
    'https://www.kaufland.de/product/329582177/',
    'https://www.zalando.de/nike-sportswear-air-max-90-sneaker-low-white-ni112o09j-a11.html',
    'https://www.ikea.com/de/de/p/markus-drehstuhl-vissle-dunkelgrau-70261150/'
  ];
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(res.status, u, res.location || '');
  }
}
testStoreUrls();

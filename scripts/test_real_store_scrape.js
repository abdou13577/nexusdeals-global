const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function testEbay() {
  const url = 'https://www.ebay.de/sch/i.html?_nkw=BMW+E46+Autoradio+CarPlay&LH_BIN=1&_sop=12';
  try {
    const res = await fetchUrl(url);
    console.log('eBay status:', res.status, 'HTML length:', res.data.length);
    const items = [];
    const regex = /<li class="s-item[^>]*>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = regex.exec(res.data)) !== null && items.length < 3) {
      const block = m[1];
      const titleM = block.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)?([^<]+)(?:<\/span>)?/i);
      const priceM = block.match(/class="s-item__price"[^>]*>([^<]+)<\/span>/i) || block.match(/EUR\s*([0-9.,]+)/i);
      const imgM = block.match(/src="(https:\/\/i\.ebayimg\.com\/[^"]+)"/i) || block.match(/data-src="(https:\/\/i\.ebayimg\.com\/[^"]+)"/i);
      const linkM = block.match(/href="(https:\/\/www\.ebay\.de\/itm\/[^"]+)"/i);
      if (titleM && priceM && !titleM[1].includes('Shop on eBay')) {
        items.push({
          title: titleM[1].trim(),
          price: priceM[1].trim(),
          img: imgM ? imgM[1] : null,
          link: linkM ? linkM[1].split('?')[0] : null
        });
      }
    }
    console.log('eBay scraped real items:', JSON.stringify(items, null, 2));
  } catch (e) {
    console.error('eBay error:', e.message);
  }
}

testEbay();

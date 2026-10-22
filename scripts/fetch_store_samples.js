const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    ).on('error', reject);
  });
}

async function test() {
  console.log('Testing SHEIN search...');
  try {
    const res = await fetchHtml('https://de.shein.com/pdsearch/Damen%20Winterjacke/');
    console.log('SHEIN status:', res.status, 'HTML length:', res.data.length);
    const regex = /href="(\/[^"]*?-p-(\d+)\.html)"/g;
    let match;
    const links = [];
    while ((match = regex.exec(res.data)) !== null && links.length < 10) {
      links.push(`https://de.shein.com${match[1]}`);
    }
    console.log('SHEIN product links found:', links);
  } catch (e) {
    console.error('SHEIN error:', e.message);
  }
}

test();

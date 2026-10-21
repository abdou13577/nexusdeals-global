const { execFileSync } = require('child_process');
try {
  const html = execFileSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-blink-features=AutomationControlled',
    '--dump-dom', 'https://www.amazon.de/dp/B0G38PPRJ6'
  ], { encoding: 'utf8', maxBuffer: 25*1024*1024 });

  const m = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/);
  if (m) console.log('Product title:', m[1].trim());
  else console.log('Product title not found');
} catch (e) {
  console.log('Error:', e.message);
}

const { execFileSync } = require('child_process');
const html = execFileSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-blink-features=AutomationControlled',
  '--dump-dom', 'https://www.amazon.de/s?k=monitor+49+zoll'
], { encoding: 'utf8', maxBuffer: 25*1024*1024 });

console.log('Includes Canlarriz:', html.includes('Canlarriz'));
const blocks = html.split('data-asin="');
for (let i = 1; i < blocks.length; i++) {
  if (blocks[i].includes('Canlarriz')) {
    console.log('Block', i, 'snippet:', blocks[i].slice(0, 350));
    console.log('is Sponsored:', /sponsored|gesponsert/i.test(blocks[i]));
  }
}

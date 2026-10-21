const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');
const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
const catalog = JSON.parse(raw);

// 1. Fine-tune Sony ULT WEAR (B0CX1VYYQL)
const sony = catalog.products.find(p => p.asin === 'B0CX1VYYQL' || p.title.toLowerCase().includes('ult wear'));
if (sony) {
  console.log('Fine-tuning Sony ULT WEAR...');
  const imgs = sony.images || [sony.image];
  sony.offers = [
    {
      store: 'Galaxus',
      storeLogo: 'galaxus',
      price: 102.31,
      shipping: 0,
      deliveryAr: 'متوفر في Galaxus',
      inStock: true,
      rating: 4.8,
      query: 'Sony ULT WEAR Schwarz',
      variantColor: 'Schwarz',
      variantTitle: 'Sony ULT WEAR (WH-ULT900N) - Schwarz',
      image: imgs[0] || sony.image,
      directUrl: 'https://www.galaxus.de/de/search?q=Sony%20ULT%20WEAR%20Schwarz'
    },
    {
      store: 'MediaMarkt',
      storeLogo: 'mediamarkt',
      price: 102.99,
      shipping: 0,
      deliveryAr: 'متوفر في MediaMarkt',
      inStock: true,
      rating: 4.8,
      query: 'Sony ULT WEAR Weiß',
      variantColor: 'Weiß',
      variantTitle: 'Sony ULT WEAR (WH-ULT900N) - Weiß',
      image: imgs[1] || imgs[0] || sony.image,
      directUrl: 'https://www.mediamarkt.de/de/search.html?query=Sony%20ULT%20WEAR%20Wei%C3%9F'
    },
    {
      store: 'eBay',
      storeLogo: 'ebay',
      price: 108.50,
      shipping: 0,
      deliveryAr: 'متوفر في eBay',
      inStock: true,
      rating: 4.7,
      query: 'Sony ULT WEAR',
      variantColor: 'Off-Black',
      variantTitle: 'Sony ULT WEAR Wireless Noise-Cancelling - Off-Black',
      image: imgs[2] || imgs[0] || sony.image,
      directUrl: 'https://www.ebay.de/sch/i.html?_nkw=Sony%20ULT%20WEAR&LH_BIN=1&_sop=12'
    },
    {
      store: 'Amazon',
      storeLogo: 'amazon',
      asin: 'B0CX1VYYQL',
      price: 109.99,
      shipping: 0,
      deliveryAr: 'شراء فوري مباشر - متوفر في أمازون',
      inStock: true,
      rating: 4.9,
      query: 'Sony ULT WEAR',
      variantColor: 'Schwarz',
      variantTitle: 'Sony ULT WEAR Kabellose Noise Cancelling Kopfhörer - Schwarz',
      image: imgs[3] || imgs[0] || sony.image,
      directUrl: 'https://www.amazon.de/dp/B0CX1VYYQL?tag=nexusdeals08-21'
    },
    {
      store: 'Kaufland',
      storeLogo: 'kaufland',
      price: 113.99,
      shipping: 0,
      deliveryAr: 'متوفر في Kaufland',
      inStock: true,
      rating: 4.7,
      query: 'Sony ULT WEAR',
      variantColor: 'Waldgrün',
      variantTitle: 'Sony ULT WEAR (WH-ULT900N) Over-Ear - Waldgrün',
      image: imgs[4] || imgs[0] || sony.image,
      directUrl: 'https://www.kaufland.de/item/search/?search_value=Sony%20ULT%20WEAR'
    },
    {
      store: 'OTTO',
      storeLogo: 'otto',
      price: 114.99,
      shipping: 0,
      deliveryAr: 'متوفر في OTTO',
      inStock: true,
      rating: 4.8,
      query: 'Sony ULT WEAR',
      variantColor: 'Silberweiß',
      variantTitle: 'Sony ULT WEAR WH-ULT900N Over-Ear Bluetooth Kopfhörer - Silberweiß',
      image: imgs[5] || imgs[0] || sony.image,
      directUrl: 'https://www.awin1.com/cread.php?awinmid=14336&awinaffid=3130490&ued=' + encodeURIComponent('https://www.otto.de/suche/Sony%20ULT%20WEAR/')
    },
    {
      store: 'AliExpress',
      storeLogo: 'aliexpress',
      price: 116.49,
      shipping: 0,
      deliveryAr: 'متوفر في AliExpress',
      inStock: true,
      rating: 4.6,
      query: 'Sony ULT WEAR',
      variantColor: 'Schwarz',
      variantTitle: 'Sony ULT WEAR Wireless Headset - Global Edition',
      image: imgs[6] || imgs[0] || sony.image,
      directUrl: 'https://www.aliexpress.com/w/wholesale-Sony%20ULT%20WEAR.html'
    },
    {
      store: 'Temu',
      storeLogo: 'temu',
      price: 118.99,
      shipping: 0,
      deliveryAr: 'متوفر في Temu',
      inStock: true,
      rating: 4.5,
      query: 'Sony ULT WEAR',
      variantColor: 'Schwarz',
      variantTitle: 'Sony ULT WEAR Kopfhörer Zubehör & Original Set',
      image: imgs[7] || imgs[0] || sony.image,
      directUrl: 'https://www.temu.com/de/search_result.html?search_key=Sony%20ULT%20WEAR'
    }
  ];
  sony.price = 102.31;
  sony.aiVerdictAr = 'أفضل سعر حالياً لدى Galaxus (102.31€ باللون الأسود) و MediaMarkt (102.99€ باللون الأبيض) • أمازون (109.99€) • كوفلاند (113.99€)';
}

// 2. Fine-tune iPhone 16 (B0DGHN3YNR)
const iphone = catalog.products.find(p => p.asin === 'B0DGHN3YNR');
if (iphone) {
  console.log('Fine-tuning iPhone 16 (B0DGHN3YNR)...');
  const imgs = iphone.images || [iphone.image];
  iphone.offers = [
    {
      store: 'MediaMarkt',
      storeLogo: 'mediamarkt',
      price: 839.99,
      shipping: 0,
      deliveryAr: 'متوفر في MediaMarkt',
      inStock: true,
      rating: 4.8,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Schwarz',
      variantTitle: 'Apple iPhone 16 128GB - Schwarz',
      image: imgs[0] || iphone.image,
      directUrl: 'https://www.mediamarkt.de/de/search.html?query=Apple%20iPhone%2016%20128GB'
    },
    {
      store: 'Galaxus',
      storeLogo: 'galaxus',
      price: 849.00,
      shipping: 0,
      deliveryAr: 'متوفر في Galaxus',
      inStock: true,
      rating: 4.8,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Weiß',
      variantTitle: 'Apple iPhone 16 128GB - Weiß',
      image: imgs[1] || imgs[0] || iphone.image,
      directUrl: 'https://www.galaxus.de/de/search?q=Apple%20iPhone%2016%20128GB'
    },
    {
      store: 'eBay',
      storeLogo: 'ebay',
      price: 859.99,
      shipping: 0,
      deliveryAr: 'متوفر في eBay',
      inStock: true,
      rating: 4.7,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Ultramarin',
      variantTitle: 'Apple iPhone 16 128GB 5G - Ultramarin',
      image: imgs[2] || imgs[0] || iphone.image,
      directUrl: 'https://www.ebay.de/sch/i.html?_nkw=Apple%20iPhone%2016%20128GB&LH_BIN=1&_sop=12'
    },
    {
      store: 'Amazon',
      storeLogo: 'amazon',
      asin: 'B0DGHN3YNR',
      price: 879.99,
      shipping: 0,
      deliveryAr: 'شراء فوري مباشر - متوفر في أمازون',
      inStock: true,
      rating: 4.9,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Pink / Rosa',
      variantTitle: 'Apple iPhone 16 128 GB: 5G Handy - Pink',
      image: imgs[3] || imgs[0] || iphone.image,
      directUrl: 'https://www.amazon.de/dp/B0DGHN3YNR?tag=nexusdeals08-21'
    },
    {
      store: 'Kaufland',
      storeLogo: 'kaufland',
      price: 889.00,
      shipping: 0,
      deliveryAr: 'متوفر في Kaufland',
      inStock: true,
      rating: 4.7,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Teal / Türkis',
      variantTitle: 'Apple iPhone 16 128GB - Türkis',
      image: imgs[4] || imgs[0] || iphone.image,
      directUrl: 'https://www.kaufland.de/item/search/?search_value=Apple%20iPhone%2016%20128GB'
    },
    {
      store: 'OTTO',
      storeLogo: 'otto',
      price: 899.00,
      shipping: 0,
      deliveryAr: 'متوفر في OTTO',
      inStock: true,
      rating: 4.8,
      query: 'Apple iPhone 16 128GB',
      variantColor: 'Schwarz',
      variantTitle: 'Apple iPhone 16 128GB Smartphone (15,5 cm/6,1 Zoll) - Schwarz',
      image: imgs[5] || imgs[0] || iphone.image,
      directUrl: 'https://www.awin1.com/cread.php?awinmid=14336&awinaffid=3130490&ued=' + encodeURIComponent('https://www.otto.de/suche/Apple%20iPhone%2016%20128GB/')
    }
  ];
  iphone.price = 839.99;
  iphone.aiVerdictAr = 'أفضل سعر حالياً لدى MediaMarkt (839.99€) • متاح للمقارنة في باقي المتاجر';
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved fine-tuned items to catalog!');

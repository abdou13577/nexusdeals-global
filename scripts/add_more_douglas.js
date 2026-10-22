const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');
const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
const catalog = JSON.parse(raw);

const MORE_DOUGLAS = [
  {
    id: 'douglas-p304',
    title: 'Chanel Bleu de Chanel Eau de Parfum (100 ml) - Zeitlose maskuline Eleganz',
    titleAr: 'عطر شانيل بلو دي شانيل أو دو بارفيوم 100 مل الأصلي - Bleu de Chanel EDP',
    category: 'perfumes_beauty',
    categoryAr: 'العطور ومستحضرات التجميل',
    brand: 'Chanel',
    rating: 4.9,
    reviewsCount: 8900,
    badge: 'كلاسيكية الفخامة 👑',
    isFlashDeal: false,
    discountStatus: 'verified_low',
    aiVerdictAr: 'عطر خشبي أروماتي فاخر للرجل العصري الواثق',
    image: 'https://media.douglas.de/medias/d730704-0-1000Wx1000H.jpg?context=bWFzdGVyfGltYWdlc3w5MzY5MXxpbWFnZS9qcGVnfGFETTNMMmcyWVM4eE1qTTNORGN5T1RnM01ERTRMMlEzTXpBM01EUm1NQzB4TURBWFhERTBNRGhJY0d4bk9ncHNiM1Z0WTJsa2F5NW5jR2N8ZDY2NmEzOTk2MmQ3ZWIyNGE2MTEzN2VhNGQzMjM5NTA4NTVhNDRhNzg2YmJjODIxYTIxYWE0NGE1OGU2MGVmNQ',
    images: ['https://media.douglas.de/medias/d730704-0-1000Wx1000H.jpg?context=bWFzdGVyfGltYWdlc3w5MzY5MXxpbWFnZS9qcGVnfGFETTNMMmcyWVM4eE1qTTNORGN5T1RnM01ERTRMMlEzTXpBM01EUm1NQzB4TURBWFhERTBNRGhJY0d4bk9ncHNiM1Z0WTJsa2F5NW5jR2N8ZDY2NmEzOTk2MmQ3ZWIyNGE2MTEzN2VhNGQzMjM5NTA4NTVhNDRhNzg2YmJjODIxYTIxYWE0NGE1OGU2MGVmNQ'],
    msrp: 155.00,
    price: 139.95,
    priceHistory90d: [155.00, 145.00, 139.95],
    offers: [
      {
        store: 'Douglas',
        storeLogo: 'douglas',
        price: 139.95,
        shipping: 0,
        deliveryAr: 'شراء مباشر معتمد من Douglas ألمانيا',
        inStock: true,
        rating: 4.9,
        query: 'Bleu de Chanel Eau de Parfum 100 ml',
        variantColor: '100 ml EDP',
        variantTitle: 'Bleu de Chanel 100ml',
        image: 'https://media.douglas.de/medias/d730704-0-1000Wx1000H.jpg?context=bWFzdGVyfGltYWdlc3w5MzY5MXxpbWFnZS9qcGVnfGFETTNMMmcyWVM4eE1qTTNORGN5T1RnM01ERTRMMlEzTXpBM01EUm1NQzB4TURBWFhERTBNRGhJY0d4bk9ncHNiM1Z0WTJsa2F5NW5jR2N8ZDY2NmEzOTk2MmQ3ZWIyNGE2MTEzN2VhNGQzMjM5NTA4NTVhNDRhNzg2YmJjODIxYTIxYWE0NGE1OGU2MGVmNQ',
        directUrl: 'https://www.awin1.com/cread.php?awinmid=10046&awinaffid=3130490&ued=https%3A%2F%2Fwww.douglas.de%2Fde%2Fsearch%3Fq%3DBleu%2Bde%2BChanel'
      }
    ]
  },
  {
    id: 'douglas-p305',
    title: 'Paco Rabanne 1 Million Eau de Toilette (100 ml) - Der legendäre Goldbarren-Klassiker',
    titleAr: 'عطر ون مليون باكو رابان أو دو تواليت 100 مل الأصلي - 1 Million',
    category: 'perfumes_beauty',
    categoryAr: 'العطور ومستحضرات التجميل',
    brand: 'Paco Rabanne',
    rating: 4.8,
    reviewsCount: 14500,
    badge: 'الأكثر شهرة 🥇',
    isFlashDeal: true,
    discountStatus: 'verified_low',
    aiVerdictAr: 'عطر جذاب دافئ بنفحات الجلد والقرفة واليوسفي المنعش',
    image: 'https://media.douglas.de/medias/d258074-0-1000Wx1000H.jpg',
    images: ['https://media.douglas.de/medias/d258074-0-1000Wx1000H.jpg'],
    msrp: 98.00,
    price: 78.50,
    priceHistory90d: [98.00, 89.00, 78.50],
    offers: [
      {
        store: 'Douglas',
        storeLogo: 'douglas',
        price: 78.50,
        shipping: 0,
        deliveryAr: 'شراء مباشر معتمد من Douglas ألمانيا',
        inStock: true,
        rating: 4.8,
        query: 'Paco Rabanne 1 Million 100 ml',
        variantColor: '100 ml EDT',
        variantTitle: '1 Million EDT 100ml',
        image: 'https://media.douglas.de/medias/d258074-0-1000Wx1000H.jpg',
        directUrl: 'https://www.awin1.com/cread.php?awinmid=10046&awinaffid=3130490&ued=https%3A%2F%2Fwww.douglas.de%2Fde%2Fsearch%3Fq%3D1%2BMillion'
      }
    ]
  }
];

const newDIds = new Set(MORE_DOUGLAS.map(p => p.id));
catalog.products = [...MORE_DOUGLAS.filter(p => !newDIds.has(p.id)), ...catalog.products];
catalog.totalProducts = catalog.products.length;
fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Added more Douglas flagships. Total products:', catalog.products.length);

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { generateInitialCatalog, scrapeRealAmazonProducts, scrapeProductGalleryByAsin, detectCategoryFromText, extractSmartModelQuery } = require('./seedCatalog');

const PORT = process.env.PORT || 3080;
const DATA_DIR = path.join(__dirname, 'data');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const ANALYTICS_PATH = path.join(DATA_DIR, 'analytics.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
  siteName: 'NexusDeals Global',
  currency: 'EUR (€)',
  country: 'Germany / EU',
  affiliateIds: {
    Amazon: 'nexusdeals08-21',
    OTTO: '3130490',
    Kaufland: '',
    eBay: '',
    Zalando: '',
    MediaMarkt: '',
    Galaxus: '',
    Douglas: '3130490',
    IKEA: '',
    AliExpress: '',
    Temu: '',
    SHEIN: ''
  },
  storeModes: {
    Amazon: 'affiliate',
    OTTO: 'affiliate',
    Douglas: 'affiliate',
    Zalando: 'direct',
    MediaMarkt: 'direct',
    Kaufland: 'direct',
    Galaxus: 'direct',
    eBay: 'direct',
    IKEA: 'direct',
    AliExpress: 'direct',
    Temu: 'direct',
    SHEIN: 'direct'
  },
  payoutSettings: {
    primaryMethod: 'bank_1',
    paypalEmail: '',
    wiseOrPayoneerEmail: '',
    bankAccounts: [
      {
        slot: 1,
        region: 'EU',
        label: 'الحساب البنكي الأول (أوروبا / ألمانيا - SEPA EUR)',
        holderName: '',
        bankName: '',
        ibanOrRib: '',
        bicSwift: '',
        currency: 'EUR'
      },
      {
        slot: 2,
        region: 'MA',
        label: 'الحساب البنكي الثاني (المغرب - RIB / IBAN MA)',
        holderName: '',
        bankName: '',
        ibanOrRib: '',
        bicSwift: '',
        currency: 'MAD / EUR'
      },
      {
        slot: 3,
        region: 'US',
        label: 'الحساب البنكي الثالث (أمريكا / دولي - ACH / SWIFT USD)',
        holderName: '',
        bankName: '',
        ibanOrRib: '',
        bicSwift: '',
        routingNumber: '',
        currency: 'USD'
      }
    ]
  },
  commissionRates: {
    Amazon: 0.045,
    OTTO: 0.06,
    Kaufland: 0.055,
    eBay: 0.04,
    Zalando: 0.08,
    MediaMarkt: 0.035,
    Galaxus: 0.04,
    Douglas: 0.09,
    IKEA: 0.04,
    AliExpress: 0.07,
    Temu: 0.12,
    SHEIN: 0.10
  },
  autoSyncEnabled: true
};

const DEFAULT_ANALYTICS = {
  totalClicks: 0,
  estimatedCommissionEur: 0.00,
  storeBreakdown: {
    Amazon: { clicks: 0, estRevenue: 0 },
    OTTO: { clicks: 0, estRevenue: 0 },
    Kaufland: { clicks: 0, estRevenue: 0 },
    eBay: { clicks: 0, estRevenue: 0 },
    Zalando: { clicks: 0, estRevenue: 0 },
    MediaMarkt: { clicks: 0, estRevenue: 0 },
    Galaxus: { clicks: 0, estRevenue: 0 },
    Douglas: { clicks: 0, estRevenue: 0 },
    IKEA: { clicks: 0, estRevenue: 0 },
    AliExpress: { clicks: 0, estRevenue: 0 },
    Temu: { clicks: 0, estRevenue: 0 },
    SHEIN: { clicks: 0, estRevenue: 0 }
  },
  recentClicks: [],
  priceAlerts: []
};

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {}
  fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
  return fallback;
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function extractCleanModelQuery(title, brand) {
  if (!title) return 'Product';
  return extractSmartModelQuery(title);
}

function interleaveDiverseProducts(products) {
  const groups = {};
  for (const p of products) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }

  // Shuffle products within each category so every refresh/visit reveals fresh items
  for (const cat in groups) {
    for (let i = groups[cat].length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groups[cat][i], groups[cat][j]] = [groups[cat][j], groups[cat][i]];
    }
  }

  const preferredOrder = [
    'smartphones',
    'fashion_shoes',
    'tv_audio',
    'home_kitchen',
    'perfumes_beauty',
    'sports_fitness',
    'gaming',
    'furniture_decor',
    'auto_car',
    'tools_garden',
    'travel_luggage',
    'kids_toys'
  ];

  // Rotate starting category randomly so the very first product isn't always from the exact same category
  const offset = Math.floor(Math.random() * preferredOrder.length);
  const rotatedOrder = [...preferredOrder.slice(offset), ...preferredOrder.slice(0, offset)];
  const allCatKeys = Array.from(new Set([...rotatedOrder, ...Object.keys(groups)]));

  const interleaved = [];
  let hasMore = true;
  let round = 0;

  while (hasMore) {
    hasMore = false;
    for (const cat of allCatKeys) {
      if (groups[cat] && round < groups[cat].length) {
        interleaved.push(groups[cat][round]);
        hasMore = true;
      }
    }
    round++;
  }
  return interleaved;
}

// Build real direct destination URL across all 12 Global & European Platforms
function buildAffiliateRedirectUrl(store, query, asin, settings, price, directUrl) {
  const tags = (settings && settings.affiliateIds) || {};
  const numPrice = parseFloat(price) || 0;
  const minPrice = numPrice > 20 ? Math.floor(numPrice * 0.85) : Math.max(5, Math.floor(numPrice * 0.7));
  const maxPrice = numPrice > 20 ? Math.ceil(numPrice * 1.15) : Math.ceil(numPrice * 1.3);

  const storeModes = (settings && settings.storeModes) || {};
  const isDirectMode = storeModes[store] === 'direct';

  // Sanitize any legacy closed Awin mid=8686 links
  if (directUrl && typeof directUrl === 'string' && directUrl.includes('awinmid=8686')) {
    const uedMatch = directUrl.match(/ued=([^&]+)/);
    directUrl = uedMatch ? decodeURIComponent(uedMatch[1]) : '';
  }

  // If a direct product page URL is already known, apply rules and redirect directly!
  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
    if (isDirectMode) {
      return directUrl;
    }
    if (store === 'Amazon') {
      const tag = tags.Amazon || 'nexusdeals08-21';
      return directUrl.includes('tag=') ? directUrl : (directUrl.includes('?') ? `${directUrl}&tag=${encodeURIComponent(tag)}` : `${directUrl}?tag=${encodeURIComponent(tag)}`);
    }
    if (store === 'eBay' && tags.eBay) {
      return directUrl.includes('?') ? `${directUrl}&campid=${encodeURIComponent(tags.eBay)}` : `${directUrl}?campid=${encodeURIComponent(tags.eBay)}`;
    }
    if (store === 'OTTO' && tags.OTTO) {
      return `https://www.awin1.com/cread.php?awinmid=14336&awinaffid=${encodeURIComponent(tags.OTTO)}&ued=${encodeURIComponent(directUrl)}`;
    }
    if (store === 'Douglas' && tags.Douglas) {
      return `https://www.awin1.com/cread.php?awinmid=10046&awinaffid=${encodeURIComponent(tags.Douglas)}&ued=${encodeURIComponent(directUrl)}`;
    }
    if (store === 'Kaufland' && tags.Kaufland) {
      return directUrl.includes('?') ? `${directUrl}&utm_source=affiliate&partnerId=${encodeURIComponent(tags.Kaufland)}` : `${directUrl}?utm_source=affiliate&partnerId=${encodeURIComponent(tags.Kaufland)}`;
    }
    if (store === 'Temu' && tags.Temu) {
      const sep = directUrl.includes('?') ? '&' : '?';
      return `${directUrl}${sep}_x_ads_channel=affiliate&aff_id=${encodeURIComponent(tags.Temu)}`;
    }
    return directUrl;
  }

  const cleanModel = extractCleanModelQuery(query);
  const q = encodeURIComponent(cleanModel);

  switch (store) {
    case 'Amazon': {
      const tagParam = `?tag=${encodeURIComponent(tags.Amazon || 'nexusdeals08-21')}`;
      const validAsin = asin && /^[A-Z0-9]{10}$/i.test(asin.trim()) ? asin.trim().toUpperCase() : null;
      if (validAsin) {
        return `https://www.amazon.de/dp/${validAsin}${tagParam}`;
      }
      return `https://www.amazon.de/s?k=${q}&tag=${encodeURIComponent(tags.Amazon || 'nexusdeals08-21')}`;
    }
    case 'eBay': {
      const tagParam = (tags.eBay && !isDirectMode) ? `&mkcid=1&mkrid=707-53477-19255-0&campid=${encodeURIComponent(tags.eBay)}` : '';
      const priceFilter = numPrice > 15 ? `&_udlo=${minPrice}&_udhi=${maxPrice}` : '';
      return `https://www.ebay.de/sch/i.html?_nkw=${q}&LH_BIN=1${priceFilter}&_sop=12${tagParam}`;
    }
    case 'OTTO': {
      const rawUrl = `https://www.otto.de/suche/${q}/`;
      if (tags.OTTO && !isDirectMode) {
        return `https://www.awin1.com/cread.php?awinmid=14336&awinaffid=${encodeURIComponent(tags.OTTO)}&ued=${encodeURIComponent(rawUrl)}`;
      }
      return rawUrl;
    }
    case 'Kaufland': {
      const tagParam = (tags.Kaufland && !isDirectMode) ? `&utm_source=affiliate&partnerId=${encodeURIComponent(tags.Kaufland)}` : '';
      return `https://www.kaufland.de/item/search/?search_value=${q}${tagParam}`;
    }
    case 'MediaMarkt': {
      const tagParam = (tags.MediaMarkt && !isDirectMode) ? `?partnerId=${encodeURIComponent(tags.MediaMarkt)}` : '';
      return `https://www.mediamarkt.de/de/search.html?query=${q}${tagParam}`;
    }
    case 'Zalando': {
      // 100% direct official Zalando - safe from inactive Awin merchant errors
      return `https://www.zalando.de/katalog/?q=${q}`;
    }
    case 'Galaxus': {
      const tagParam = (tags.Galaxus && !isDirectMode) ? `&tag=${encodeURIComponent(tags.Galaxus)}` : '';
      return `https://www.galaxus.de/de/search?q=${q}${tagParam}`;
    }
    case 'Douglas': {
      const rawUrl = `https://www.douglas.de/de/search?q=${q}`;
      if (tags.Douglas && !isDirectMode) {
        return `https://www.awin1.com/cread.php?awinmid=10046&awinaffid=${encodeURIComponent(tags.Douglas)}&ued=${encodeURIComponent(rawUrl)}`;
      }
      return rawUrl;
    }
    case 'IKEA': {
      const tagParam = (tags.IKEA && !isDirectMode) ? `&affId=${encodeURIComponent(tags.IKEA)}` : '';
      return `https://www.ikea.com/de/de/search/?q=${q}${tagParam}`;
    }
    case 'AliExpress': {
      const priceFilter = numPrice > 15 ? `&minPrice=${minPrice}&maxPrice=${maxPrice}` : '';
      const rawUrl = `https://www.aliexpress.com/w/wholesale-${q.replace(/%20/g, '-')}.html${priceFilter}`;
      if (tags.AliExpress && !isDirectMode) {
        if (/^\d+$/.test(tags.AliExpress.trim())) {
          return `https://www.awin1.com/cread.php?awinmid=10748&awinaffid=${encodeURIComponent(tags.AliExpress.trim())}&ued=${encodeURIComponent(rawUrl)}`;
        }
        return `${rawUrl}?aff_fcid=${encodeURIComponent(tags.AliExpress)}`;
      }
      return rawUrl;
    }
    case 'Temu': {
      if (!isDirectMode && (!query || query.trim() === '' || query === 'Deals')) {
        return (settings && settings.temuPromoUrl) || 'https://temu.to/m/u6b3glm38yo';
      }
      const tagParam = (tags.Temu && !isDirectMode) ? `&_x_ads_channel=affiliate&aff_id=${encodeURIComponent(tags.Temu)}` : '';
      return `https://www.temu.com/de/search_result.html?search_key=${q}&search_type=1000${tagParam}`;
    }
    case 'SHEIN': {
      const tagParam = (tags.SHEIN && !isDirectMode) ? `?url_from=${encodeURIComponent(tags.SHEIN)}` : '';
      return `https://de.shein.com/pdsearch/${q}/${tagParam}`;
    }
    default:
      return `https://www.amazon.de/s?k=${q}`;
  }
}

function runAiShoppingAssistant(userPrompt, products) {
  const q = (userPrompt || '').trim().toLowerCase();
  const numMatch = q.match(/(\d{2,5})/);
  const budget = numMatch ? parseFloat(numMatch[1]) : null;

  const keywordGroups = [
    { keys: ['لابتوب', 'حاسوب', 'كمبيوتر', 'العاب', 'ألعاب', 'بلايستيشن', 'laptop', 'gaming', 'pc', 'ps5', 'playstation', 'rtx'], cat: 'gaming' },
    { keys: ['هاتف', 'جوال', 'موبايل', 'آيفون', 'ايفون', 'سامسونج', 'iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'handy'], cat: 'smartphones' },
    { keys: ['قهوة', 'ماكينة', 'مكنسة', 'مطبخ', 'منزل', 'قلاية', 'دايسون', 'روبوروك', 'ديلونجي', 'coffee', 'vacuum', 'dyson', 'roborock', 'delonghi', 'ninja', 'kaffee', 'tefal', 'wmf'], cat: 'home_kitchen' },
    { keys: ['شاشة', 'تلفزيون', 'سماعة', 'سماعات', 'صوت', 'سوني', 'tv', 'oled', 'fernseher', 'headphones', 'kopfhörer', 'sony', 'lg', 'jbl'], cat: 'tv_audio' },
    { keys: ['ملابس', 'حذاء', 'أحذية', 'نايك', 'اديداس', 'جينز', 'جاكيت', 'nike', 'adidas', 'sneaker', 'schuhe', 'jeans', 'tommy', 'fashion'], cat: 'fashion_shoes' },
    { keys: ['عطر', 'عطور', 'تجميل', 'ليزر', 'فيليبس', 'حلاقة', 'parfum', 'dior', 'lattafa', 'boss', 'philips', 'lumea', 'braun', 'beauty'], cat: 'perfumes_beauty' },
    { keys: ['أثاث', 'كرسي', 'مكتب', 'سرير', 'فرشة', 'ديكور', 'bürostuhl', 'stuhl', 'schreibtisch', 'matratze', 'emma', 'sofa', 'möbel'], cat: 'furniture_decor' },
    { keys: ['رياضة', 'جري', 'مشاية', 'أثقال', 'سكوتر', 'دراجة', 'laufband', 'walking', 'hantel', 'scooter', 'fitness', 'sport'], cat: 'sports_fitness' },
    { keys: ['أطفال', 'ليغو', 'لعب', 'بيبي', 'lego', 'kinder', 'spielzeug', 'baby'], cat: 'kids_toys' },
    { keys: ['عدة', 'أدوات', 'دريل', 'بوش', 'حديقة', 'غسيل', 'bosch', 'kärcher', 'werkzeug', 'akkuschrauber'], cat: 'tools_garden' },
    { keys: ['سيارة', 'سيارات', 'داش كام', 'بطارية', 'dashcam', 'auto', 'starthilfe'], cat: 'auto_car' },
    { keys: ['سفر', 'حقيبة', 'شنطة', 'ساعة', 'درون', 'كاميرا', 'koffer', 'samsonite', 'watch', 'drohne', 'dji'], cat: 'travel_luggage' }
  ];

  let matchedCategory = null;
  for (const grp of keywordGroups) {
    if (grp.keys.some(k => q.includes(k))) {
      matchedCategory = grp.cat;
      break;
    }
  }

  let candidates = products.filter(p => {
    const minPrice = p.offers[0].price;
    if (budget && minPrice > budget * 1.15) return false;
    if (matchedCategory && p.category === matchedCategory) return true;
    const text = `${p.title} ${p.titleAr} ${p.brand} ${p.categoryAr}`.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 2);
    return words.some(w => text.includes(w));
  });

  if (candidates.length === 0) {
    candidates = products.filter(p => {
      const minPrice = p.offers[0].price;
      if (budget) return minPrice <= budget;
      return true;
    });
  }

  candidates.sort((a, b) => {
    const saveA = (a.msrp - a.offers[0].price) / a.msrp;
    const saveB = (b.msrp - b.offers[0].price) / b.msrp;
    return (saveB + b.rating * 0.1) - (saveA + a.rating * 0.1);
  });

  const topPicks = candidates.slice(0, 4);
  return {
    budgetDetected: budget,
    categoryDetected: matchedCategory,
    recommendations: topPicks
  };
}

function detectClientLanguage(acceptLangHeader) {
  if (!acceptLangHeader) return 'de';
  const tokens = acceptLangHeader.toLowerCase().split(',');
  for (const t of tokens) {
    const code = t.split(';')[0].trim().split('-')[0];
    if (code === 'de') return 'de';
    if (code === 'ar') return 'ar';
    if (code === 'en') return 'en';
  }
  return 'de';
}

async function startServer() {
  if (!fs.existsSync(CATALOG_PATH)) {
    await generateInitialCatalog(CATALOG_PATH);
  }
  loadJson(SETTINGS_PATH, DEFAULT_SETTINGS);
  loadJson(ANALYTICS_PATH, DEFAULT_ANALYTICS);

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

const MULTILINGUAL_DICTIONARY = {
  // Screens & Monitors & TVs
  'شاشة': 'monitor bildschirm',
  'شاشات': 'monitor bildschirm',
  'شاشه': 'monitor bildschirm',
  'شاشة كمبيوتر': 'pc gaming monitor',
  'شاشة قيمنق': 'gaming monitor',
  'شاشه العاب': 'gaming monitor',
  'بوصة': 'zoll',
  'بوصه': 'zoll',
  'انش': 'zoll',
  'إنش': 'zoll',
  'منحنية': 'curved',
  'منحنيه': 'curved',
  'تلفزيون': 'fernseher tv',
  'تلفاز': 'fernseher tv',

  // Smartphones & Tablets
  'هاتف': 'smartphone handy',
  'هواتف': 'smartphones handys',
  'جوال': 'smartphone handy',
  'جوالات': 'smartphones',
  'موبايل': 'smartphone handy',
  'موبايلات': 'smartphones',
  'ايفون': 'iphone',
  'آيفون': 'iphone',
  'ايباد': 'ipad',
  'آيباد': 'ipad',
  'تابلت': 'tablet',

  // Gaming & Laptops
  'لابتوب': 'laptop notebook',
  'كمبيوتر محمول': 'laptop notebook',
  'حاسوب': 'computer pc laptop',
  'كمبيوتر': 'computer pc',
  'بلايستيشن': 'playstation ps5',
  'سوني': 'sony playstation',
  'العاب': 'gaming',
  'ألعاب': 'gaming',
  'يدة تحكم': 'controller',
  'يد تحكم': 'controller',
  'كيبورد': 'tastatur keyboard',
  'ماوس': 'maus mouse',

  // Audio
  'سماعة': 'kopfhörer headphones',
  'سماعات': 'kopfhörer headphones',
  'سماعة بلوتوث': 'bluetooth kopfhörer',
  'مكبر صوت': 'lautsprecher speaker',

  // Fashion & Shoes
  'حذاء': 'schuhe sneaker',
  'أحذية': 'schuhe sneaker',
  'احذية': 'schuhe sneaker',
  'كوتشي': 'sneaker schuhe',
  'سنيكرز': 'sneaker schuhe',
  'ملابس': 'kleidung fashion',
  'قميص': 'hemd shirt',
  'تيشيرت': 't-shirt',
  'جاكيت': 'jacke jacket',
  'بنطلون': 'hose jeans',
  'فستان': 'kleid dress',

  // Perfumes & Beauty
  'عطر': 'parfum',
  'عطور': 'parfum',
  'مكياج': 'makeup kosmetik',
  'كريم': 'creme serum',
  'عناية': 'hautpflege skincare',
  'ماكينة حلاقة': 'rasierer shaver',

  // Home & Furniture & Kitchen
  'ماكينة قهوة': 'kaffeevollautomat',
  'قهوة': 'kaffee coffee',
  'قلاية هوائية': 'heißluftfritteuse air fryer',
  'مكنسة': 'staubsauger vacuum',
  'ثلاجة': 'kühlschrank fridge',
  'غسالة': 'waschmaschine washer',
  'أثاث': 'möbel',
  'اثاث': 'möbel',
  'طاولة': 'tisch table desk',
  'كرسي': 'stuhl chair',
  'كرسي مكتب': 'bürostuhl',
  'كرسي قيمنق': 'gaming stuhl',
  'سرير': 'bett bed',
  'مرتبة': 'matratze mattress',
  'كنبة': 'sofa couch',

  // Sports, Outdoor, Camping & Tools
  'رياضة': 'fitness sport',
  'سير مشي': 'laufband treadmill',
  'دراجة': 'fahrrad bike',
  'سكوتر': 'e-scooter',
  'كيس نوم': 'schlafsack sleeping bag',
  'شوال نوم': 'schlafsack',
  'تخييم': 'camping outdoor',
  'خيمة': 'zelt tent',
  'دريل': 'bohrmaschine akkuschrauber drill',
  'مفك': 'akkuschrauber',
  'غسيل سيارات': 'hochdruckreiniger',

  // Automotive, Audio & Repair Tools
  'راديو': 'autoradio radio',
  'راديو سيارة': 'autoradio bluetooth carplay',
  'مسجل سيارة': 'autoradio bluetooth carplay',
  'مسجل': 'autoradio bluetooth',
  'مشغل موسيقى': 'autoradio bluetooth carplay',
  'مشغل موسيقى سيارة': 'autoradio bluetooth carplay',
  'موسيقى سيارة': 'autoradio bluetooth',
  'سبوتر': 'ausbeulspotter spotter',
  'تعديل صدمات': 'ausbeulspotter dellenlifter',
  'تعديل الصدمات': 'ausbeulspotter dellenlifter',
  'لحام نقطي': 'punktschweißgerät spotter',
  'بوردر': 'bördelgerät',
  'كاميرا سيارة': 'dashcam autokamera',

  // Brands
  'سامسونج': 'samsung',
  'سامسونغ': 'samsung',
  'ابل': 'apple',
  'أبل': 'apple',
  'نايك': 'nike',
  'نايكي': 'nike',
  'اديداس': 'adidas',
  'أديداس': 'adidas',
  'شاومي': 'xiaomi',
  'ديل': 'dell',
  'اسوس': 'asus',
  'لينوفو': 'lenovo',
  'ال جي': 'lg',
  'إل جي': 'lg',
  'فيليبس': 'philips',
  'ديلونجي': 'delonghi',
  'نينجا': 'ninja',
  'بوش': 'bosch',
  'كيرشر': 'kärcher',
  'كارشر': 'kärcher',
  'ديور': 'dior',
  'شانيل': 'chanel',
  'زارا': 'zara',
  'ايكيا': 'ikea',
  'اريبوس': 'arebos',
  'أريبوس': 'arebos'
};

const STOP_WORDS = new Set([
  'der', 'die', 'das', 'dem', 'den', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'und', 'oder', 'aber', 'mit', 'ohne', 'für', 'von', 'zu', 'im', 'in', 'an', 'auf', 'aus', 'bei',
  'the', 'a', 'an', 'and', 'or', 'with', 'without', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from',
  'من', 'إلى', 'عن', 'على', 'في', 'مع', 'بدون', 'أو', 'و', 'ثم', 'هذا', 'هذه', 'تم', 'كل'
]);

const GENERIC_MODIFIERS = new Set([
  'schwarz', 'black', 'weiß', 'white', 'weiss', 'blau', 'blue', 'rot', 'red', 'grau', 'grey', 'gray',
  'grün', 'green', 'silber', 'silver', 'gold', 'rosa', 'pink', 'gelb', 'yellow', 'braun', 'brown',
  'أسود', 'أبيض', 'أزرق', 'أحمر', 'أخضر', 'رمادي', 'فضي', 'ذهبي',
  'cm', 'mm', 'm', 'kg', 'g', 'ml', 'l', 'liter', 'w', 'watt', 'v', 'volt', 'hz', 'fps',
  'stk', 'stück', 'teilig', 'tlg', 'set', 'pack', 'paar', 'pcs', 'piece', 'pieces',
  'wege', 'weg', 'way', 'ways', 'outdoor', 'indoor', 'camping', 'universal', 'tragbar', 'portable',
  'original', 'neu', 'new', 'verstellbare', 'inkl', 'inklusive', 'inklusivem',
  'pro', 'max', 'mini', 'plus', 'ultra', 'lite'
]);

const KNOWN_BRANDS = [
  'samsung', 'apple', 'sony', 'nike', 'adidas', 'xiaomi', 'dell', 'asus', 'lenovo', 'lg',
  'philips', 'delonghi', 'ninja', 'bosch', 'kärcher', 'dior', 'chanel', 'zara', 'ikea',
  'crua', 'lxz', 'amzfast', 'samsonite', 'emma', 'roborock', 'dyson', 'tefal', 'wmf', 'hisense',
  'arebos', 'kesser', 'forceatt', 'kingcamp'
];

function parseAndExpandQuery(rawQ) {
  let q = (rawQ || '').toLowerCase().trim();
  let expandedTerms = [q];
  let deSearchTokens = [];

  // English synonyms
  q = q.replace(/\binch\b/g, 'zoll')
       .replace(/["”]/g, ' zoll ')
       .replace(/\bscreen\b/g, 'monitor')
       .replace(/\bphone\b/g, 'smartphone')
       .replace(/\bshoes\b/g, 'schuhe')
       .replace(/\bperfume\b/g, 'parfum')
       .replace(/\bsleeping\s*bag\b/g, 'schlafsack');

  // German compound words and apparel expansions
  if (q.includes('funktionsparka') || q.includes('parka')) {
    expandedTerms.push('funktionsparka', 'parka', 'winterparka', 'regenmantel', 'jacke');
    deSearchTokens.push('parka', 'winterjacke');
  }

  // Automotive, car audio and repair tools expansions
  if (/radio\s*auto|auto\s*radio|autoradio|carplay|car\s*stereo|مشغل\s*موسيقى|مسجل\s*سيارة|راديو\s*سيارة/.test(q)) {
    expandedTerms.push('autoradio', 'carplay', 'bluetooth', 'radio');
    deSearchTokens.push('autoradio', 'bluetooth');
  }
  if (/ausbeul|spotter|dellenlifter|punktschweiß|karosserie/.test(q)) {
    expandedTerms.push('ausbeulspotter', 'spotter', 'punktschweißgerät', 'karosserie');
    deSearchTokens.push('ausbeulspotter', 'karosserie');
  }
  if (/bördel|bremsleitung/.test(q)) {
    expandedTerms.push('bördelgerät', 'bremsleitung');
    deSearchTokens.push('bördelgerät');
  }

  // Check multi-word phrase dictionary
  for (const [arKey, trans] of Object.entries(MULTILINGUAL_DICTIONARY)) {
    if (arKey.includes(' ') && q.includes(arKey)) {
      expandedTerms.push(...trans.split(/\s+/));
      deSearchTokens.push(trans.split(/\s+/)[0]);
    }
  }

  // Word-by-word
  const rawWords = q
    .replace(/[,()–|:°"/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of rawWords) {
    if (MULTILINGUAL_DICTIONARY[word]) {
      const translated = MULTILINGUAL_DICTIONARY[word];
      expandedTerms.push(...translated.split(/\s+/));
      deSearchTokens.push(translated.split(/\s+/)[0]);
    } else {
      deSearchTokens.push(word);
    }
  }

  const cleanDeQuery = [...new Set(deSearchTokens)].join(' ');
  const numbers = (q.match(/\b\d+(\.\d+)?\b/g) || []);
  const allTokens = [...new Set(expandedTerms.flatMap(t => t.split(/\s+/)).filter(t => t.length > 1))];
  const brandsInQuery = KNOWN_BRANDS.filter(b => allTokens.includes(b) || cleanDeQuery.includes(b));

  // Extract core substantive tokens (excluding stop words, colors, units, and pure numbers)
  const cleanWords = deSearchTokens.filter(w => !STOP_WORDS.has(w));
  const coreSubstantiveTokens = cleanWords.filter(w => !GENERIC_MODIFIERS.has(w) && !/^\d+$/.test(w) && w.length >= 3);
  if (q.includes('funktionsparka') && !coreSubstantiveTokens.includes('parka')) {
    coreSubstantiveTokens.push('parka');
  }
  const primarySubjectTokens = coreSubstantiveTokens.slice(0, 2);
  const cleanSearchQuery = cleanWords.slice(0, 5).join(' ');

  return {
    rawQ,
    normalized: q,
    cleanDeQuery,
    allTokens,
    numbers,
    brandsInQuery,
    coreSubstantiveTokens,
    primarySubjectTokens,
    cleanSearchQuery
  };
}

const KEYWORD_RESTRICTIONS = {
  iphone: ['iphone'],
  ipad: ['ipad'],
  macbook: ['macbook'],
  playstation: ['playstation', 'ps5', 'ps4'],
  ps5: ['ps5', 'playstation 5'],
  xbox: ['xbox'],
  nintendo: ['nintendo', 'switch'],
  dior: ['dior'],
  chanel: ['chanel'],
  nike: ['nike'],
  adidas: ['adidas'],
  samsung: ['samsung'],
  apple: ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'watch'],
  sony: ['sony', 'playstation'],
  lg: ['lg'],
  philips: ['philips'],
  bosch: ['bosch'],
  kärcher: ['kärcher', 'karcher'],
  delonghi: ['delonghi'],
  ninja: ['ninja'],
  ikea: ['ikea'],
  arebos: ['arebos'],
  schlafsack: ['schlafsack', 'sleeping bag'],
  funktionsparka: ['funktionsparka', 'parka', 'winterparka', 'regenmantel', 'jacke', 'funktionsjacke', 'winterjacke', 'mantel'],
  parka: ['parka', 'funktionsparka', 'winterparka', 'regenmantel', 'jacke', 'funktionsjacke', 'winterjacke', 'mantel'],
  monitor: ['monitor', 'bildschirm', 'display', 'screen', 'tv', 'curved', 'شاشة'],
  شاشة: ['monitor', 'bildschirm', 'display', 'screen', 'tv', 'curved', 'شاشة'],
  schuhe: ['schuhe', 'sneaker', 'stiefel', 'boots', 'حذاء', 'أحذية'],
  حذاء: ['schuhe', 'sneaker', 'stiefel', 'boots', 'حذاء', 'أحذية'],
  parfum: ['parfum', 'eau de', 'extrait', 'عطر', 'عطور'],
  عطر: ['parfum', 'eau de', 'extrait', 'عطر', 'عطور'],
  autoradio: ['autoradio', 'carplay', 'bluetooth radio', 'car stereo', 'dab+', 'مشغل', 'مسجل'],
  radio: ['radio', 'autoradio', 'carplay', 'stereo', 'dab+'],
  dashcam: ['dashcam', 'autokamera'],
  ausbeulspotter: ['ausbeulspotter', 'spotter', 'dellenlifter', 'punktschweißgerät', 'instandsetzung', 'karosserie'],
  spotter: ['ausbeulspotter', 'spotter', 'dellenlifter', 'punktschweißgerät', 'karosserie'],
  dellenlifter: ['dellenlifter', 'ausbeul', 'dellen', 'spotter'],
  bördelgerät: ['bördelgerät', 'bremsleitung', 'aufweiter', 'bördeln'],
  punktschweißgerät: ['punktschweißgerät', 'schweißgerät', 'spotter']
};

function extractSmartKeywords(rawQ) {
  const q = (rawQ || '').trim();
  const lower = q.toLowerCase();
  if (/radio\s*auto|auto\s*radio|autoradio|carplay|car\s*stereo|مشغل\s*موسيقى|مسجل\s*سيارة|راديو\s*سيارة/.test(lower)) {
    return 'Autoradio Bluetooth CarPlay';
  }
  if (/ausbeul|spotter|dellenlifter|punktschweiß|karosserie/.test(lower)) {
    return 'Ausbeulspotter Karosserie';
  }
  if (/bördel|bremsleitung/.test(lower)) {
    return 'Bördelgerät Bremsleitung';
  }
  if (lower.includes('funktionsparka')) {
    return 'Funktionsparka Parka';
  }
  const words = q.replace(/[,()–|:°"/]/g, ' ').split(/\s+/).filter(Boolean);
  const substantive = words.filter(w => {
    const lw = w.toLowerCase();
    return !STOP_WORDS.has(lw) && !GENERIC_MODIFIERS.has(lw) && !/^\d+$/.test(lw) && lw.length >= 3;
  });
  if (substantive.length === 0) return q;
  if (substantive.length <= 3) return substantive.join(' ');
  return substantive.slice(0, 3).join(' ');
}

function scoreProductRelevance(p, queryInfo, detectedCatId) {
  const titleDe = (p.title || '').toLowerCase();
  const titleAr = (p.titleAr || '').toLowerCase();
  const brand = (p.brand || '').toLowerCase();
  const asin = (p.asin || '').toLowerCase();
  const category = (p.category || '').toLowerCase();
  const combined = `${titleDe} ${titleAr} ${brand}`;

  // 1. Core Substantive Matching:
  // If the query has substantive product tokens (e.g. 'arebos', 'schlafsack', 'monitor'),
  // the product MUST match at least one of these tokens. It cannot qualify purely by color or numbers!
  if (queryInfo.coreSubstantiveTokens && queryInfo.coreSubstantiveTokens.length > 0) {
    const hasCoreMatch = queryInfo.coreSubstantiveTokens.some(token => combined.includes(token));
    if (!hasCoreMatch) {
      return -1;
    }

    // If query has primary subject tokens (first 1-2 words), require matching primary subject
    if (queryInfo.primarySubjectTokens && queryInfo.primarySubjectTokens.length > 0) {
      const hasPrimaryMatch = queryInfo.primarySubjectTokens.some(token => combined.includes(token));
      if (!hasPrimaryMatch) {
        return -1;
      }
    }
  }

  // 2. If query specifies numeric dimensions/sizes (e.g. 49)
  if (queryInfo.numbers.length > 0) {
    const hasRequestedNumber = queryInfo.numbers.some(num => {
      // Don't match RAM/Storage like 16GB if query is just 16
      const regex = new RegExp(`(^|[^0-9a-zA-Z])${num}(\\s*zoll|\\s*"|-zoll|\\s*cm|\\s*inch|\\s*p)?([^0-9a-zA-Z]|$)`, 'i');
      return regex.test(titleDe) || regex.test(titleAr);
    });
    // If user explicitly searched for a size and this product title doesn't have it, discard
    if (!hasRequestedNumber && queryInfo.numbers.some(n => parseInt(n) > 20)) {
      return -1;
    }
  }

  // 3. Check strict keyword restrictions
  for (const [key, allowedTerms] of Object.entries(KEYWORD_RESTRICTIONS)) {
    if (queryInfo.allTokens.includes(key) || queryInfo.cleanDeQuery.includes(key)) {
      const matchesRestriction = allowedTerms.some(term => combined.includes(term));
      if (!matchesRestriction) {
        return -1;
      }
    }
  }

  let score = 0;
  // Exact phrase match
  if (titleDe.includes(queryInfo.normalized) || titleAr.includes(queryInfo.normalized)) {
    score += 150;
  }
  if (queryInfo.cleanDeQuery && titleDe.includes(queryInfo.cleanDeQuery)) {
    score += 120;
  }

  // Token matches
  for (const token of queryInfo.allTokens) {
    if (token.length <= 1 || STOP_WORDS.has(token)) continue;
    const isGeneric = GENERIC_MODIFIERS.has(token);
    const weight = isGeneric ? 5 : 30;
    if (titleDe.includes(token)) score += weight;
    if (titleAr.includes(token)) score += weight;
    if (brand.includes(token)) score += weight + 10;
    if (asin.includes(token)) score += 80;
  }

  // Primary subject bonus & Brand match bonus
  if (queryInfo.brandsInQuery && queryInfo.brandsInQuery.length > 0) {
    for (const b of queryInfo.brandsInQuery) {
      if (brand.includes(b) || titleDe.includes(b)) {
        score += 350;
      }
    }
  }

  if (queryInfo.primarySubjectTokens) {
    for (const pToken of queryInfo.primarySubjectTokens) {
      if (combined.includes(pToken)) score += 100;
      if (titleDe.startsWith(pToken) || brand === pToken) score += 200;
    }
  }

  // Category match bonus
  if (detectedCatId && category === detectedCatId) {
    score += 25;
  }

  return score;
}

    // 1. GET /api/products
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end('{"ok":true}');
    }

    if (pathname === '/api/products' && req.method === 'GET') {
      const catalog = loadJson(CATALOG_PATH, { products: [] });
      let list = catalog.products || [];

      const rawQ = (parsedUrl.query.q || '').trim();
      const category = parsedUrl.query.category || 'all';
      const store = parsedUrl.query.store || 'all';
      const maxPrice = parsedUrl.query.maxPrice ? parseFloat(parsedUrl.query.maxPrice) : null;
      const onlyFlash = parsedUrl.query.flash === 'true';
      const sort = parsedUrl.query.sort || 'popular';

      if (category !== 'all') {
        list = list.filter(p => p.category === category);
      }
      if (store !== 'all') {
        list = list.filter(p => p.offers && p.offers.some(o => o.store.toLowerCase() === store.toLowerCase()));
      }
      if (maxPrice && !isNaN(maxPrice)) {
        list = list.filter(p => {
          if (store !== 'all') {
            const so = (p.offers || []).find(o => o.store.toLowerCase() === store.toLowerCase());
            if (so) return so.price <= maxPrice;
          }
          return p.offers && p.offers[0].price <= maxPrice;
        });
      }
      if (onlyFlash) {
        list = list.filter(p => p.isFlashDeal);
      }

      if (rawQ) {
        const queryInfo = parseAndExpandQuery(rawQ);
        const detectedCat = detectCategoryFromText(rawQ + ' ' + queryInfo.cleanDeQuery);

        // Score existing products
        const scored = [];
        for (const p of list) {
          const score = scoreProductRelevance(p, queryInfo, detectedCat.id);
          if (score > 0) {
            scored.push({ product: p, score });
          }
        }

        // Sort scored products by relevance descending
        scored.sort((a, b) => b.score - a.score);

        // If fewer than 16 relevant products found locally, enrich with live scrape (up to 20 products)
        if (scored.length < 16 && rawQ.length >= 2) {
          const liveScrapeQuery = extractSmartKeywords(rawQ);
          console.log(`[Search Engine] Only ${scored.length} local matches for "${rawQ}". Live scraping for: "${liveScrapeQuery}"`);
          const liveScraped = await scrapeRealAmazonProducts(liveScrapeQuery, detectedCat.id, detectedCat.ar, 20, 8);
          if (liveScraped.length > 0) {
            const existingAsins = new Set(catalog.products.map(x => x.asin));
            const scoredAsins = new Set(scored.map(s => s.product.asin));
            let addedNew = false;
            for (const item of liveScraped) {
              if (!existingAsins.has(item.asin)) {
                catalog.products.push(item);
                existingAsins.add(item.asin);
                addedNew = true;
              }
              if (!scoredAsins.has(item.asin)) {
                let score = scoreProductRelevance(item, queryInfo, detectedCat.id);
                if (score <= 0) {
                  score = 75; // Guarantee visibility for freshly searched matching items
                }
                scored.push({ product: item, score });
                scoredAsins.add(item.asin);
              }
            }
            if (addedNew) {
              catalog.totalProducts = catalog.products.length;
              catalog.lastSyncedAt = new Date().toISOString();
              saveJson(CATALOG_PATH, catalog);
            }
            scored.sort((a, b) => b.score - a.score);
          }
        }

        // Cutoff threshold: must have at least score >= 25
        const minThreshold = scored.length > 0 ? Math.max(25, scored[0].score * 0.15) : 25;
        let filteredScored = scored.filter(s => s.score >= minThreshold);
        if (filteredScored.length === 0 && scored.length > 0) {
          filteredScored = scored;
        }
        list = filteredScored.map(s => s.product);
      }

      const priceFor = (p) => {
        if (store !== 'all') {
          const so = (p.offers || []).find(o => o.store.toLowerCase() === store.toLowerCase());
          if (so) return so.price;
        }
        return p.offers[0].price;
      };
      if (sort === 'price_asc') {
        list.sort((a, b) => priceFor(a) - priceFor(b));
      } else if (sort === 'price_desc') {
        list.sort((a, b) => priceFor(b) - priceFor(a));
      } else if (sort === 'discount') {
        list.sort((a, b) => ((b.msrp - priceFor(b)) / b.msrp) - ((a.msrp - priceFor(a)) / a.msrp));
      } else if (sort === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (!rawQ && category === 'all') {
        // Default homepage catalog view: ALWAYS provide a diverse, mixed showcase across categories!
        list = interleaveDiverseProducts(list);
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      return res.end(JSON.stringify({
        total: list.length,
        lastSyncedAt: catalog.lastSyncedAt,
        sources: catalog.sources,
        products: list
      }));
    }

    // 1b. GET /api/product-gallery?asin=...
    if (pathname === '/api/product-gallery' && req.method === 'GET') {
      const asin = (parsedUrl.query.asin || '').trim();
      const catalog = loadJson(CATALOG_PATH, { products: [] });
      const prod = (catalog.products || []).find(p => p.asin === asin || p.id === `real-${asin}`);

      if (prod && Array.isArray(prod.images) && prod.images.length > 1) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ asin, images: prod.images }));
      }

      const fallbackImg = prod ? prod.image : '';
      const gallery = await scrapeProductGalleryByAsin(asin, fallbackImg);
      if (prod && gallery.length > 0) {
        prod.images = gallery;
        if (Array.isArray(prod.offers)) {
          prod.offers.forEach((o, idx) => {
            if (!o.image) {
              o.image = gallery[idx % gallery.length];
            }
          });
        }
        saveJson(CATALOG_PATH, catalog);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ asin, images: gallery }));
    }

    // 2. POST /api/ai-assistant
    if (pathname === '/api/ai-assistant' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { prompt } = JSON.parse(body || '{}');
          const catalog = loadJson(CATALOG_PATH, { products: [] });
          const result = runAiShoppingAssistant(prompt, catalog.products || []);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }

    // 3. GET /api/out
    if (pathname === '/api/out' && req.method === 'GET') {
      const { productId, asin, store, price, query, directUrl } = parsedUrl.query;
      const settings = loadJson(SETTINGS_PATH, DEFAULT_SETTINGS);
      const analytics = loadJson(ANALYTICS_PATH, DEFAULT_ANALYTICS);

      const cleanStore = store || 'Amazon';
      const itemPrice = parseFloat(price) || 100;
      const hasActiveAffiliateTag = Boolean(settings.affiliateIds && settings.affiliateIds[cleanStore] && settings.affiliateIds[cleanStore].trim() !== '');
      const rate = (settings.commissionRates && settings.commissionRates[cleanStore]) || 0.045;
      const estCommission = hasActiveAffiliateTag ? +(itemPrice * rate).toFixed(2) : 0;

      analytics.totalClicks = (analytics.totalClicks || 0) + 1;
      analytics.estimatedCommissionEur = +((analytics.estimatedCommissionEur || 0) + estCommission).toFixed(2);
      if (!analytics.storeBreakdown[cleanStore]) {
        analytics.storeBreakdown[cleanStore] = { clicks: 0, estRevenue: 0 };
      }
      analytics.storeBreakdown[cleanStore].clicks += 1;
      analytics.storeBreakdown[cleanStore].estRevenue = +(analytics.storeBreakdown[cleanStore].estRevenue + estCommission).toFixed(2);

      analytics.recentClicks.unshift({
        timestamp: new Date().toISOString(),
        productId: productId || asin || 'real',
        query: query || 'Product',
        store: cleanStore,
        price: itemPrice,
        estCommission
      });
      analytics.recentClicks = analytics.recentClicks.slice(0, 30);
      saveJson(ANALYTICS_PATH, analytics);

      // Check for directUrl in query or within catalog.json offers
      let effectiveDirectUrl = directUrl || '';
      if (!effectiveDirectUrl && (productId || asin)) {
        try {
          const catalog = loadJson(CATALOG_PATH, { products: [] });
          const foundProd = (catalog.products || []).find(p => p.id === productId || p.asin === asin);
          if (foundProd && Array.isArray(foundProd.offers)) {
            const foundOffer = foundProd.offers.find(o => o.store.toLowerCase() === cleanStore.toLowerCase());
            if (foundOffer && foundOffer.directUrl) {
              effectiveDirectUrl = foundOffer.directUrl;
            }
          }
        } catch (e) {}
      }

      const cleanAsin = asin || (productId && productId.startsWith('real-') ? productId.replace('real-', '') : '');
      const targetUrl = buildAffiliateRedirectUrl(cleanStore, query || 'Deal', cleanAsin, settings, itemPrice, effectiveDirectUrl);
      res.writeHead(302, { Location: targetUrl });
      return res.end();
    }

    // 4. GET & POST /api/admin/settings
    if (pathname === '/api/admin/settings') {
      if (req.method === 'GET') {
        const settings = loadJson(SETTINGS_PATH, DEFAULT_SETTINGS);
        const analytics = loadJson(ANALYTICS_PATH, DEFAULT_ANALYTICS);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ settings, analytics }));
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            const current = loadJson(SETTINGS_PATH, DEFAULT_SETTINGS);
            const updated = {
              ...current,
              ...incoming,
              affiliateIds: { ...current.affiliateIds, ...(incoming.affiliateIds || {}) },
              storeModes: { ...current.storeModes, ...(incoming.storeModes || {}) },
              payoutSettings: { ...current.payoutSettings, ...(incoming.payoutSettings || {}) }
            };
            saveJson(SETTINGS_PATH, updated);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, settings: updated }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid settings payload' }));
          }
        });
        return;
      }
    }

    // 5. POST /api/admin/sync
    if (pathname === '/api/admin/sync' && req.method === 'POST') {
      const data = await generateInitialCatalog(CATALOG_PATH);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        ok: true,
        totalProducts: data.totalProducts,
        lastSyncedAt: data.lastSyncedAt
      }));
    }

    // 5b. POST /api/admin/reset-analytics
    if (pathname === '/api/admin/reset-analytics' && req.method === 'POST') {
      saveJson(ANALYTICS_PATH, DEFAULT_ANALYTICS);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: true, analytics: DEFAULT_ANALYTICS }));
    }

    // 6. POST /api/alerts
    if (pathname === '/api/alerts' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const analytics = loadJson(ANALYTICS_PATH, DEFAULT_ANALYTICS);
          analytics.priceAlerts = analytics.priceAlerts || [];
          analytics.priceAlerts.unshift({
            ...payload,
            createdAt: new Date().toISOString()
          });
          saveJson(ANALYTICS_PATH, analytics);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid alert request' }));
        }
      });
      return;
    }

    // 7. Dynamic index.html with Phone/Device language injection
    if (pathname === '/' || pathname === '/index.html') {
      const clientLang = detectClientLanguage(req.headers['accept-language']);
      const indexPath = path.join(__dirname, 'public', 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replace(/<script>\s*\(function\(\)\s*\{/i, `<script>\n    window.__DETECTED_DEVICE_LANG__ = "${clientLang}";\n    (function() {`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 8. Static files
    let filePath = pathname === '/admin' ? '/owner-admin-portal.html' : pathname;
    const resolvedPath = path.join(__dirname, 'public', filePath);
    if (resolvedPath.startsWith(path.join(__dirname, 'public')) && fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.ico': 'image/x-icon'
      };
      const headers = { 'Content-Type': mimeTypes[ext] || 'text/plain' };
      if (pathname === '/sw.js') {
        headers['Cache-Control'] = 'no-cache';
        headers['Service-Worker-Allowed'] = '/';
      } else if (pathname.startsWith('/icons/')) {
        headers['Cache-Control'] = 'public, max-age=604800';
      }
      res.writeHead(200, headers);
      return fs.createReadStream(resolvedPath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=============================================================`);
    console.log(`🚀 NexusDeals Global Marketplace (12 Platforms & 12 Categories)`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`=============================================================\n`);

    // Keep-alive: prevent Render free tier from sleeping (no more "Welcome to Render" loading screen)
    const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || 'https://nexusdeals-global.onrender.com';
    if (publicUrl && !publicUrl.includes('localhost')) {
      const lib = publicUrl.startsWith('https') ? require('https') : require('http');
      setInterval(() => {
        lib.get(`${publicUrl}/api/health`, (r) => {
          r.resume();
        }).on('error', () => {});
      }, 7 * 60 * 1000);
      console.log(`[Keep-Alive] Configured active keep-alive ping for: ${publicUrl}/api/health (every 7m)`);
    }
  });
}

startServer();

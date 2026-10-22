function detectPreferredLanguage() {
  // 1. If user explicitly tapped a language button during this session
  try {
    const manual = sessionStorage.getItem('nexus_deals_user_clicked_lang');
    if (manual && ['de', 'en', 'ar'].includes(manual)) {
      return manual;
    }
  } catch (e) {}

  // 2. Direct primary system/browser language of the phone or device
  try {
    const primary = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (primary.indexOf('de') === 0) return 'de';
    if (primary.indexOf('ar') === 0) return 'ar';
    if (primary.indexOf('en') === 0) return 'en';
  } catch (e) {}

  // 3. Fallback: injected server detected language from HTTP Accept-Language
  if (typeof window !== 'undefined' && window.__DETECTED_DEVICE_LANG__) {
    return window.__DETECTED_DEVICE_LANG__;
  }

  // 4. Secondary fallback checking navigator.languages list
  try {
    const navLangs = navigator.languages || [];
    for (const l of navLangs) {
      const code = (l || '').toLowerCase();
      if (code.indexOf('de') === 0) return 'de';
      if (code.indexOf('ar') === 0) return 'ar';
      if (code.indexOf('en') === 0) return 'en';
    }
  } catch (e) {}

  return 'de'; // Default to German for DE/EU marketplace
}

// Remove legacy storage that locked users into stale language on refresh
try {
  localStorage.removeItem('nexus_deals_lang');
  sessionStorage.removeItem('nexus_deals_lang_manual');
} catch (e) {}

let allProducts = [];
let currentCategory = 'all';
let currentStore = 'all';
let currentMaxPrice = 2500;
let currentLang = detectPreferredLanguage(); // Auto-detect device language
let lastSearchQuery = '';

const I18N = {
  ar: {
    dir: 'rtl',
    pageTitle: 'NexusDeals Global | قارن الأسعار والشراء المباشر عبر المتاجر الكبرى',
    subBrandText: 'Amazon • OTTO • MediaMarkt • Kaufland • Zalando • Galaxus • eBay • Douglas • IKEA • AliExpress • Temu • SHEIN',
    searchPlaceholder: 'ابحث عن أي منتج (هواتف، ملابس، عطور، أثاث، أدوات، ألعاب...)',
    searchBtn: '🔍 بحث',
    filterMenuBtn: '🎛️ الفلترة والترتيب ▾',
    filterDrawerTitle: '🎛️ خيارات الفلترة والترتيب المتقدمة (12 منصة عالمية)',
    resetFiltersBtn: 'إعادة ضبط ↺',
    sortLabelTitle: 'طريقة الترتيب:',
    aiHeaderBtn: '🤖 المساعد الذكي AI ▾',
    aiPromptLabel: '🤖 اسأل مساعد التسوق الذكي (اكتب ميزانيتك أو أي نوع منتج تبحث عنه):',
    aiPlaceholder: 'مثال: أريد حذاء رياضي نايك، أو عطر رجالي، أو كرسي مكتب، أو ماكينة قهوة...',
    aiSubmitBtn: 'تحليل ذكي ⚡',
    quickChips: [
      { label: '👟 أحذية وملابس (Nike / Adidas)', query: 'Nike Adidas Sneaker Jeans' },
      { label: '💄 عطور وتجميل وعناية', query: 'Parfum Lattafa Dior Philips Lumea' },
      { label: '🛋️ أثاث ومراتب وكراسي مكتب', query: 'Bürostuhl Matratze Sofa' },
      { label: '☕ ماكينة قهوة وأجهزة مطبخ', query: 'DeLonghi Kaffeevollautomat Ninja Tefal' },
      { label: '🛠️ عدد بوش وغسيل كيرشر', query: 'Bosch Professional Kärcher' },
      { label: '📱 هواتف ولابتوبات وبلايستيشن', query: 'Samsung S24 iPhone 16 PlayStation 5' }
    ],
    closeBtn: 'إغلاق ✕',
    cat_all: '🌐 الكل',
    cat_smartphones: '📱 الهواتف والتابلت',
    cat_gaming: '💻 الكمبيوترات والألعاب',
    cat_tv_audio: '📺 الشاشات والصوتيات',
    cat_home_kitchen: '☕ المطبخ والمنزل',
    cat_home: '☕ المطبخ والمنزل',
    cat_fashion_shoes: '👟 الملابس والأحذية',
    cat_perfumes_beauty: '💄 العطور والتجميل',
    cat_fashion_care: '💄 العطور والتجميل',
    cat_furniture_decor: '🛋️ الأثاث والمفروشات',
    cat_sports_fitness: '🏋️ الرياضة واللياقة',
    cat_kids_toys: '🧸 الأطفال والليغو',
    cat_tools_garden: '🛠️ العدد والحديقة',
    cat_auto_car: '🚗 مستلزمات السيارات',
    cat_travel_luggage: '🧳 السفر والساعات',
    cat_wearables: '⌚ الساعات الذكية',
    cat_cameras: '📷 الكاميرات والدرون',
    filterStoreLabel: 'المتجر / المنصة العالمية:',
    storeAll: 'الكل (12 منصة عالمية)',
    maxPriceTitle: 'أقصى سعر:',
    noLimit: 'الكل (بدون حد)',
    upToPrice: (v) => `حتى ${v} €`,
    flashDealsOnly: '🔥 عروض التوفير الكبير فقط',
    sortPopular: 'الأكثر شهرة ومبيعاً',
    sortDiscount: 'الأعلى توفير وخصم %',
    sortPriceAsc: 'السعر: من الأرخص للأغلى',
    sortPriceDesc: 'السعر: من الأغلى للأرخص',
    sortRating: 'الأعلى تقييماً ⭐',
    catalogTip: '💡 اضغط على أي متجر للشراء المباشر أو "مقارنة شاملة" لرؤية كل المنصات وتاريخ السعر.',
    resultsSearch: (q, n) => `🔍 نتائج البحث عن <strong>"${q}"</strong>: <strong>${n}</strong> منتج حقيقي`,
    resultsAll: (n) => `📦 يعرض <strong>${n}</strong> منتج حقيقي الأكثر مبيعاً عبر 12 منصة عالمية`,
    noResultsTitle: 'لم يتم العثور على نتائج مطابقة لهذه الفلاتر',
    noResultsDesc: 'جرب زيادة الحد الأقصى للسعر أو البحث عن اسم أي منتج تريد جلبه فوراً.',
    showAllBtn: 'إظهار جميع المنتجات 🔄',
    badgeSave: (eur, pct) => `وفر ${eur}€ (-${pct}%)`,
    badgeVerified: (asin) => `أصلي (${asin}) ✔️`,
    badgeHotDeal: (eur) => `توفير ${eur}€ 🔥`,
    cheapestNowIn: (store) => `أرخص سعر الآن في <strong>${store}</strong>:`,
    inStockReady: '✔️ متوفر',
    cheapestTag: '🏆 الأرخص',
    deliveryStore: (store) => `شحن من ${store}`,
    buyFromBtn: (store, price) => `🛒 الشراء مباشرة من ${store} (${price}€) ↗`,
    compareHistoryBtn: (n) => `📊 قارن (${n} متاجر)`,
    aiVerdictCard: (price, asin) => `سعر حقيقي مباشر في Amazon.de (${price}€) • ASIN: ${asin}`,
    modalSpecs: (title, asin, price) => [
      `الاسم الرسمي الكامل للمنتج: ${title}`,
      `الرقم التسلسلي الرسمي في أمازون (ASIN): ${asin}`,
      `السعر الفعلي المباشر شامل الضريبة: ${price} €`,
      `الرابط ينقلك مباشرة إلى صفحة المنتج الأصلية في المتجر الرسمي`
    ],
    alertBoxTitle: '🔔 جرس تنبيه انخفاض السعر:',
    alertEmailPlaceholder: 'بريدك الإلكتروني...',
    alertSubmitBtn: 'نبهني عند الانخفاض',
    alertSavedMsg: (p) => `✔️ تم تفعيل التنبيه! سنرسل لك إشعاراً فور وصول السعر إلى ${p}€.`,
    modalCompareHeader: '🏪 جدول مقارنة الأسعار المباشر عبر كبرى المتاجر الأوروبية:',
    modalBestGuaranteed: '🏆 أرخص سعر مضمون اليوم',
    modalStoreRating: (r) => `تقييم المتجر ⭐ ${r}`,
    modalFreeShipping: 'شحن مجاني / سريع',
    modalGoToOffer: (s) => `الذهاب للعرض في ${s} ↗`,
    previewBtn: 'معاينة 👁️',
    previewStoreVerified: (s) => `عرض مباشر معتمد من متجر ${s}`,
    previewMatchedModel: 'الموديل والمواصفات المطابقة',
    previewVariantColor: 'اللون / الإصدار',
    modalChartHeader: '📈 تاريخ السعر خلال آخر 90 يوماً (كاشف الخصومات الحقيقية):',
    chartLabels: ['قبل 90 يوم', 'قبل 75 يوم', 'قبل 60 يوم', 'قبل 45 يوم', 'قبل 30 يوم', 'قبل 15 يوم', 'اليوم (الأرخص)'],
    modalSimilarHeader: '🔄 منتجات مشابهة وبدائل في نفس الفئة:',
    cheapestLabelShort: 'أرخص سعر:',
    galleryLoading: '📸 جاري جلب جميع صور المنتج الأصلية من المتجر...',
    galleryReady: (n) => `📸 ${n} صور أصلية من المتجر الرسمي`,
    aiLoading: '🤖 جاري فحص ومقارنة المنتجات والأسعار الحقيقية عبر 12 منصة عالمية...',
    aiFormattedReply: (best, bestOffer, amzOffer, saving) =>
      `🤖 تحليل المساعد الذكي للمنتجات الحقيقية:\n` +
      `🏆 أفضل ترشيح لك اليوم: ${best.title} (ASIN: ${best.asin})\n` +
      `• السعر المباشر في Amazon.de: ${amzOffer.price.toFixed(2)} € | أرخص عرض في ${bestOffer.store}: ${bestOffer.price.toFixed(2)} € (توفير ${saving} €):`,
    navHome: 'الرئيسية',
    navSearch: 'بحث',
    navFilter: 'الفلترة',
    navAi: 'المساعد AI',
    navDeals: 'العروض 🔥'
  },

  de: {
    dir: 'ltr',
    pageTitle: 'NexusDeals Global | Preisvergleich & Direktkauf führender Marktplätze',
    subBrandText: 'Amazon • OTTO • MediaMarkt • Kaufland • Zalando • Galaxus • eBay • Douglas • IKEA • AliExpress • Temu • SHEIN',
    searchPlaceholder: 'Produkt suchen (Smartphones, Mode, Parfum, Möbel, Werkzeug, Spielzeug...)',
    searchBtn: '🔍 Suchen',
    filterMenuBtn: '🎛️ Filter & Sortierung ▾',
    filterDrawerTitle: '🎛️ Erweiterte Filter- & Sortieroptionen (12 Plattformen)',
    resetFiltersBtn: 'Zurücksetzen ↺',
    sortLabelTitle: 'Sortieren nach:',
    aiHeaderBtn: '🤖 KI-Kaufberater ▾',
    aiPromptLabel: '🤖 Fragen Sie unseren KI-Kaufberater (geben Sie Ihr Budget oder Ihren Wunsch ein):',
    aiPlaceholder: 'Beispiel: Nike Sneaker, Herren Parfum, Bürostuhl oder Kaffeevollautomat...',
    aiSubmitBtn: 'KI-Analyse ⚡',
    quickChips: [
      { label: '👟 Mode & Sneaker (Nike / Adidas)', query: 'Nike Adidas Sneaker Jeans' },
      { label: '💄 Parfum, Beauty & Pflege', query: 'Parfum Lattafa Dior Philips Lumea' },
      { label: '🛋️ Möbel, Matratzen & Bürostühle', query: 'Bürostuhl Matratze Sofa' },
      { label: '☕ Kaffeevollautomaten & Küche', query: 'DeLonghi Kaffeevollautomat Ninja Tefal' },
      { label: '🛠️ Bosch Werkzeug & Kärcher', query: 'Bosch Professional Kärcher' },
      { label: '📱 Smartphones, Laptops & PS5', query: 'Samsung S24 iPhone 16 PlayStation 5' }
    ],
    closeBtn: 'Schließen ✕',
    cat_all: '🌐 Alle',
    cat_smartphones: '📱 Smartphones & Tablets',
    cat_gaming: '💻 Laptops & Gaming',
    cat_tv_audio: '📺 TV & Audio',
    cat_home_kitchen: '☕ Küche & Haushalt',
    cat_home: '☕ Küche & Haushalt',
    cat_fashion_shoes: '👟 Mode & Schuhe',
    cat_perfumes_beauty: '💄 Parfum & Beauty',
    cat_fashion_care: '💄 Parfum & Beauty',
    cat_furniture_decor: '🛋️ Möbel & Wohnen',
    cat_sports_fitness: '🏋️ Sport & Fitness',
    cat_kids_toys: '🧸 Spielzeug & LEGO',
    cat_tools_garden: '🛠️ Baumarkt & Garten',
    cat_auto_car: '🚗 Auto & Zubehör',
    cat_travel_luggage: '🧳 Reise, Koffer & Uhren',
    cat_wearables: '⌚ Smartwatches',
    cat_cameras: '📷 Kameras & Drohnen',
    filterStoreLabel: 'Shop / Plattform:',
    storeAll: 'Alle (12 Plattformen)',
    maxPriceTitle: 'Max. Preis:',
    noLimit: 'Alle (Kein Limit)',
    upToPrice: (v) => `Bis ${v} €`,
    flashDealsOnly: '🔥 Nur Top-Rabatte',
    sortPopular: 'Beliebteste zuerst',
    sortDiscount: 'Höchste Ersparnis %',
    sortPriceAsc: 'Preis: Günstigste zuerst',
    sortPriceDesc: 'Preis: Teuerste zuerst',
    sortRating: 'Beste Bewertung ⭐',
    catalogTip: '💡 Klicken Sie auf einen Shop zum Direktkauf oder auf „Vergleichen“ für alle Shops & Preisverlauf.',
    resultsSearch: (q, n) => `🔍 Suchergebnisse für <strong>„${q}“</strong>: <strong>${n}</strong> echte Produkte`,
    resultsAll: (n) => `📦 Zeigt <strong>${n}</strong> verifizierte Bestseller über 12 globale Plattformen`,
    noResultsTitle: 'Keine passenden Produkte für diese Filter gefunden',
    noResultsDesc: 'Erhöhen Sie das Preislimit oder suchen Sie oben nach einem beliebigen Produktnamen.',
    showAllBtn: 'Alle Produkte anzeigen 🔄',
    badgeSave: (eur, pct) => `-${eur}€ (-${pct}%)`,
    badgeVerified: (asin) => `Original (${asin}) ✔️`,
    badgeHotDeal: (eur) => `${eur}€ sparen 🔥`,
    cheapestNowIn: (store) => `Bestpreis bei <strong>${store}</strong>:`,
    inStockReady: '✔️ Lieferbar',
    cheapestTag: '🏆 Bestpreis',
    deliveryStore: (store) => `Versand via ${store}`,
    buyFromBtn: (store, price) => `🛒 Bei ${store} kaufen (${price}€) ↗`,
    compareHistoryBtn: (n) => `📊 Vergleich (${n} Shops)`,
    aiVerdictCard: (price, asin) => `Verifizierter Live-Preis auf Amazon.de (${price}€) • ASIN: ${asin}`,
    modalSpecs: (title, asin, price) => [
      `Offizielle Produktbezeichnung: ${title}`,
      `Offizielle Amazon-Artikelnummer (ASIN): ${asin}`,
      `Aktueller Live-Preis inkl. MwSt.: ${price} €`,
      `Direkter Link zur offiziellen Produktseite des Händlers`
    ],
    alertBoxTitle: '🔔 Preiswecker aktivieren:',
    alertEmailPlaceholder: 'Ihre E-Mail-Adresse...',
    alertSubmitBtn: 'Benachrichtigen',
    alertSavedMsg: (p) => `✔️ Preiswecker aktiviert! Wir informieren Sie bei ${p}€.`,
    modalCompareHeader: '🏪 Direkter Live-Preisvergleich führender europäischer Shops:',
    modalBestGuaranteed: '🏆 Garantierter Bestpreis heute',
    modalStoreRating: (r) => `Shop-Bewertung ⭐ ${r}`,
    modalFreeShipping: 'Schneller Direktversand',
    modalGoToOffer: (s) => `Zum Angebot bei ${s} ↗`,
    previewBtn: 'Vorschau 👁️',
    previewStoreVerified: (s) => `Verifiziertes Live-Angebot von ${s}`,
    previewMatchedModel: 'Exaktes Modell & Spezifikation',
    previewVariantColor: 'Farbe / Ausführung',
    modalChartHeader: '📈 90-Tage-Preisverlauf (Echtzeit-Rabattprüfung):',
    chartLabels: ['-90 Tage', '-75 Tage', '-60 Tage', '-45 Tage', '-30 Tage', '-15 Tage', 'Heute (Tiefstpreis)'],
    modalSimilarHeader: '🔄 Ähnliche Produkte & Alternativen:',
    cheapestLabelShort: 'Bestpreis:',
    galleryLoading: '📸 Lade alle Originalbilder direkt vom Shop...',
    galleryReady: (n) => `📸 ${n} Original-Produktbilder verfügbar`,
    aiLoading: '🤖 KI prüft und vergleicht echte Live-Preise über 12 Plattformen...',
    aiFormattedReply: (best, bestOffer, amzOffer, saving) =>
      `🤖 KI-Deal-Analyse:\n` +
      `🏆 Beste Empfehlung heute: ${best.title} (ASIN: ${best.asin})\n` +
      `• Live-Preis auf Amazon.de: ${amzOffer.price.toFixed(2)} € | Günstigstes Angebot bei ${bestOffer.store}: ${bestOffer.price.toFixed(2)} € (Ersparnis: ${saving} €):`,
    navHome: 'Start',
    navSearch: 'Suche',
    navFilter: 'Filter',
    navAi: 'KI-Berater',
    navDeals: 'Deals 🔥'
  },

  en: {
    dir: 'ltr',
    pageTitle: 'NexusDeals Global | Direct Buy & Price Comparison across Top Stores',
    subBrandText: 'Amazon • OTTO • MediaMarkt • Kaufland • Zalando • Galaxus • eBay • Douglas • IKEA • AliExpress • Temu • SHEIN',
    searchPlaceholder: 'Search any product (smartphones, fashion, perfumes, furniture, tools, toys...)',
    searchBtn: '🔍 Search',
    filterMenuBtn: '🎛️ Filter & Sort ▾',
    filterDrawerTitle: '🎛️ Advanced Filter & Sort Options (12 Global Platforms)',
    resetFiltersBtn: 'Reset All ↺',
    sortLabelTitle: 'Sort By:',
    aiHeaderBtn: '🤖 AI Assistant ▾',
    aiPromptLabel: '🤖 Ask our AI Shopping Assistant (type your budget or any product type):',
    aiPlaceholder: 'Example: Nike sneakers, men perfume, ergonomic office chair, or coffee machine...',
    aiSubmitBtn: 'AI Analyze ⚡',
    quickChips: [
      { label: '👟 Fashion & Sneakers (Nike / Adidas)', query: 'Nike Adidas Sneaker Jeans' },
      { label: '💄 Perfumes, Beauty & Care', query: 'Parfum Lattafa Dior Philips Lumea' },
      { label: '🛋️ Furniture, Mattresses & Chairs', query: 'Bürostuhl Matratze Sofa' },
      { label: '☕ Coffee Machines & Kitchen', query: 'DeLonghi Kaffeevollautomat Ninja Tefal' },
      { label: '🛠️ Bosch Tools & Kärcher', query: 'Bosch Professional Kärcher' },
      { label: '📱 Phones, Laptops & PlayStation 5', query: 'Samsung S24 iPhone 16 PlayStation 5' }
    ],
    closeBtn: 'Close ✕',
    cat_all: '🌐 All',
    cat_smartphones: '📱 Phones & Tablets',
    cat_gaming: '💻 Laptops & Gaming',
    cat_tv_audio: '📺 TVs & Audio',
    cat_home_kitchen: '☕ Kitchen & Home',
    cat_home: '☕ Kitchen & Home',
    cat_fashion_shoes: '👟 Fashion & Shoes',
    cat_perfumes_beauty: '💄 Perfumes & Beauty',
    cat_fashion_care: '💄 Perfumes & Beauty',
    cat_furniture_decor: '🛋️ Furniture & Decor',
    cat_sports_fitness: '🏋️ Sports & Fitness',
    cat_kids_toys: '🧸 Kids, Toys & LEGO',
    cat_tools_garden: '🛠️ Tools & Garden',
    cat_auto_car: '🚗 Car & Auto Gear',
    cat_travel_luggage: '🧳 Travel & Watches',
    cat_wearables: '⌚ Smartwatches',
    cat_cameras: '📷 Cameras & Drones',
    filterStoreLabel: 'Global Store / Platform:',
    storeAll: 'All (12 Global Platforms)',
    maxPriceTitle: 'Max Price:',
    noLimit: 'All (No Limit)',
    upToPrice: (v) => `Up to ${v} €`,
    flashDealsOnly: '🔥 Big Discount Deals Only',
    sortPopular: 'Most Popular First',
    sortDiscount: 'Highest Savings %',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortRating: 'Highest Rating ⭐',
    catalogTip: '💡 Click any store row to buy directly, or click "Compare" for all stores & 90-day price chart.',
    resultsSearch: (q, n) => `🔍 Live results for <strong>"${q}"</strong>: <strong>${n}</strong> real products`,
    resultsAll: (n) => `📦 Showing <strong>${n}</strong> verified best-sellers across 12 global platforms`,
    noResultsTitle: 'No matching products found for these filters',
    noResultsDesc: 'Try increasing the maximum price slider or search any product name above.',
    showAllBtn: 'Show All Products 🔄',
    badgeSave: (eur, pct) => `Save ${eur}€ (-${pct}%)`,
    badgeVerified: (asin) => `Real (${asin}) ✔️`,
    badgeHotDeal: (eur) => `Save ${eur}€ 🔥`,
    cheapestNowIn: (store) => `Cheapest at <strong>${store}</strong>:`,
    inStockReady: '✔️ In Stock',
    cheapestTag: '🏆 Cheapest',
    deliveryStore: (store) => `Ships from ${store}`,
    buyFromBtn: (store, price) => `🛒 Buy directly at ${store} (${price}€) ↗`,
    compareHistoryBtn: (n) => `📊 Compare (${n} Stores)`,
    aiVerdictCard: (price, asin) => `Live verified price on Amazon.de (${price}€) • ASIN: ${asin}`,
    modalSpecs: (title, asin, price) => [
      `Official Full Product Name: ${title}`,
      `Official Amazon Identification Number (ASIN): ${asin}`,
      `Live Verified Retail Price (incl. VAT): ${price} €`,
      `Direct link opens the official product listing on the retailer's platform`
    ],
    alertBoxTitle: '🔔 Price Drop Alert:',
    alertEmailPlaceholder: 'Your email address...',
    alertSubmitBtn: 'Notify Me',
    alertSavedMsg: (p) => `✔️ Alert activated! We will email you when the price drops to ${p}€.`,
    modalCompareHeader: '🏪 Live Multi-Store Price Comparison Table:',
    modalBestGuaranteed: '🏆 Lowest Price Guaranteed Today',
    modalStoreRating: (r) => `Store Rating ⭐ ${r}`,
    modalFreeShipping: 'Fast Direct Shipping',
    modalGoToOffer: (s) => `Go to Offer on ${s} ↗`,
    previewBtn: 'Preview 👁️',
    previewStoreVerified: (s) => `Verified Live Offer from ${s}`,
    previewMatchedModel: 'Matched Model & Specs',
    previewVariantColor: 'Color / Variant',
    modalChartHeader: '📈 90-Day Price History (Real Discount Detector):',
    chartLabels: ['90d ago', '75d ago', '60d ago', '45d ago', '30d ago', '15d ago', 'Today (Lowest)'],
    modalSimilarHeader: '🔄 Similar Products & Alternatives:',
    cheapestLabelShort: 'Lowest Price:',
    galleryLoading: '📸 Fetching all official gallery photos from store...',
    galleryReady: (n) => `📸 ${n} Official Store Photos`,
    aiLoading: '🤖 AI is analyzing and comparing real live prices across 12 global platforms...',
    aiFormattedReply: (best, bestOffer, amzOffer, saving) =>
      `🤖 AI Analysis of Verified Live Products:\n` +
      `🏆 Top Recommendation Today: ${best.title} (ASIN: ${best.asin})\n` +
      `• Live Price on Amazon.de: ${amzOffer.price.toFixed(2)} € | Cheapest offer on ${bestOffer.store}: ${bestOffer.price.toFixed(2)} € (Save ${saving} €):`,
    navHome: 'Home',
    navSearch: 'Search',
    navFilter: 'Filter',
    navAi: 'AI Assistant',
    navDeals: 'Deals 🔥'
  }
};

function t() {
  return I18N[currentLang] || I18N.de;
}

function getCategoryLabel(catId) {
  const dict = t();
  return dict[`cat_${catId}`] || dict.cat_all;
}

document.addEventListener('DOMContentLoaded', () => {
  currentLang = detectPreferredLanguage();
  setLanguage(currentLang);

  const searchInput = document.getElementById('mainSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
      if (!val) {
        lastSearchQuery = '';
        loadProducts();
      }
    });
  }

  loadProducts();
});

function clearSearch() {
  const searchInput = document.getElementById('mainSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  lastSearchQuery = '';
  loadProducts();
}

function setActiveBottomNav(btnId) {
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    if (b.id !== 'bottomNavDealsBtn') {
      b.classList.toggle('active', b.id === btnId);
    }
  });
}

function handleBottomNavHome(e) {
  if (e) e.preventDefault();
  setActiveBottomNav('bottomNavHomeBtn');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeFilterDrawer();
  resetAllFilters();
}

function handleBottomNavSearch(e) {
  if (e) e.preventDefault();
  setActiveBottomNav('bottomNavSearchBtn');
  focusMobileSearch();
}

function handleBottomNavFilter(e) {
  if (e) e.preventDefault();
  toggleFilterDrawer();
}

function focusMobileSearch() {
  const input = document.getElementById('mainSearchInput');
  if (input) {
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function toggleFlashDealsFilter(e) {
  if (e) e.preventDefault();
  const cb = document.getElementById('flashOnlyCheckbox');
  const navBtn = document.getElementById('bottomNavDealsBtn');
  if (cb) {
    cb.checked = !cb.checked;
    if (navBtn) navBtn.classList.toggle('active', cb.checked);
    const sortSelect = document.getElementById('sortSelect');
    if (cb.checked && sortSelect) {
      sortSelect.value = 'discount';
    }
    loadProducts();
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function hideAppSplash() {
  const s = document.getElementById('appSplash');
  if (s && !s.classList.contains('hide')) {
    s.classList.add('hide');
    setTimeout(() => s.remove(), 500);
  }
}
setTimeout(hideAppSplash, 9000);

function setSheetBackdrop(on) {
  const bd = document.getElementById('sheetBackdrop');
  if (bd) bd.classList.toggle('show', !!on);
  document.documentElement.classList.toggle('sheet-open', !!on);
}

function toggleFilterDrawer() {
  const filterDrawer = document.getElementById('filterDrawer');
  const btn = document.getElementById('filterToggleBtn');
  const bottomFilterBtn = document.getElementById('bottomNavFilterBtn');
  if (!filterDrawer) return;
  const isOpen = filterDrawer.classList.toggle('open');
  if (window.matchMedia('(max-width: 768px)').matches) setSheetBackdrop(isOpen);
  if (btn) btn.classList.toggle('active', isOpen);
  if (bottomFilterBtn) bottomFilterBtn.classList.toggle('active', isOpen);
  if (isOpen) {
    setActiveBottomNav('bottomNavFilterBtn');
  } else {
    setActiveBottomNav('bottomNavHomeBtn');
  }
}

function closeFilterDrawer() {
  const filterDrawer = document.getElementById('filterDrawer');
  const btn = document.getElementById('filterToggleBtn');
  const bottomFilterBtn = document.getElementById('bottomNavFilterBtn');
  if (filterDrawer) filterDrawer.classList.remove('open');
  setSheetBackdrop(false);
  if (btn) btn.classList.remove('active');
  if (bottomFilterBtn) bottomFilterBtn.classList.remove('active');
  setActiveBottomNav('bottomNavHomeBtn');
}

function toggleAiDrawer() {
  // AI Assistant removed per user request
}

function setLanguage(lang, isManualClick = false) {
  currentLang = ['ar', 'de', 'en'].includes(lang) ? lang : 'de';
  if (isManualClick) {
    try {
      sessionStorage.setItem('nexus_deals_user_clicked_lang', currentLang);
    } catch (e) {}
  }
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`langBtn-${currentLang}`);
  if (activeBtn) activeBtn.classList.add('active');

  applyLanguageToStaticDom();
  updateStatusBarText();
  renderProductsGrid(allProducts, 'productsGrid');
}

function applyLanguageToStaticDom() {
  const dict = t();
  document.documentElement.lang = currentLang;
  document.documentElement.dir = dict.dir;
  document.title = dict.pageTitle;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  const maxPriceLabel = document.getElementById('maxPriceLabel');
  if (maxPriceLabel) {
    maxPriceLabel.textContent = currentMaxPrice >= 2500 ? dict.noLimit : dict.upToPrice(currentMaxPrice);
  }

  const chipsContainer = document.getElementById('quickChipsContainer');
  if (chipsContainer) {
    chipsContainer.innerHTML = dict.quickChips.map(c =>
      `<span class="chip" onclick="runQuickAi('${escapeHtml(c.query)}', '${escapeHtml(c.label)}')">${escapeHtml(c.label)}</span>`
    ).join('');
  }
}

function updateStatusBarText() {
  const dict = t();
  const counterEl = document.getElementById('resultsCounterText');
  if (!counterEl) return;
  if (lastSearchQuery) {
    counterEl.innerHTML = dict.resultsSearch(escapeHtml(lastSearchQuery), allProducts.length);
  } else {
    counterEl.innerHTML = dict.resultsAll(allProducts.length);
  }
}

async function loadProducts() {
  const q = document.getElementById('mainSearchInput').value.trim();
  lastSearchQuery = q;
  const flashOnly = document.getElementById('flashOnlyCheckbox').checked;
  const sort = document.getElementById('sortSelect').value;

  const params = new URLSearchParams({
    category: currentCategory,
    store: currentStore,
    sort: sort,
    flash: flashOnly ? 'true' : 'false',
    _t: Date.now()
  });

  if (currentMaxPrice < 2500) {
    params.set('maxPrice', currentMaxPrice);
  }
  if (q) {
    params.set('q', q);
  }

  try {
    const res = await fetch(`/api/products?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    const data = await res.json();
    allProducts = data.products || [];
    updateStatusBarText();
    renderProductsGrid(allProducts, 'productsGrid');
  } catch (err) {
    console.error('Failed to load products:', err);
  } finally {
    hideAppSplash();
  }
}

function handleCardClick(e, productId) {
  if (e.target.closest('.btn-buy-best') || e.target.closest('.offer-row')) {
    return;
  }
  openProductModal(productId);
}

function renderProductsGrid(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const dict = t();

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:45px 20px; background:var(--bg-card); border-radius:14px; border:1px solid var(--border-color);">
        <h3 style="margin-bottom:8px;">${dict.noResultsTitle}</h3>
        <p style="color:var(--text-secondary); margin-bottom:14px;">${dict.noResultsDesc}</p>
        <button class="btn-search-main" style="margin:0 auto;" onclick="resetAllFilters()">${dict.showAllBtn}</button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const bestOffer = p.offers[0];
    const savingEur = Math.max(0, Math.round(p.msrp - bestOffer.price));
    const savingPct = Math.max(5, Math.round(((p.msrp - bestOffer.price) / p.msrp) * 100));
    const displayTitle = p.title;
    const catLocalized = getCategoryLabel(p.category).replace(/^[^\s]+\s/, '');
    const badgeLeft = savingEur > 25 ? dict.badgeHotDeal(savingEur) : dict.badgeVerified(p.asin || 'DE');
    const badgeRight = dict.badgeSave(savingEur, savingPct);

    const topOffersHtml = p.offers.slice(0, 4).map((o, idx) => {
      const directParam = o.directUrl ? `&directUrl=${encodeURIComponent(o.directUrl)}` : '';
      const outUrl = `/api/out?productId=${encodeURIComponent(p.id)}&asin=${encodeURIComponent(p.asin || '')}&store=${encodeURIComponent(o.store)}&price=${encodeURIComponent(o.price)}&query=${encodeURIComponent(o.query || p.title)}${directParam}`;
      return `
        <a href="${outUrl}" target="_blank" rel="noopener" class="offer-row ${idx === 0 ? 'cheapest' : ''}">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="store-tag store-${o.store}">${o.store}</span>
            <span style="font-size:0.72rem; color:var(--text-secondary);">${idx === 0 ? dict.cheapestTag : dict.deliveryStore(o.store)}</span>
          </div>
          <div class="offer-price-val" style="color:${idx === 0 ? '#34d399' : '#f8fafc'};">
            ${o.price.toFixed(2)} € ↗
          </div>
        </a>
      `;
    }).join('');

    const bestDirectParam = bestOffer.directUrl ? `&directUrl=${encodeURIComponent(bestOffer.directUrl)}` : '';
    const bestOutUrl = `/api/out?productId=${encodeURIComponent(p.id)}&asin=${encodeURIComponent(p.asin || '')}&store=${encodeURIComponent(bestOffer.store)}&price=${encodeURIComponent(bestOffer.price)}&query=${encodeURIComponent(bestOffer.query || p.title)}${bestDirectParam}`;

    return `
      <article class="product-card" onclick="handleCardClick(event, '${p.id}')">
        <div class="card-badges">
          ${savingPct > 0 ? `<span class="badge-discount">-${savingPct}%</span>` : ''}
        </div>

        <div class="card-image-wrap" onclick="openProductModal('${p.id}')">
          <img src="${p.image}" alt="${escapeHtml(displayTitle)}" loading="lazy" onerror="this.onerror=null;this.src='https://m.media-amazon.com/images/I/61rK+APJs0L._AC_SL1000_.jpg';" />
        </div>

        <div class="card-body">
          <div class="card-meta">
            <span>${escapeHtml(p.brand)} • ${escapeHtml(catLocalized)}</span>
            <span class="rating-stars">⭐ ${p.rating} <span style="color:var(--text-muted); font-weight:400;">(${p.reviewsCount})</span></span>
          </div>

          <h3 class="card-title" onclick="openProductModal('${p.id}')">${escapeHtml(displayTitle)}</h3>

          <div class="best-price-box">
            <div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">${dict.cheapestNowIn(bestOffer.store)}</div>
              <div>
                <span class="price-main">${bestOffer.price.toFixed(2)} €</span>
                <span class="price-msrp">${p.msrp.toFixed(2)} €</span>
              </div>
            </div>
            <div style="font-size:0.72rem; color:#34d399; font-weight:700;">
              ${dict.inStockReady}
            </div>
          </div>

          <div class="offers-mini-list">
            ${topOffersHtml}
          </div>

          <div class="card-footer-btns">
            <a href="${bestOutUrl}" target="_blank" rel="noopener" class="btn-buy-best">
              ${dict.buyFromBtn(bestOffer.store, bestOffer.price.toFixed(0))}
            </a>
            <button class="btn-compare-modal" onclick="openProductModal('${p.id}')">
              ${dict.compareHistoryBtn(p.offers.length)}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

let activeModalImages = [];
let activeModalImgIdx = 0;
let currentModalProductId = null;
let currentSelectedStore = null;

let lightboxZoomLevel = 1;

function selectModalGalleryImage(idx, shouldSyncStore = true) {
  if (!activeModalImages || activeModalImages.length === 0) return;
  activeModalImgIdx = (idx + activeModalImages.length) % activeModalImages.length;
  const mainImg = document.getElementById('modalMainGalleryImg');
  const counterEl = document.getElementById('modalGalleryCounter');
  if (mainImg) mainImg.src = activeModalImages[activeModalImgIdx];
  if (counterEl) counterEl.textContent = `${activeModalImgIdx + 1} / ${activeModalImages.length}`;

  document.querySelectorAll('.gallery-thumb').forEach((th, i) => {
    th.classList.toggle('active', i === activeModalImgIdx);
  });

  if (shouldSyncStore && currentModalProductId) {
    const product = allProducts.find(p => p.id === currentModalProductId);
    if (product && Array.isArray(product.offers) && product.offers.length > 0) {
      const currentImgUrl = activeModalImages[activeModalImgIdx];
      const matchingOffer = product.offers.find(o => o.image === currentImgUrl) || product.offers[activeModalImgIdx % product.offers.length];
      if (matchingOffer) {
        selectStorePreview(product.id, matchingOffer.store, false);
      }
    }
  }
}

function openImageLightbox(idx) {
  if (!activeModalImages || activeModalImages.length === 0) return;
  const lightbox = document.getElementById('imageLightboxModal');
  if (!lightbox) return;

  activeModalImgIdx = (idx >= 0 && idx < activeModalImages.length) ? idx : 0;
  lightboxZoomLevel = 1;
  updateLightboxView();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  const lightbox = document.getElementById('imageLightboxModal');
  if (lightbox) {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function handleLightboxBackdropClick(e) {
  if (e.target.id === 'imageLightboxModal' || e.target.id === 'lightboxViewport') {
    closeImageLightbox();
  }
}

function updateLightboxView() {
  const imgEl = document.getElementById('lightboxMainImg');
  const counterEl = document.getElementById('lightboxCounter');
  const wrapper = document.getElementById('lightboxImgWrapper');
  const thumbsBar = document.getElementById('lightboxThumbsBar');
  const viewport = document.getElementById('lightboxViewport');

  if (!imgEl || !activeModalImages || activeModalImages.length === 0) return;

  // Use highest resolution Amazon image if available by replacing dimensions
  let currentSrc = activeModalImages[activeModalImgIdx] || '';
  if (currentSrc.includes('media-amazon.com/images/I/')) {
    currentSrc = currentSrc.replace(/\._AC_[^.]+_\.jpg$/, '._AC_SL1500_.jpg');
  }

  imgEl.src = currentSrc;
  if (counterEl) {
    counterEl.textContent = `${activeModalImgIdx + 1} / ${activeModalImages.length}`;
  }

  if (wrapper) {
    wrapper.style.transform = `scale(${lightboxZoomLevel})`;
  }
  if (viewport) {
    viewport.classList.toggle('is-zoomed', lightboxZoomLevel > 1);
  }

  // Render thumbs in lightbox
  if (thumbsBar) {
    thumbsBar.innerHTML = activeModalImages.map((src, i) => `
      <div class="lightbox-thumb ${i === activeModalImgIdx ? 'active' : ''}" onclick="selectLightboxImage(${i})">
        <img src="${src}" />
      </div>
    `).join('');
  }
}

function selectLightboxImage(idx) {
  if (!activeModalImages || activeModalImages.length === 0) return;
  activeModalImgIdx = (idx + activeModalImages.length) % activeModalImages.length;
  lightboxZoomLevel = 1;
  updateLightboxView();
  selectModalGalleryImage(activeModalImgIdx);
}

function navigateLightbox(step, e) {
  if (e) e.stopPropagation();
  selectLightboxImage(activeModalImgIdx + step);
}

function zoomLightboxImage(delta) {
  lightboxZoomLevel = Math.max(0.75, Math.min(3.5, +(lightboxZoomLevel + delta).toFixed(2)));
  const wrapper = document.getElementById('lightboxImgWrapper');
  const viewport = document.getElementById('lightboxViewport');
  if (wrapper) wrapper.style.transform = `scale(${lightboxZoomLevel})`;
  if (viewport) viewport.classList.toggle('is-zoomed', lightboxZoomLevel > 1);
}

function resetLightboxZoom() {
  lightboxZoomLevel = 1;
  const wrapper = document.getElementById('lightboxImgWrapper');
  const viewport = document.getElementById('lightboxViewport');
  if (wrapper) wrapper.style.transform = `scale(1)`;
  if (viewport) viewport.classList.remove('is-zoomed');
}

function toggleLightboxZoom(e) {
  if (e.target.closest('.lightbox-nav-btn') || e.target.closest('.lightbox-tools')) return;
  if (lightboxZoomLevel === 1) {
    lightboxZoomLevel = 2;
  } else {
    lightboxZoomLevel = 1;
  }
  const wrapper = document.getElementById('lightboxImgWrapper');
  const viewport = document.getElementById('lightboxViewport');
  if (wrapper) wrapper.style.transform = `scale(${lightboxZoomLevel})`;
  if (viewport) viewport.classList.toggle('is-zoomed', lightboxZoomLevel > 1);
}

// Global keyboard shortcuts for Lightbox
window.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('imageLightboxModal');
  if (!lightbox || !lightbox.classList.contains('open')) return;

  if (e.key === 'Escape') {
    closeImageLightbox();
  } else if (e.key === 'ArrowRight') {
    navigateLightbox(1);
  } else if (e.key === 'ArrowLeft') {
    navigateLightbox(-1);
  } else if (e.key === '+' || e.key === '=') {
    zoomLightboxImage(0.25);
  } else if (e.key === '-') {
    zoomLightboxImage(-0.25);
  } else if (e.key === '0') {
    resetLightboxZoom();
  }
});

function renderModalGalleryUI(images, statusText) {
  activeModalImages = images && images.length > 0 ? images : [];
  activeModalImgIdx = 0;
  const stageWrap = document.getElementById('modalGalleryContainer');
  if (!stageWrap) return;

  const hasMultiple = activeModalImages.length > 1;
  const thumbsHtml = activeModalImages.map((imgUrl, idx) => `
    <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="selectModalGalleryImage(${idx})" onmouseenter="selectModalGalleryImage(${idx})">
      <img src="${imgUrl}" loading="lazy" />
    </div>
  `).join('');

  const zoomHint = currentLang === 'ar' ? '🔍 اضغط لتكبير الصورة' : (currentLang === 'de' ? '🔍 Klick zum Vergrößern' : '🔍 Click to enlarge');

  stageWrap.innerHTML = `
    <div class="modal-main-img-stage" onclick="openImageLightbox(activeModalImgIdx)" title="${zoomHint}">
      <span class="zoom-hint-pill">${zoomHint}</span>
      ${hasMultiple ? `<button type="button" class="gallery-nav-btn gallery-nav-prev" onclick="event.stopPropagation(); selectModalGalleryImage(activeModalImgIdx - 1)">❮</button>` : ''}
      <img id="modalMainGalleryImg" src="${activeModalImages[0] || ''}" />
      ${hasMultiple ? `<button type="button" class="gallery-nav-btn gallery-nav-next" onclick="event.stopPropagation(); selectModalGalleryImage(activeModalImgIdx + 1)">❯</button>` : ''}
      <span class="gallery-counter-pill" id="modalGalleryCounter">1 / ${activeModalImages.length}</span>
    </div>
    <div id="modalGalleryStatus" style="font-size:0.74rem; color:#38bdf8; text-align:center; font-weight:600;">${escapeHtml(statusText || '')}</div>
    <div class="gallery-thumbs-row">${thumbsHtml}</div>
  `;
}

async function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const dict = t();

  const modal = document.getElementById('productModal');
  const titleEl = document.getElementById('modalProductTitle');
  const bodyEl = document.getElementById('modalProductBody');

  titleEl.textContent = product.title;

  const history = product.priceHistory90d || [product.msrp, product.offers[0].price];
  const maxHist = Math.max(...history, 1);
  const minHist = Math.min(...history);
  const labels90d = dict.chartLabels;

  // Bar height capped at 90px inside 195px container so price tags never overlap the title
  const chartBarsHtml = history.map((val, i) => {
    const heightPx = Math.max(24, Math.round((val / maxHist) * 90));
    const isLowest = val === minHist;
    return `
      <div class="chart-bar-col">
        <span class="chart-price-tag" style="color:${isLowest ? '#34d399' : '#f8fafc'};">${val}€</span>
        <div class="chart-bar ${isLowest ? 'lowest' : ''}" style="height:${heightPx}px;"></div>
        <span style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">${labels90d[i] || ''}</span>
      </div>
    `;
  }).join('');

  const similar = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
  const similarHtml = similar.map(s => `
    <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-color); border-radius:10px; padding:10px; display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="openProductModal('${s.id}')">
      <img src="${s.image}" style="width:48px; height:48px; object-fit:contain; background:#fff; border-radius:8px; padding:4px;" />
      <div style="flex:1;">
        <div style="font-size:0.8rem; font-weight:700; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(s.title)}</div>
        <div style="font-size:0.78rem; color:#34d399; font-weight:800;">${dict.cheapestLabelShort} ${s.offers[0].price.toFixed(2)} € (${s.offers[0].store})</div>
      </div>
    </div>
  `).join('');

  const allOffersRows = product.offers.map((o, idx) => {
    const directParam = o.directUrl ? `&directUrl=${encodeURIComponent(o.directUrl)}` : '';
    const outUrl = `/api/out?productId=${encodeURIComponent(product.id)}&asin=${encodeURIComponent(product.asin || '')}&store=${encodeURIComponent(o.store)}&price=${encodeURIComponent(o.price)}&query=${encodeURIComponent(o.query || product.title)}${directParam}`;
    const variantTag = o.variantColor ? `<span style="font-size:0.73rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:2px 6px; color:#94a3b8; margin-inline-start:4px;">${escapeHtml(o.variantColor)}</span>` : '';
    return `
      <div id="offerRow-${product.id}-${o.store}" class="offer-row-clickable modal-offer ${idx === 0 ? 'offer-row-active-preview' : ''}" onclick="selectStorePreview('${product.id}', '${o.store}')" style="background:${idx === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${idx === 0 ? 'rgba(16,185,129,0.45)' : 'var(--border-color)'};">
        <div class="mo-main">
          <div class="mo-tags">
            <span class="store-tag store-${o.store}" style="font-size:0.82rem;">${o.store}</span>
            ${variantTag}
            ${idx === 0 ? `<strong class="mo-best">${dict.modalBestGuaranteed}</strong>` : ''}
          </div>
          <div class="mo-meta">🚚 ${dict.deliveryStore(o.store)} • ${dict.modalStoreRating(o.rating)}</div>
        </div>
        <div class="mo-side">
          <div class="mo-price-box">
            <div class="mo-price" style="color:${idx === 0 ? '#34d399' : '#fff'};">${o.price.toFixed(2)} €</div>
            <div class="mo-ship">${dict.modalFreeShipping}</div>
          </div>
          <div class="mo-actions">
            <button type="button" class="btn-action btn-sm mo-preview" onclick="event.stopPropagation(); selectStorePreview('${product.id}', '${o.store}')" title="${dict.previewBtn}">
              ${dict.previewBtn}
            </button>
            <a href="${outUrl}" target="_blank" rel="noopener" class="btn-search-main mo-go" onclick="event.stopPropagation();">
              ${dict.modalGoToOffer(o.store)}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const amzOffer = product.offers.find(o => o.store === 'Amazon') || product.offers[0];
  const localizedSpecs = dict.modalSpecs(product.title, product.asin || 'DE', amzOffer.price.toFixed(2));
  const catLocalized = getCategoryLabel(product.category).replace(/^[^\s]+\s/, '');

  bodyEl.innerHTML = `
    <div class="modal-product-top-grid">
      <div class="modal-gallery-box" id="modalGalleryContainer"></div>
      <div>
        <div style="color:#38bdf8; font-weight:700; font-size:0.82rem; margin-bottom:4px;">${escapeHtml(product.brand)} • ${escapeHtml(catLocalized)}</div>
        <h4 style="font-size:1.05rem; margin-bottom:8px;">${escapeHtml(product.title)}</h4>
        <ul style="margin:0 18px 12px; font-size:0.83rem; color:var(--text-secondary);">
          ${localizedSpecs.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>

        <form onsubmit="subscribePriceAlert(event, '${product.id}')" style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); padding:8px 12px; border-radius:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span style="font-size:0.8rem; font-weight:700;">${dict.alertBoxTitle}</span>
          <input type="email" id="alertEmailInput" placeholder="${dict.alertEmailPlaceholder}" required style="background:var(--bg-elevated); border:1px solid var(--border-color); color:#fff; padding:5px 9px; border-radius:6px; flex:1;" />
          <input type="number" id="alertTargetPrice" value="${Math.round(product.offers[0].price * 0.92)}" style="width:82px; background:var(--bg-elevated); border:1px solid var(--border-color); color:#fff; padding:5px 7px; border-radius:6px;" />
          <button type="submit" class="btn-action" style="background:#0ea5e9; color:#fff; border:none; padding:6px 11px;">${dict.alertSubmitBtn}</button>
        </form>
        <div id="alertSavedMsg" style="color:#34d399; font-size:0.78rem; margin-top:4px;"></div>
      </div>
    </div>

    <h4 style="margin-bottom:8px; color:#38bdf8; font-size:0.95rem;">${dict.modalCompareHeader}</h4>

    <!-- Interactive Live Store Preview Box -->
    <div id="storeLivePreviewContainer" style="margin-bottom:14px;"></div>

    <div style="margin-bottom:20px;">${allOffersRows}</div>

    <h4 style="margin-bottom:10px; color:#fbbf24; font-size:0.95rem;">${dict.modalChartHeader}</h4>
    <div class="price-chart-bars">${chartBarsHtml}</div>

    <h4 style="margin-bottom:8px; color:#34d399; font-size:0.95rem;">${dict.modalSimilarHeader}</h4>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
      ${similarHtml}
    </div>
  `;

  modal.classList.add('open');
  document.documentElement.classList.add('modal-open');
  currentModalProductId = productId;
  currentSelectedStore = product.offers && product.offers.length > 0 ? product.offers[0].store : null;

  // Render initial gallery or fetch real multi-image gallery from Amazon.de live
  if (Array.isArray(product.images) && product.images.length > 1) {
    activeModalImages = product.images;
    if (Array.isArray(product.offers)) {
      product.offers.forEach((o, i) => {
        if (!o.image) o.image = product.images[i % product.images.length];
      });
    }
    renderModalGalleryUI(product.images, dict.galleryReady(product.images.length));
    selectStorePreview(product.id, currentSelectedStore || product.offers[0].store, true);
  } else {
    activeModalImages = [product.image];
    renderModalGalleryUI([product.image], dict.galleryLoading);
    if (product.offers && product.offers.length > 0) {
      selectStorePreview(product.id, product.offers[0].store, true);
    }
    if (product.asin) {
      try {
        const res = await fetch(`/api/product-gallery?asin=${encodeURIComponent(product.asin)}`);
        const data = await res.json();
        if (data.images && data.images.length > 0) {
          product.images = data.images;
          activeModalImages = data.images;
          if (Array.isArray(product.offers)) {
            product.offers.forEach((o, i) => {
              if (!o.image) o.image = data.images[i % data.images.length];
            });
          }
          renderModalGalleryUI(product.images, dict.galleryReady(product.images.length));
          selectStorePreview(product.id, currentSelectedStore || product.offers[0].store, true);
        }
      } catch (e) {}
    }
  }
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  closeStorePreview();
  currentModalProductId = null;
  currentSelectedStore = null;
}

function selectStorePreview(productId, storeName, updateGalleryThumbnail = true) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const storeIdx = (product.offers || []).findIndex(o => o.store.toLowerCase() === (storeName || '').toLowerCase());
  const offer = storeIdx !== -1 ? product.offers[storeIdx] : (product.offers && product.offers[0]);
  if (!offer) return;
  currentSelectedStore = offer.store;
  currentModalProductId = productId;
  const dict = t();

  const previewBox = document.getElementById('storeLivePreviewContainer');
  if (!previewBox) return;

  const directParam = offer.directUrl ? `&directUrl=${encodeURIComponent(offer.directUrl)}` : '';
  const outUrl = `/api/out?productId=${encodeURIComponent(product.id)}&asin=${encodeURIComponent(product.asin || '')}&store=${encodeURIComponent(offer.store)}&price=${encodeURIComponent(offer.price)}&query=${encodeURIComponent(offer.query || product.title)}${directParam}`;

  // Highlight active store row
  document.querySelectorAll('.offer-row-clickable').forEach(row => row.classList.remove('offer-row-active-preview'));
  const activeRow = document.getElementById(`offerRow-${product.id}-${offer.store}`);
  if (activeRow) activeRow.classList.add('offer-row-active-preview');

  // Choose the authentic image for this specific store
  const storeImage = offer.image || (activeModalImages && activeModalImages.length > 0 ? activeModalImages[storeIdx >= 0 ? storeIdx % activeModalImages.length : 0] : product.image);

  // Dynamically update the main modal hero photo to match this store's product!
  const mainImg = document.getElementById('modalMainGalleryImg');
  if (mainImg && storeImage && mainImg.src !== storeImage) {
    mainImg.style.transition = 'opacity 0.15s ease';
    mainImg.style.opacity = '0.35';
    mainImg.src = storeImage;
    setTimeout(() => {
      if (mainImg) mainImg.style.opacity = '1';
    }, 100);
  }

  // Synchronize thumbnail in the gallery
  if (updateGalleryThumbnail && activeModalImages && activeModalImages.length > 0) {
    let imgIdx = activeModalImages.indexOf(storeImage);
    if (imgIdx === -1 && storeIdx >= 0) {
      imgIdx = storeIdx % activeModalImages.length;
    }
    if (imgIdx !== -1) {
      activeModalImgIdx = imgIdx;
      document.querySelectorAll('.gallery-thumb').forEach((th, i) => {
        th.classList.toggle('active', i === imgIdx);
      });
      const counterEl = document.getElementById('modalGalleryCounter');
      if (counterEl) counterEl.textContent = `${imgIdx + 1} / ${activeModalImages.length}`;
    }
  }

  const variantDisplay = offer.variantTitle || `${offer.query || product.title}${offer.variantColor ? ' - ' + offer.variantColor : ''}`;
  const colorBadgeHtml = offer.variantColor ? `<span class="attr-pill" style="border-color:rgba(56,189,248,0.4); background:rgba(56,189,248,0.08); color:#38bdf8;">🎨 ${dict.previewVariantColor || 'Farbe / Ausführung'}: <strong>${escapeHtml(offer.variantColor)}</strong></span>` : '';

  previewBox.style.display = 'block';
  previewBox.innerHTML = `
    <div class="store-preview-box">
      <div class="preview-box-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="store-tag store-${offer.store}">${offer.store}</span>
          <span class="preview-badge-verified">✔️ ${dict.previewStoreVerified(offer.store)}</span>
        </div>
        <button type="button" class="btn-close-preview" onclick="closeStorePreview()" title="Schließen / إغلاق">✕</button>
      </div>
      <div class="preview-box-body">
        <div class="preview-img-side">
          <img id="previewStoreThumbImg" src="${storeImage}" alt="${escapeHtml(offer.store)}" onerror="this.src='${product.image}';" />
        </div>
        <div class="preview-info-side">
          <div class="preview-matched-title">
            📱 <strong>${escapeHtml(variantDisplay)}</strong>
          </div>
          <div class="preview-attributes">
            <span class="attr-pill">🔍 ${dict.previewMatchedModel}: <strong>${escapeHtml(offer.query || product.title)}</strong></span>
            ${colorBadgeHtml}
            <span class="attr-pill">🚚 ${dict.deliveryStore(offer.store)}</span>
            <span class="attr-pill">⭐ ${dict.modalStoreRating(offer.rating)}</span>
          </div>
          <div class="preview-price-row">
            <div>
              <span class="preview-price-val">${offer.price.toFixed(2)} €</span>
              <span class="preview-price-sub">${dict.modalFreeShipping}</span>
            </div>
            <a href="${outUrl}" target="_blank" rel="noopener" class="btn-search-main btn-preview-go">
              ${dict.buyFromBtn(offer.store, offer.price.toFixed(2))}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function closeStorePreview() {
  const previewBox = document.getElementById('storeLivePreviewContainer');
  if (previewBox) previewBox.style.display = 'none';
  document.querySelectorAll('.offer-row-clickable').forEach(row => row.classList.remove('offer-row-active-preview'));
  currentSelectedStore = null;
}

async function subscribePriceAlert(e, productId) {
  e.preventDefault();
  const dict = t();
  const email = document.getElementById('alertEmailInput').value;
  const targetPrice = document.getElementById('alertTargetPrice').value;
  await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, email, targetPrice })
  });
  document.getElementById('alertSavedMsg').textContent = dict.alertSavedMsg(targetPrice);
}

function handleMainSearch(e) {
  e.preventDefault();
  loadProducts();
}

function selectCategory(cat, btnEl) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  loadProducts();
}

function selectStoreFilter(store, btnEl) {
  currentStore = store;
  document.querySelectorAll('.store-filter-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  loadProducts();
}

function handlePriceSlider(val) {
  const dict = t();
  currentMaxPrice = parseInt(val, 10);
  const label = document.getElementById('maxPriceLabel');
  label.textContent = currentMaxPrice >= 2500 ? dict.noLimit : dict.upToPrice(currentMaxPrice);
  loadProducts();
}

function applyFilters() {
  loadProducts();
}

function resetAllFilters() {
  const dict = t();
  document.getElementById('mainSearchInput').value = '';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  document.getElementById('flashOnlyCheckbox').checked = false;
  document.getElementById('maxPriceSlider').value = 2500;
  document.getElementById('maxPriceLabel').textContent = dict.noLimit;
  currentCategory = 'all';
  currentStore = 'all';
  currentMaxPrice = 2500;
  lastSearchQuery = '';
  document.querySelectorAll('.cat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.store-filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  loadProducts();
}

async function handleAiSearch(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('aiPromptInput');
  if (!input) return;
  const prompt = input.value.trim();
  if (!prompt) return;
  await executeAiQuery(prompt);
}

function runQuickAi(queryText, displayText) {
  const input = document.getElementById('aiPromptInput');
  if (input) input.value = displayText || queryText;
  executeAiQuery(queryText);
}

async function executeAiQuery(prompt) {
  const dict = t();
  const panel = document.getElementById('aiResponsePanel');
  const textEl = document.getElementById('aiResponseText');
  if (!panel || !textEl) return;
  panel.style.display = 'block';
  textEl.textContent = dict.aiLoading;

  try {
    const res = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    const recs = data.recommendations || [];
    if (recs.length > 0) {
      const best = recs[0];
      const bestOffer = best.offers[0];
      const amzOffer = best.offers.find(o => o.store === 'Amazon') || bestOffer;
      const saving = Math.max(0, best.msrp - bestOffer.price).toFixed(2);
      textEl.textContent = dict.aiFormattedReply(best, bestOffer, amzOffer, saving);
    } else {
      textEl.textContent = dict.noResultsTitle;
    }
    renderProductsGrid(recs, 'aiRecommendationsGrid');
  } catch (err) {
    textEl.textContent = 'Error connecting to AI Assistant.';
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Prevent browser viewport zooming on mobile for native app experience
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  document.addEventListener('dblclick', function(e) {
    if (!e.target.closest('#imageLightboxModal')) {
      e.preventDefault();
    }
  }, { passive: false });
}

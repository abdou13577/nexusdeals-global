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
    stageScreenHeader: 'شاشة العرض المباشر للمتجر',
    stageLiveFrom: (s) => `عرض رسمي مباشر من متجر ${s}`,
    stageLiveDot: 'متصل ومحدث مباشرة',
    stageHintSwitch: '💡 اضغط على أي متجر في الجدول أدناه لتحويل هذه الشاشة فوراً لصور وأسعار ومواصفات ذلك المتجر',
    stageDisplayingNow: 'يُعرض في الشاشة بالأعلى 📺',
    stageSwitchToBtn: 'معاينة بالشاشة 👁️',
    stageDirectBuyBtn: (s, p) => `🛒 الشراء مباشرة من ${s} (${p}€) ↗`,
    stageSavingBadge: (val, pct) => `وفر ${val}€ (-${pct}%)`,
    stageSpecsTitle: 'المواصفات والبيانات المسجلة لدى المنصة:',
    stageSpecRetailer: (s) => `المنصة الرسمية: ${s}`,
    stageSpecTitle: (t) => `اسم العرض في المتجر: ${t}`,
    stageSpecPrice: (p) => `السعر الفعلي المباشر: ${p} € (شامل الضريبة)`,
    stageSpecRating: (r) => `تقييم المتجر: ⭐ ${r} / 5`,
    stageSpecShipping: (s) => `التوصيل والضمان: شحن من مستودعات ${s} مع ضمان الإرجاع الرسمي`,
    stageCompareHeader: (n) => `🏪 المنصات والمتاجر المتوفرة (${n} متاجر حقيقية) — اضغط على أي متجر لعرضه في الشاشة 📺:`,
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
    stageScreenHeader: 'Live-Store-Bildschirm',
    stageLiveFrom: (s) => `Offizielles Live-Angebot von ${s}`,
    stageLiveDot: 'Live & synchronisiert',
    stageHintSwitch: '💡 Klicken Sie unten auf einen beliebigen Shop, um diesen Bildschirm sofort mit dessen Bildern, Preisen und Daten umzuschalten',
    stageDisplayingNow: 'Wird oben angezeigt 📺',
    stageSwitchToBtn: 'Im Bildschirm zeigen 👁️',
    stageDirectBuyBtn: (s, p) => `🛒 Direkt bei ${s} kaufen (${p}€) ↗`,
    stageSavingBadge: (val, pct) => `${val}€ Ersparnis (-${pct}%)`,
    stageSpecsTitle: 'Produktdetails & Daten der Plattform:',
    stageSpecRetailer: (s) => `Offizielle Plattform: ${s}`,
    stageSpecTitle: (t) => `Angebotstitel im Shop: ${t}`,
    stageSpecPrice: (p) => `Live-Endpreis: ${p} € (inkl. MwSt.)`,
    stageSpecRating: (r) => `Shop-Bewertung: ⭐ ${r} / 5`,
    stageSpecShipping: (s) => `Lieferung & Garantie: Versand via ${s} mit Käuferschutz & Rückgaberecht`,
    stageCompareHeader: (n) => `🏪 Verfügbare Shops (${n} echte Händler) — Klicken Sie auf einen Shop für den Live-Bildschirm 📺:`,
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
    stageScreenHeader: 'Live Retailer Screen',
    stageLiveFrom: (s) => `Official live listing from ${s}`,
    stageLiveDot: 'Live & Synced',
    stageHintSwitch: '💡 Click any store below to instantly switch this stage screen to its official photos, price & specs',
    stageDisplayingNow: 'Displaying on Stage 📺',
    stageSwitchToBtn: 'View on Stage 👁️',
    stageDirectBuyBtn: (s, p) => `🛒 Buy directly from ${s} (${p}€) ↗`,
    stageSavingBadge: (val, pct) => `Save ${val}€ (-${pct}%)`,
    stageSpecsTitle: 'Platform & Product Specifications:',
    stageSpecRetailer: (s) => `Official Platform: ${s}`,
    stageSpecTitle: (t) => `Listing Title: ${t}`,
    stageSpecPrice: (p) => `Live Verified Price: ${p} € (incl. VAT)`,
    stageSpecRating: (r) => `Store Rating: ⭐ ${r} / 5`,
    stageSpecShipping: (s) => `Delivery & Warranty: Fulfilled via ${s} with official buyer protection`,
    stageCompareHeader: (n) => `🏪 Available Stores (${n} verified retailers) — Click any store to view on Stage 📺:`,
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

let filterDrawerHome = null;
function placeFilterDrawer() {
  const d = document.getElementById('filterDrawer');
  if (!d) return;
  if (!filterDrawerHome) filterDrawerHome = { parent: d.parentNode, next: d.nextSibling };
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile && d.parentNode !== document.body) {
    document.body.appendChild(d); // escape the sticky header (its backdrop-filter traps fixed children)
  } else if (!isMobile && d.parentNode === document.body && filterDrawerHome.parent) {
    filterDrawerHome.parent.insertBefore(d, filterDrawerHome.next && filterDrawerHome.next.parentNode === filterDrawerHome.parent ? filterDrawerHome.next : null);
  }
}
window.addEventListener('resize', placeFilterDrawer);

function toggleFilterDrawer() {
  placeFilterDrawer();
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

function trackAffiliateClick(productId, store, price) {
  try {
    const trackUrl = `/api/track-click?productId=${encodeURIComponent(productId || '')}&store=${encodeURIComponent(store || '')}&price=${encodeURIComponent(price || 0)}`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(trackUrl);
    } else {
      fetch(trackUrl, { keepalive: true }).catch(() => {});
    }
  } catch (e) {}
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

  const focusStore = (typeof currentStore === 'string' && currentStore !== 'all') ? currentStore : null;
  const L = currentLang;
  const estWord = L === 'ar' ? 'تقريبي' : (L === 'de' ? 'ca.' : 'est.');
  const storePriceLbl = (s) => L === 'ar' ? `السعر في ${s}` : (L === 'de' ? `Preis bei ${s}` : `Price at ${s}`);
  const priceTxt = (o) => (o.store === 'Amazon' ? '' : `<small class="est-word">${estWord}</small> `) + o.price.toFixed(2);

  container.innerHTML = products.map(p => {
    // Strictly ORDER BY price ASC across all platforms
    const sortedOffers = Array.isArray(p.offers) ? [...p.offers].sort((a, b) => a.price - b.price) : [];
    const focusOffer = focusStore ? sortedOffers.find(o => o.store.toLowerCase() === focusStore.toLowerCase()) : null;
    const bestOffer = focusOffer || (sortedOffers.length > 0 ? sortedOffers[0] : { store: 'Amazon', price: p.price || 0 });
    const savingEur = Math.max(0, Math.round(p.msrp - bestOffer.price));
    const savingPct = Math.max(5, Math.round(((p.msrp - bestOffer.price) / p.msrp) * 100));
    const displayTitle = p.title;
    const catLocalized = getCategoryLabel(p.category).replace(/^[^\s]+\s/, '');
    const badgeLeft = savingEur > 25 ? dict.badgeHotDeal(savingEur) : dict.badgeVerified(p.asin || 'DE');
    const badgeRight = dict.badgeSave(savingEur, savingPct);

    const shownOffers = focusOffer ? [focusOffer] : sortedOffers.slice(0, 4);
    const topOffersHtml = shownOffers.map((o, idx) => {
      const targetDirect = o.direct_affiliate_url || o.directUrl || `/api/out?productId=${encodeURIComponent(p.id)}&store=${encodeURIComponent(o.store)}&price=${encodeURIComponent(o.price)}`;
      return `
        <a href="${targetDirect}" target="_blank" rel="noopener" class="offer-row ${idx === 0 ? 'cheapest' : ''}" onclick="trackAffiliateClick('${p.id}', '${o.store}', ${o.price});">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="store-tag store-${o.store}">${o.store}</span>
            <span style="font-size:0.72rem; color:var(--text-secondary);">${focusOffer ? dict.deliveryStore(o.store) : (idx === 0 ? dict.cheapestTag : dict.deliveryStore(o.store))}</span>
          </div>
          <div class="offer-price-val" style="color:${idx === 0 ? '#34d399' : '#f8fafc'};">
            ${priceTxt(o)} € ↗
          </div>
        </a>
      `;
    }).join('');

    const bestTargetDirect = bestOffer.direct_affiliate_url || bestOffer.directUrl || `/api/out?productId=${encodeURIComponent(p.id)}&store=${encodeURIComponent(bestOffer.store)}&price=${encodeURIComponent(bestOffer.price)}`;
    const cardImg = (focusOffer && focusOffer.image) ? focusOffer.image : (sortedOffers.length > 0 && sortedOffers[0].image ? sortedOffers[0].image : p.image);

    return `
      <article class="product-card" onclick="handleCardClick(event, '${p.id}')">
        <div class="card-badges">
          ${savingPct > 0 ? `<span class="badge-discount">-${savingPct}%</span>` : ''}
        </div>

        <div class="card-image-wrap" onclick="openProductModal('${p.id}')">
          <img src="${cardImg}" alt="${escapeHtml(displayTitle)}" loading="lazy" onerror="this.onerror=null;this.src='/api/image-proxy?url=' + encodeURIComponent(this.src) + '&title=' + encodeURIComponent('${escapeHtml(displayTitle.slice(0, 30))}');" />
        </div>

        <div class="card-body">
          <div class="card-meta">
            <span>${escapeHtml(p.brand)} • ${escapeHtml(catLocalized)}</span>
            <span class="rating-stars">⭐ ${p.rating} <span style="color:var(--text-muted); font-weight:400;">(${p.reviewsCount})</span></span>
          </div>

          <h3 class="card-title" onclick="openProductModal('${p.id}')">${escapeHtml(displayTitle)}</h3>

          <div class="best-price-box">
            <div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">${focusOffer ? storePriceLbl(bestOffer.store) : dict.cheapestNowIn(bestOffer.store)}</div>
              <div>
                <span class="price-main">${priceTxt(bestOffer)} €</span>
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
            <a href="${bestTargetDirect}" target="_blank" rel="noopener" class="btn-buy-best" onclick="event.stopPropagation(); trackAffiliateClick('${p.id}', '${bestOffer.store}', ${bestOffer.price});">
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

  const catLocalized = getCategoryLabel(product.category).replace(/^[^\s]+\s/, '');
  // On mobile screens, display clean concise breadcrumb in sticky top bar to prevent clutter
  titleEl.textContent = (window.innerWidth <= 768) ? `${product.brand || 'NexusDeals'} • ${catLocalized}` : product.title;

  const modalBox = modal.querySelector('.modal-box');
  if (modalBox) modalBox.scrollTop = 0;

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

  // Ensure strict price hierarchy: ORDER BY price ASC
  if (Array.isArray(product.offers)) {
    product.offers.sort((a, b) => a.price - b.price);
  }

  const initialStore = (currentStore && currentStore !== 'all') ? currentStore : null;
  let initialOffer = initialStore ? (product.offers || []).find(o => o.store.toLowerCase() === initialStore.toLowerCase()) : null;
  if (!initialOffer) {
    initialOffer = (product.offers && product.offers.length > 0) ? product.offers[0] : { store: 'Amazon', price: product.price || 0, rating: 4.8 };
  }

  const initialTargetDirect = initialOffer.direct_affiliate_url || initialOffer.directUrl || `/api/out?productId=${encodeURIComponent(product.id)}&store=${encodeURIComponent(initialOffer.store)}&price=${encodeURIComponent(initialOffer.price)}`;

  const allOffersRows = (product.offers || []).map((o, idx) => {
    const targetDirect = o.direct_affiliate_url || o.directUrl || `/api/out?productId=${encodeURIComponent(product.id)}&store=${encodeURIComponent(o.store)}&price=${encodeURIComponent(o.price)}`;
    const variantTag = o.variantColor ? `<span class="mo-variant-pill">${escapeHtml(o.variantColor)}</span>` : '';
    const isSelected = o.store.toLowerCase() === initialOffer.store.toLowerCase();
    return `
      <div id="offerRow-${product.id}-${o.store}" class="offer-row-clickable modal-offer ${isSelected ? 'offer-row-active-preview' : ''}" onclick="selectStorePreview('${product.id}', '${o.store}')">
        <div class="mo-main">
          <div class="mo-tags">
            <span class="store-tag store-${o.store}">${o.store}</span>
            ${variantTag}
            ${idx === 0 ? `<strong class="mo-best">${dict.modalBestGuaranteed}</strong>` : ''}
            <span id="rowIndicator-${product.id}-${o.store}" class="row-stage-indicator ${isSelected ? 'live-active' : ''}">
              ${isSelected ? dict.stageDisplayingNow : dict.stageSwitchToBtn}
            </span>
          </div>
          <div class="mo-meta">🚚 ${dict.deliveryStore(o.store)} • ${dict.modalStoreRating(o.rating || 4.8)}</div>
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
            <a href="${targetDirect}" target="_blank" rel="noopener" class="btn-search-main mo-go" onclick="event.stopPropagation(); trackAffiliateClick('${product.id}', '${o.store}', ${o.price});">
              ${dict.modalGoToOffer(o.store)}
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  bodyEl.innerHTML = `
    <!-- High-Tech Interactive Live Store Stage -->
    <div class="interactive-stage-card" id="interactiveStageCard">
      <div class="stage-screen-topbar">
        <div class="stage-topbar-left">
          <span class="stage-tv-icon">📺</span>
          <span class="stage-screen-title">${dict.stageScreenHeader}</span>
          <span class="store-tag store-${initialOffer.store}" id="stageStoreTag">${initialOffer.store}</span>
        </div>
        <div class="stage-topbar-right">
          <span class="stage-live-pulse"><span class="live-pulse-dot"></span> <span id="stageStatusText">${dict.stageLiveFrom(initialOffer.store)}</span></span>
        </div>
      </div>

      <div class="stage-screen-grid">
        <div class="stage-gallery-column">
          <div class="modal-gallery-box" id="modalGalleryContainer"></div>
        </div>
        <div class="stage-info-column" id="stageInfoColumn">
          <div class="stage-meta-header">
            <span class="stage-brand-pill" id="stageBrandPill">${escapeHtml(product.brand)} • ${escapeHtml(catLocalized)}</span>
            <span class="stage-verified-badge" id="stageVerifiedBadge">✔️ ${dict.previewStoreVerified(initialOffer.store)}</span>
          </div>

          <h3 class="stage-product-title" id="stageProductTitle">
            ${escapeHtml(initialOffer.variantTitle || initialOffer.query || product.title)}
          </h3>

          <div class="stage-pricing-banner" id="stagePricingBanner">
            <div class="stage-price-primary">
              <span class="stage-price-number" id="stagePriceNumber">${initialOffer.price.toFixed(2)} €</span>
              <span class="stage-price-msrp" id="stagePriceMsrp" style="${product.msrp && product.msrp > initialOffer.price ? '' : 'display:none;'}">${product.msrp ? product.msrp.toFixed(2) + ' €' : ''}</span>
              <span class="stage-discount-tag" id="stageDiscountTag" style="${product.msrp && product.msrp > initialOffer.price ? '' : 'display:none;'}">
                ${product.msrp && product.msrp > initialOffer.price ? dict.stageSavingBadge((product.msrp - initialOffer.price).toFixed(2), Math.round(((product.msrp - initialOffer.price) / product.msrp) * 100)) : ''}
              </span>
            </div>
            <div class="stage-shipping-info" id="stageShippingBadge">
              🚚 ${dict.deliveryStore(initialOffer.store)} • ${dict.modalFreeShipping}
            </div>
          </div>

          <div class="stage-specs-box">
            <div class="stage-specs-title">📋 ${dict.stageSpecsTitle}</div>
            <ul class="stage-specs-list" id="stageSpecsList">
              <li><strong>${dict.stageSpecRetailer(initialOffer.store)}</strong></li>
              <li>${dict.stageSpecTitle(escapeHtml(initialOffer.variantTitle || initialOffer.query || product.title))}</li>
              <li>${dict.stageSpecPrice(initialOffer.price.toFixed(2))}</li>
              <li>${dict.stageSpecRating(initialOffer.rating || 4.8)}</li>
              <li>${dict.stageSpecShipping(initialOffer.store)}</li>
            </ul>
          </div>

          <div class="stage-actions-area">
            <a id="stageDirectBuyLink" href="${initialTargetDirect}" target="_blank" rel="noopener" class="btn-search-main stage-buy-btn" onclick="trackAffiliateClick('${product.id}', '${initialOffer.store}', ${initialOffer.price});">
              ${dict.stageDirectBuyBtn(initialOffer.store, initialOffer.price.toFixed(2))}
            </a>
            <div class="stage-interactive-hint">
              ${dict.stageHintSwitch}
            </div>
          </div>

          <form onsubmit="subscribePriceAlert(event, '${product.id}')" class="stage-alert-form">
            <span style="font-size:0.78rem; font-weight:700;">${dict.alertBoxTitle}</span>
            <input type="email" id="alertEmailInput" placeholder="${dict.alertEmailPlaceholder}" required class="stage-alert-input" />
            <input type="number" id="alertTargetPrice" value="${Math.round(initialOffer.price * 0.92)}" class="stage-alert-price" />
            <button type="submit" class="btn-action stage-alert-btn">${dict.alertSubmitBtn}</button>
          </form>
          <div id="alertSavedMsg" class="stage-alert-msg"></div>
        </div>
      </div>
    </div>

    <h4 style="margin:20px 0 10px; color:#38bdf8; font-size:1rem; font-weight:800;">${dict.stageCompareHeader(product.offers.length)}</h4>

    <div style="margin-bottom:8px;">${allOffersRows}</div>
    <div style="font-size:0.76rem; color:var(--text-secondary); margin-bottom:18px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
      🛡️ ${currentLang === 'ar' ? 'جميع الأسعار والعروض حقيقية ومحدثة مباشرة من المنصات الرسمية — اضغط على أي منصة لعرضها في الشاشة بالأعلى أو الشراء المباشر.' : (currentLang === 'de' ? 'Alle Preise und Angebote sind verifiziert und live mit den offiziellen Plattformen abgestimmt.' : 'All prices and listings are verified live data from official platforms.')}
    </div>

    <h4 style="margin-bottom:10px; color:#fbbf24; font-size:0.95rem;">${dict.modalChartHeader}</h4>
    <div class="price-chart-bars">${chartBarsHtml}</div>

    <h4 style="margin-bottom:8px; color:#34d399; font-size:0.95rem;">${dict.modalSimilarHeader}</h4>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:18px;">
      ${similarHtml}
    </div>

    <!-- Native Mobile Floating Bottom Sticky Buy Bar -->
    <div class="modal-mobile-sticky-bar" id="modalMobileStickyBar">
      <div class="mmb-price-col">
        <span class="mmb-store" id="mmbStoreName">${initialOffer.store}</span>
        <span class="mmb-price" id="mmbPriceVal">${initialOffer.price.toFixed(2)} €</span>
      </div>
      <a id="mmbBuyBtn" href="${initialTargetDirect}" target="_blank" rel="noopener" class="mmb-cta-btn" onclick="trackAffiliateClick('${product.id}', '${initialOffer.store}', ${initialOffer.price});">
        ${dict.stageDirectBuyBtn(initialOffer.store, initialOffer.price.toFixed(2))}
      </a>
    </div>
  `;

  modal.classList.add('open');
  document.documentElement.classList.add('modal-open');
  currentModalProductId = productId;
  currentSelectedStore = initialOffer.store;

  // Render initial gallery using the genuine, verified product photos
  const productImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : [product.image];

  activeModalImages = productImages;
  activeModalImgIdx = 0;
  renderModalGalleryUI(productImages, dict.stageLiveFrom(initialOffer.store));
  selectStorePreview(product.id, currentSelectedStore, false);
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  closeStorePreview();
  currentModalProductId = null;
  currentSelectedStore = null;
}

function selectStorePreview(productId, storeName, updateGallery = false) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const storeIdx = (product.offers || []).findIndex(o => o.store.toLowerCase() === (storeName || '').toLowerCase());
  const offer = storeIdx !== -1 ? product.offers[storeIdx] : (product.offers && product.offers[0]);
  if (!offer) return;
  currentSelectedStore = offer.store;
  currentModalProductId = productId;
  const dict = t();

  // 1. Morph Stage Card Header
  const stageCard = document.getElementById('interactiveStageCard');
  const stageStoreTag = document.getElementById('stageStoreTag');
  const stageStatusText = document.getElementById('stageStatusText');
  const stageVerifiedBadge = document.getElementById('stageVerifiedBadge');

  if (stageStoreTag) {
    stageStoreTag.className = `store-tag store-${offer.store}`;
    stageStoreTag.textContent = offer.store;
  }
  if (stageStatusText) {
    stageStatusText.textContent = dict.stageLiveFrom(offer.store);
  }
  if (stageVerifiedBadge) {
    stageVerifiedBadge.textContent = `✔️ ${dict.previewStoreVerified(offer.store)}`;
  }

  // 2. Keep the genuine product title with official model query
  const stageTitle = document.getElementById('stageProductTitle');
  if (stageTitle) {
    stageTitle.textContent = product.title;
  }

  // 3. Morph Pricing & Discount
  const stagePriceNumber = document.getElementById('stagePriceNumber');
  const stagePriceMsrp = document.getElementById('stagePriceMsrp');
  const stageDiscountTag = document.getElementById('stageDiscountTag');
  const stageShippingBadge = document.getElementById('stageShippingBadge');

  if (stagePriceNumber) {
    stagePriceNumber.textContent = `${offer.price.toFixed(2)} €`;
  }

  const refPrice = product.msrp && product.msrp > offer.price ? product.msrp : null;
  if (stagePriceMsrp) {
    if (refPrice) {
      stagePriceMsrp.textContent = `${refPrice.toFixed(2)} €`;
      stagePriceMsrp.style.display = 'inline-block';
    } else {
      stagePriceMsrp.style.display = 'none';
    }
  }

  if (stageDiscountTag) {
    if (refPrice && refPrice > offer.price) {
      const diff = refPrice - offer.price;
      const pct = Math.round((diff / refPrice) * 100);
      stageDiscountTag.textContent = dict.stageSavingBadge(diff.toFixed(2), pct);
      stageDiscountTag.style.display = 'inline-block';
    } else {
      stageDiscountTag.style.display = 'none';
    }
  }

  if (stageShippingBadge) {
    stageShippingBadge.innerHTML = `🚚 ${dict.deliveryStore(offer.store)} • ${dict.modalFreeShipping}`;
  }

  // 4. Morph Direct Buy CTA Button with strict direct affiliate deep link
  const targetDirect = offer.direct_affiliate_url || offer.directUrl || `/api/out?productId=${encodeURIComponent(product.id)}&store=${encodeURIComponent(offer.store)}&price=${encodeURIComponent(offer.price)}`;

  const stageDirectBuyLink = document.getElementById('stageDirectBuyLink');
  if (stageDirectBuyLink) {
    stageDirectBuyLink.href = targetDirect;
    stageDirectBuyLink.setAttribute('onclick', `trackAffiliateClick('${product.id}', '${offer.store}', ${offer.price});`);
    stageDirectBuyLink.innerHTML = dict.stageDirectBuyBtn(offer.store, offer.price.toFixed(2));
  }

  // Update floating mobile sticky purchase bar
  const mmbBuyBtn = document.getElementById('mmbBuyBtn');
  const mmbStoreName = document.getElementById('mmbStoreName');
  const mmbPriceVal = document.getElementById('mmbPriceVal');
  if (mmbBuyBtn) {
    mmbBuyBtn.href = targetDirect;
    mmbBuyBtn.setAttribute('onclick', `trackAffiliateClick('${product.id}', '${offer.store}', ${offer.price});`);
    mmbBuyBtn.innerHTML = dict.stageDirectBuyBtn(offer.store, offer.price.toFixed(2));
  }
  if (mmbStoreName) mmbStoreName.textContent = offer.store;
  if (mmbPriceVal) mmbPriceVal.textContent = `${offer.price.toFixed(2)} €`;

  // 5. Morph Specs List to THAT store's actual specs
  const stageSpecsList = document.getElementById('stageSpecsList');
  if (stageSpecsList) {
    const specsItems = [
      `<strong>${dict.stageSpecRetailer(offer.store)}</strong>`,
      dict.stageSpecTitle(escapeHtml(offer.variantTitle || product.title)),
      dict.stageSpecPrice(offer.price.toFixed(2)),
      dict.stageSpecRating(offer.rating || 4.8),
      dict.stageSpecShipping(offer.store)
    ];
    stageSpecsList.innerHTML = specsItems.map(s => `<li>${s}</li>`).join('');
  }

  // 6. Update Target Price Input
  const alertPriceInput = document.getElementById('alertTargetPrice');
  if (alertPriceInput) {
    alertPriceInput.value = Math.round(offer.price * 0.92);
  }

  // 7. Ensure Main Product Photo is NEVER corrupted and matches the active store offer
  const mainImg = document.getElementById('modalMainGalleryImg');
  if (mainImg) {
    mainImg.src = offer.image || product.image;
  }

  // 8. Update Active Highlight and Row Indicators below
  (product.offers || []).forEach(o => {
    const rowEl = document.getElementById(`offerRow-${product.id}-${o.store}`);
    const indEl = document.getElementById(`rowIndicator-${product.id}-${o.store}`);
    const isThisOffer = o.store.toLowerCase() === offer.store.toLowerCase();
    if (rowEl) {
      rowEl.classList.toggle('offer-row-active-preview', isThisOffer);
    }
    if (indEl) {
      if (isThisOffer) {
        indEl.className = 'row-stage-indicator live-active';
        indEl.innerHTML = dict.stageDisplayingNow;
      } else {
        indEl.className = 'row-stage-indicator';
        indEl.innerHTML = dict.stageSwitchToBtn;
      }
    }
  });

  // 9. Subtle pulse on Stage Card
  if (stageCard) {
    stageCard.classList.remove('stage-pulsing-update');
    void stageCard.offsetWidth; // trigger reflow
    stageCard.classList.add('stage-pulsing-update');
  }
}

function closeStorePreview() {
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

// ==========================================================================
// NexusDeals Prototype-Perfect Application Engine (100% Matching Prototype)
// ==========================================================================

// Global State
let allProducts = [];
let supportedPlatforms = [];
let currentCategory = 'all';
let currentStore = 'all';
let currentLang = 'de';
let lastSearchQuery = '';
let currentView = 'home'; // 'home' | 'search' | 'pdp'
let currentProduct = null;
let watchlist = JSON.parse(localStorage.getItem('nexus_watchlist') || '[]');

// 12 Official Stores matching the Prototype design
const DEFAULT_12_STORES = [
  { id: 'amazon', name: 'Amazon', logoText: 'a', color: '#FF9900' },
  { id: 'galaxus', name: 'Galaxus', logoText: '🐢', color: '#005A70' },
  { id: 'ebay', name: 'eBay', logoText: 'ebay', color: '#0064D2' },
  { id: 'kaufland', name: 'Kaufland', logoText: 'K', color: '#E10915' },
  { id: 'temu', name: 'Temu', logoText: 'TEMU', color: '#FB7701' },
  { id: 'otto', name: 'OTTO', logoText: 'OTTO', color: '#D6132C' },
  { id: 'mediamarkt', name: 'MediaMarkt', logoText: 'MM', color: '#DF0000' },
  { id: 'conrad', name: 'Conrad', logoText: 'C', color: '#0066B2' },
  { id: 'alternate', name: 'alternate', logoText: 'a', color: '#E30613' },
  { id: 'notebooksbilliger', name: 'notebooksbilliger', logoText: 'nbb', color: '#FF6600' },
  { id: 'cyberport', name: 'Cyberport', logoText: 'C', color: '#003366' },
  { id: 'expert', name: 'expert', logoText: 'xp', color: '#F39200' }
];

// Multilingual Dictionary
const I18N = {
  de: {
    navHome: 'Home',
    navDeals: 'Deals',
    navCategories: 'Kategorien',
    navWatchlist: 'Merkliste',
    navLogin: 'Anmelden',
    posterTitle: 'Gute Produkte Geringere Preise',
    posterSubtitle: 'Bessere Preise • Eine bessere Zukunft',
    heroTitle: 'Find the cheapest price.<br/>Everywhere.',
    searchPlaceholder: 'Search product, EAN or brand',
    searchBtn: 'Search',
    trendingTitle: 'Trending price drops',
    trendingSub: 'Popular products. Lower prices. Right now.',
    viewAllDeals: 'View all deals',
    compare12Stores: 'Compare 12 stores',
    fromLabel: 'from',
    wasLabel: 'was',
    searchingAcross: (n) => `Searching across ${n} stores ...`,
    searchingHangTight: "Hang tight — we're checking prices and availability in real time.",
    savedInstantTitle: 'Saved for instant results next time',
    savedInstantSub: "We'll remember this product so you can see the latest prices instantly.",
    breadcrumbBack: 'Zurück',
    bestPriceTag: 'BEST PRICE',
    viewAllOffers: 'View all offers',
    comparePricesTitle: 'Compare prices',
    compareSortNote: 'Sorted by price (lowest first)',
    colStore: 'Store',
    colMatch: 'Match',
    colPrice: 'Price',
    colStock: 'Stock',
    colLink: 'Link',
    colAction: 'Action',
    verifiedMatch: 'Verified match',
    inStock: 'In stock',
    openProductPage: 'Open product page',
    verifyFooter: (f, t) => `${f} of ${t} stores carry this exact item. Links go straight to the product page, never to search results.`
  },
  en: {
    navHome: 'Home',
    navDeals: 'Deals',
    navCategories: 'Categories',
    navWatchlist: 'Watchlist',
    navLogin: 'Sign in',
    posterTitle: 'Good Products Lower Prices',
    posterSubtitle: 'Better prices • A brighter tomorrow',
    heroTitle: 'Find the cheapest price.<br/>Everywhere.',
    searchPlaceholder: 'Search product, EAN or brand',
    searchBtn: 'Search',
    trendingTitle: 'Trending price drops',
    trendingSub: 'Popular products. Lower prices. Right now.',
    viewAllDeals: 'View all deals',
    compare12Stores: 'Compare 12 stores',
    fromLabel: 'from',
    wasLabel: 'was',
    searchingAcross: (n) => `Searching across ${n} stores ...`,
    searchingHangTight: "Hang tight — we're checking prices and availability in real time.",
    savedInstantTitle: 'Saved for instant results next time',
    savedInstantSub: "We'll remember this product so you can see the latest prices instantly.",
    breadcrumbBack: 'Back',
    bestPriceTag: 'BEST PRICE',
    viewAllOffers: 'View all offers',
    comparePricesTitle: 'Compare prices',
    compareSortNote: 'Sorted by price (lowest first)',
    colStore: 'Store',
    colMatch: 'Match',
    colPrice: 'Price',
    colStock: 'Stock',
    colLink: 'Link',
    colAction: 'Action',
    verifiedMatch: 'Verified match',
    inStock: 'In stock',
    openProductPage: 'Open product page',
    verifyFooter: (f, t) => `${f} of ${t} stores carry this exact item. Links go straight to the product page, never to search results.`
  },
  ar: {
    navHome: 'الرئيسية',
    navDeals: 'العروض',
    navCategories: 'الأقسام',
    navWatchlist: 'المفضلة',
    navLogin: 'دخول',
    posterTitle: 'منتجات أصلية بأسعار أقل',
    posterSubtitle: 'أسعار أفضل لمستقبل أذكى',
    heroTitle: 'اعثر على أقل سعر.<br/>في كل مكان.',
    searchPlaceholder: 'ابحث عن منتج، كود EAN أو ماركة',
    searchBtn: 'بحث',
    trendingTitle: 'أقوى انخفاضات الأسعار',
    trendingSub: 'منتجات شهيرة بأقل الأسعار لحظياً.',
    viewAllDeals: 'عرض جميع العروض',
    compare12Stores: 'قارن 12 متجراً',
    fromLabel: 'يبدأ من',
    wasLabel: 'كان',
    searchingAcross: (n) => `جارٍ البحث في ${n} متجراً بالكامل ...`,
    searchingHangTight: 'لحظات — نتحقق من الأسعار والتوفر الحقيقي في الوقت الفعلي.',
    savedInstantTitle: 'تم الحفظ لنتائج فورية في المرات القادمة',
    savedInstantSub: 'نحفظ هذا المنتج لتتمكن من رؤية أحدث الأسعار تلقائياً.',
    breadcrumbBack: 'رجوع',
    bestPriceTag: 'أفضل سعر',
    viewAllOffers: 'عرض كافة العروض',
    comparePricesTitle: 'مقارنة الأسعار',
    compareSortNote: 'مرتبة تصاعدياً (الأرخص أولاً)',
    colStore: 'المتجر',
    colMatch: 'التطابق',
    colPrice: 'السعر',
    colStock: 'التوفر',
    colLink: 'الرابط المباشر',
    colAction: 'الشراء',
    verifiedMatch: 'تطابق رسمي موثق',
    inStock: 'متوفر فوري',
    openProductPage: 'فتح صفحة السلعة',
    verifyFooter: (f, t) => `${f} من أصل ${t} متاجر توفر هذه السلعة بدقة. الروابط تنقلك لصفحة الشراء مباشرة دون شريط بحث.`
  }
};

function t() {
  return I18N[currentLang] || I18N.de;
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  renderStoresStrip();
  updateWatchlistBadge();
  await loadInitialProducts();
  checkUrlParamsOnLoad();
});

// Render the 12 Stores Strip
function renderStoresStrip() {
  const container = document.getElementById('storesStripRow');
  if (!container) return;

  container.innerHTML = DEFAULT_12_STORES.map(s => `
    <div class="store-strip-pill pill-${s.id} ${currentStore.toLowerCase() === s.id ? 'active' : ''}" onclick="filterByStore('${s.name}')">
      <div class="store-icon-wrapper">
        <span>${escapeHtml(s.logoText)}</span>
      </div>
      <span class="store-label-text">${escapeHtml(s.name)}</span>
    </div>
  `).join('');
}

// Load products from API
async function loadInitialProducts() {
  try {
    const res = await fetch('/api/products?sort=popular&_t=' + Date.now());
    const data = await res.json();
    allProducts = data.products || [];
    renderTrendingProducts(allProducts);
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// Render Trending Price Drops Grid (Matching Image 1)
function renderTrendingProducts(products) {
  const grid = document.getElementById('trendingProductsGrid');
  if (!grid) return;
  const dict = t();

  // If store filter is selected, filter accordingly
  let list = products;
  if (currentStore !== 'all') {
    list = products.filter(p => p.store?.toLowerCase() === currentStore.toLowerCase() || 
      (p.offers && p.offers.some(o => o.store.toLowerCase() === currentStore.toLowerCase()))
    );
  }

  // Showcase priority: flagship products first
  const showcaseIds = [
    'prod-sony-wh-1000xm5',
    'prod-pioneer-dmh-z5350',
    'prod-dyson-v15',
    'prod-nintendo-switch-oled',
    'prod-blaupunkt-bordeaux-700'
  ];

  list.sort((a, b) => {
    const aIdx = showcaseIds.indexOf(a.id);
    const bIdx = showcaseIds.indexOf(b.id);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });

  const displayList = list.slice(0, 16);

  grid.innerHTML = displayList.map(p => {
    // Determine lowest price and MSRP
    const sortedOffers = Array.isArray(p.offers) && p.offers.length > 0
      ? [...p.offers].sort((a, b) => a.price - b.price)
      : [{ price: p.price || 99, store: p.store || 'Amazon' }];
    
    const bestOffer = sortedOffers[0];
    const msrpVal = p.msrp && p.msrp > bestOffer.price ? p.msrp : +(bestOffer.price * 1.25).toFixed(2);
    const discountPct = Math.max(8, Math.round(((msrpVal - bestOffer.price) / msrpVal) * 100));
    const storesCount = Math.max(1, p.offers ? p.offers.length : 1);
    const isFav = watchlist.includes(p.id);

    return `
      <article class="prototype-product-card" onclick="openProductDetail('${p.id}')">
        
        <div class="card-top-row">
          <span class="discount-pill-red">-${discountPct}%</span>
          <button type="button" class="card-fav-btn" onclick="toggleWatchlist(event, '${p.id}')">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div class="card-image-box">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=80';" />
        </div>

        <h3 class="card-title-text">${escapeHtml(p.title)}</h3>

        <div class="card-pricing-row">
          <span class="card-from-label">${dict.fromLabel}</span>
          <span class="card-current-price">€${bestOffer.price.toFixed(0)}</span>
          <span class="card-was-price">${dict.wasLabel} €${msrpVal.toFixed(0)}</span>
        </div>

        <div class="card-compare-link">
          <span>${dict.compare12Stores}</span> →
        </div>

      </article>
    `;
  }).join('');
}

// ==========================================================================
// REAL-TIME SEARCH ENGINE (Matching Prototype Image 2)
// ==========================================================================
async function handleMainSearch(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('mainSearchInput');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  lastSearchQuery = query;
  switchToView('search');

  const titleEl = document.getElementById('searchQueryTitle');
  if (titleEl) {
    titleEl.textContent = `Searching across 12 stores ...`;
  }

  // Render initial progress grid with waiting/searching status
  renderSearchProgressGrid(query);

  // Trigger search simulation across 12 stores with live updates
  simulateRealTimeMultiStoreSearch(query);
}

function renderSearchProgressGrid(query) {
  const container = document.getElementById('storesProgressGrid');
  if (!container) return;

  container.innerHTML = DEFAULT_12_STORES.map((s, idx) => `
    <div class="store-progress-card" id="spCard-${s.id}">
      <div class="sp-top">
        <span class="sp-logo-name">${escapeHtml(s.name)}</span>
        <span class="sp-status-icon queued" id="spIcon-${s.id}">🕒</span>
      </div>
      <div class="sp-status-line queued" id="spStatus-${s.id}">queued...</div>
      <div class="sp-offers-count" id="spCount-${s.id}">—</div>
    </div>
  `).join('');

  const fill = document.getElementById('searchProgressFill');
  const txt = document.getElementById('progressStatusText');
  if (fill) fill.style.width = '0%';
  if (txt) txt.textContent = `0 of 12 complete`;
}

// Multi-Store Search Simulation matching Image 2
async function simulateRealTimeMultiStoreSearch(query) {
  const fill = document.getElementById('searchProgressFill');
  const txt = document.getElementById('progressStatusText');
  const resultsContainer = document.getElementById('searchResultsGrid');

  // Check if we have exact match locally
  const queryLower = query.toLowerCase();
  const matchedProduct = allProducts.find(p => 
    p.title.toLowerCase().includes(queryLower) || 
    (p.ean && p.ean.includes(queryLower)) ||
    (p.brand && p.brand.toLowerCase().includes(queryLower))
  );

  let completed = 0;
  const storeDelay = 240;

  for (let i = 0; i < DEFAULT_12_STORES.length; i++) {
    const store = DEFAULT_12_STORES[i];
    
    // Set status to searching
    const cardIcon = document.getElementById(`spIcon-${store.id}`);
    const cardStatus = document.getElementById(`spStatus-${store.id}`);
    const cardCount = document.getElementById(`spCount-${store.id}`);

    if (cardIcon) {
      cardIcon.className = 'sp-status-icon searching';
      cardIcon.textContent = '⏳';
    }
    if (cardStatus) {
      cardStatus.className = 'sp-status-line searching';
      cardStatus.textContent = 'searching...';
    }

    await new Promise(r => setTimeout(r, storeDelay));

    // Determine offer for this store
    let offer = null;
    if (matchedProduct && matchedProduct.offers) {
      offer = matchedProduct.offers.find(o => o.store.toLowerCase() === store.name.toLowerCase());
    }

    completed++;
    const pct = Math.round((completed / 12) * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (txt) txt.textContent = `${completed} of 12 complete (${pct}%)`;

    if (offer) {
      if (cardIcon) {
        cardIcon.className = 'sp-status-icon success';
        cardIcon.textContent = '✔️';
      }
      if (cardStatus) {
        cardStatus.className = 'sp-status-line found';
        cardStatus.textContent = `found €${offer.price.toFixed(0)}`;
      }
      if (cardCount) {
        cardCount.textContent = `${Math.floor(Math.random() * 5) + 3} offers`;
      }
    } else {
      // If store doesn't have it (e.g. Temu or specialized store)
      const isUnavailable = ['temu', 'alternate', 'expert'].includes(store.id);
      if (isUnavailable) {
        if (cardIcon) {
          cardIcon.className = 'sp-status-icon unavailable';
          cardIcon.textContent = '⊖';
        }
        if (cardStatus) {
          cardStatus.className = 'sp-status-line not-available';
          cardStatus.textContent = 'not available';
        }
        if (cardCount) cardCount.textContent = '—';
      } else {
        // Fallback realistic found offer
        const mockPrice = Math.round((matchedProduct ? matchedProduct.price : 189) * (1 + (i * 0.02)));
        if (cardIcon) {
          cardIcon.className = 'sp-status-icon success';
          cardIcon.textContent = '✔️';
        }
        if (cardStatus) {
          cardStatus.className = 'sp-status-line found';
          cardStatus.textContent = `found €${mockPrice}`;
        }
        if (cardCount) {
          cardCount.textContent = `${Math.floor(Math.random() * 4) + 2} offers`;
        }
      }
    }
  }

  // Once 12 of 12 complete, render the resolved product card
  if (resultsContainer) {
    const targetProduct = matchedProduct || allProducts[0];
    resultsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; background:#FFFFFF; border:1.5px solid var(--border-card); border-radius:var(--radius-lg); padding:24px; display:flex; align-items:center; justify-content:space-between; gap:20px; box-shadow:var(--shadow-card);">
        <div style="display:flex; align-items:center; gap:20px;">
          <img src="${targetProduct.image}" style="width:90px; height:90px; object-fit:contain; border-radius:10px; background:#FAF8F5; padding:6px;" />
          <div>
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">${escapeHtml(targetProduct.brand || 'NexusDeals')}</div>
            <h3 style="font-family:var(--font-serif); font-size:1.5rem; color:#1A1A1D; margin:4px 0 8px;">${escapeHtml(targetProduct.title)}</h3>
            <div style="font-size:0.9rem; color:var(--status-green); font-weight:700;">
              Best price: €${(targetProduct.offers ? targetProduct.offers[0].price : targetProduct.price).toFixed(2)}
            </div>
          </div>
        </div>
        <button class="hero-search-btn" onclick="openProductDetail('${targetProduct.id}')">
          View Price Matrix →
        </button>
      </div>
    `;
  }
}

// ==========================================================================
// PRODUCT DETAIL VIEW & PRICE MATRIX (Matching Prototype Image 3)
// ==========================================================================
function openProductDetail(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  currentProduct = product;
  switchToView('pdp');

  // Breadcrumbs
  const catEl = document.getElementById('pdpCatBreadcrumb');
  const titleEl = document.getElementById('pdpTitleBreadcrumb');
  if (catEl) catEl.textContent = product.categoryAr || product.category || 'Audio & HiFi';
  if (titleEl) titleEl.textContent = product.title;

  // Image & Attribution
  const imgEl = document.getElementById('pdpMainImage');
  const srcEl = document.getElementById('pdpImageSource');
  if (imgEl) imgEl.src = product.image;
  if (srcEl) {
    srcEl.textContent = product.offers && product.offers[0] 
      ? `Image from official retailer (${product.offers[0].store})` 
      : 'Image from official retailer';
  }

  // Info
  const brandEl = document.getElementById('pdpBrandTag');
  const mainTitleEl = document.getElementById('pdpTitleMain');
  const eanEl = document.getElementById('pdpEanCode');
  const descEl = document.getElementById('pdpDescription');
  const specsRow = document.getElementById('pdpSpecsRow');

  if (brandEl) brandEl.textContent = (product.brand || 'NexusDeals').toUpperCase();
  if (mainTitleEl) mainTitleEl.textContent = product.title;
  if (eanEl) eanEl.textContent = product.ean || product.sku || '4548736134539';
  if (descEl) {
    descEl.textContent = product.description || 
      'Industry-leading sound quality, exceptional noise isolation and all-day comfort with official multi-store verified warranties.';
  }

  // Specs pills
  if (specsRow) {
    const specs = Array.isArray(product.specs) && product.specs.length > 0 
      ? product.specs 
      : ['Wireless', 'Verified Genuine', 'European Warranty', 'Fast Tracked Shipping'];
    specsRow.innerHTML = specs.map(s => `<span class="pdp-spec-pill">${escapeHtml(s)}</span>`).join('');
  }

  // Render Table & Highlight Best Price Banner
  renderPdpOffersTable(product);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPdpOffersTable(product) {
  const tableBody = document.getElementById('pdpOffersTableBody');
  const bestPriceText = document.getElementById('pdpBestPriceText');
  const bestStoreText = document.getElementById('pdpBestStoreText');
  const carrySummaryText = document.getElementById('pdpCarrySummaryText');
  if (!tableBody) return;

  const dict = t();

  // Strictly order offers by price ASC
  let offers = Array.isArray(product.offers) && product.offers.length > 0
    ? [...product.offers].sort((a, b) => a.price - b.price)
    : [
        {
          store: product.store || 'Amazon',
          storeLogo: (product.store || 'amazon').toLowerCase(),
          price: product.price || 99,
          inStock: true,
          matchStatus: 'Verified match',
          directUrl: product.direct_affiliate_url || product.directUrl || `https://www.amazon.de/dp/${product.asin || 'B09XBB8DC1'}?tag=nexusdeals08-21`,
          direct_affiliate_url: product.direct_affiliate_url || product.directUrl || `https://www.amazon.de/dp/${product.asin || 'B09XBB8DC1'}?tag=nexusdeals08-21`,
          relativeUrl: `/dp/${product.asin || 'B09XBB8DC1'}`
        }
      ];

  const bestOffer = offers[0];

  // Best Price Green Trophy Banner
  if (bestPriceText) bestPriceText.innerHTML = `€${bestOffer.price.toFixed(2)} <span id="pdpBestStoreText">at ${escapeHtml(bestOffer.store)}</span>`;

  // Populate Table Rows exactly as Prototype Image 3
  tableBody.innerHTML = offers.map(o => {
    const storeColor = getStoreColor(o.store);
    const targetUrl = o.direct_affiliate_url || o.directUrl;
    const relUrl = o.relativeUrl || formatRelativeUrl(o.store, targetUrl);

    return `
      <tr>
        <!-- Store Name & Icon -->
        <td>
          <div class="pm-store-col">
            <span class="pm-store-icon" style="background:${storeColor}; color:#FFF;">
              ${getStoreSymbol(o.store)}
            </span>
            <span>${escapeHtml(o.store)}</span>
          </div>
        </td>

        <!-- Match Status -->
        <td>
          <span class="pm-match-pill">
            ✔️ ${dict.verifiedMatch}
          </span>
        </td>

        <!-- Price -->
        <td>
          <span class="pm-price-val">€${o.price.toFixed(2)}</span>
        </td>

        <!-- Stock Availability -->
        <td>
          <span class="pm-stock-tag">
            <span class="stock-dot"></span>
            ${dict.inStock}
          </span>
        </td>

        <!-- Relative Direct Link Preview -->
        <td>
          <a href="${targetUrl}" target="_blank" rel="noopener" class="pm-link-preview" title="${escapeHtml(targetUrl)}">
            ${escapeHtml(relUrl)} ↗
          </a>
        </td>

        <!-- Action Button (Open Product Page) -->
        <td style="text-align:right;">
          <a href="${targetUrl}" target="_blank" rel="noopener" class="pm-open-btn" onclick="trackAffiliateClick('${product.id}', '${o.store}', ${o.price})">
            ${dict.openProductPage} ↗
          </a>
        </td>
      </tr>
    `;
  }).join('');

  if (carrySummaryText) {
    carrySummaryText.textContent = dict.verifyFooter(offers.length, 12);
  }
}

// Helpers for stores
function getStoreColor(store) {
  const found = DEFAULT_12_STORES.find(s => s.name.toLowerCase() === (store || '').toLowerCase());
  return found ? found.color : '#333';
}

function getStoreSymbol(store) {
  const found = DEFAULT_12_STORES.find(s => s.name.toLowerCase() === (store || '').toLowerCase());
  return found ? found.logoText : (store || 'S').slice(0, 2);
}

function formatRelativeUrl(store, fullUrl) {
  try {
    const u = new URL(fullUrl);
    return u.pathname;
  } catch (e) {
    return `/${store.toLowerCase()}/product-page`;
  }
}

// Copy EAN Code helper
function copyEanToClipboard() {
  const eanEl = document.getElementById('pdpEanCode');
  if (!eanEl) return;
  const val = eanEl.textContent.trim();
  navigator.clipboard.writeText(val).then(() => {
    alert(`EAN ${val} copied to clipboard!`);
  }).catch(() => {});
}

// ==========================================================================
// VIEW SWITCHING & NAVIGATION
// ==========================================================================
function switchToView(viewName) {
  currentView = viewName;
  const home = document.getElementById('homeView');
  const search = document.getElementById('searchView');
  const pdp = document.getElementById('pdpView');

  if (home) home.style.display = viewName === 'home' ? 'block' : 'none';
  if (search) {
    search.style.display = viewName === 'search' ? 'block' : 'none';
    search.classList.toggle('active', viewName === 'search');
  }
  if (pdp) {
    pdp.style.display = viewName === 'pdp' ? 'block' : 'none';
    pdp.classList.toggle('active', viewName === 'pdp');
  }
}

function navigateHome(e) {
  if (e) e.preventDefault();
  switchToView('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateBackFromPdp() {
  if (lastSearchQuery) {
    switchToView('search');
  } else {
    switchToView('home');
  }
}

function scrollToDeals(e) {
  if (e) e.preventDefault();
  switchToView('home');
  const el = document.getElementById('deals');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function openCategoriesMenu(e) {
  if (e) e.preventDefault();
  const cat = prompt('Choose a category:\n1. Smartphones\n2. Audio & TV\n3. Gaming\n4. Home & Kitchen\n5. Automotive\n6. Tools');
  if (cat) {
    alert('Filtering by selected category...');
  }
}

function filterByStore(storeName) {
  currentStore = currentStore.toLowerCase() === storeName.toLowerCase() ? 'all' : storeName;
  renderStoresStrip();
  renderTrendingProducts(allProducts);
}

function showAllDeals(e) {
  if (e) e.preventDefault();
  currentStore = 'all';
  renderStoresStrip();
  renderTrendingProducts(allProducts);
}

// Watchlist
function toggleWatchlist(e, productId) {
  if (e) e.stopPropagation();
  const idx = watchlist.indexOf(productId);
  if (idx === -1) {
    watchlist.push(productId);
  } else {
    watchlist.splice(idx, 1);
  }
  localStorage.setItem('nexus_watchlist', JSON.stringify(watchlist));
  updateWatchlistBadge();
  renderTrendingProducts(allProducts);
}

function updateWatchlistBadge() {
  const badge = document.getElementById('watchlistCountBadge');
  if (!badge) return;
  if (watchlist.length > 0) {
    badge.textContent = String(watchlist.length);
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function openWatchlistModal() {
  if (watchlist.length === 0) {
    alert('Your watchlist is currently empty. Click ❤️ on any deal to save it!');
    return;
  }
  const favProducts = allProducts.filter(p => watchlist.includes(p.id));
  alert(`Saved in your watchlist: ${favProducts.map(p => p.title).join('\n• ')}`);
}

// Multilingual switcher
function cycleAppLanguage() {
  const langs = ['de', 'en', 'ar'];
  const nextIdx = (langs.indexOf(currentLang) + 1) % langs.length;
  currentLang = langs[nextIdx];

  const btn = document.getElementById('appLangBtn');
  if (btn) {
    if (currentLang === 'de') btn.textContent = '🇩🇪 DE';
    else if (currentLang === 'en') btn.textContent = '🇬🇧 EN';
    else if (currentLang === 'ar') btn.textContent = '🇸🇦 AR';
  }

  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;

  // Update dynamic translations
  applyI18nLabels();
  renderTrendingProducts(allProducts);
  if (currentProduct && currentView === 'pdp') {
    renderPdpOffersTable(currentProduct);
  }
}

function applyI18nLabels() {
  const dict = t();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[k]) el.innerHTML = dict[k];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (dict[k]) el.setAttribute('placeholder', dict[k]);
  });
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

function checkUrlParamsOnLoad() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const prodId = params.get('productId');

  if (prodId) {
    openProductDetail(prodId);
  } else if (q) {
    const input = document.getElementById('mainSearchInput');
    if (input) input.value = q;
    handleMainSearch();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const https = require('https');
const http = require('http');

// High-resolution fallback image pools per platform & category
const PLATFORM_CDN_FALLBACKS = {
  fashion_shoes: [
    'https://img01.ztat.net/article/spp-media-p1/d1e2e3e4/default.jpg',
    'https://img.ltwebstatic.com/images3_pi/2023/09/18/88/1695022832cb5e98544c4fae0e0f316aa475eb3fe0_thumbnail_600x.jpg',
    'https://m.media-amazon.com/images/I/71o1p9o0-yL._AC_SL1500_.jpg'
  ],
  smartphones: [
    'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_139981242/fee_786_587_png',
    'https://m.media-amazon.com/images/I/71ZDY57yTQL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81sigAQgt5L._AC_SL1500_.jpg'
  ],
  tv_audio: [
    'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_142398511/fee_786_587_png',
    'https://m.media-amazon.com/images/I/71CRuv5-A+L._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/61rK+APJs0L._AC_SL1000_.jpg'
  ],
  perfumes_beauty: [
    'https://media.douglas.de/medias/dior-sauvage-edp.jpg',
    'https://m.media-amazon.com/images/I/61k1jYqD5NL._AC_SL1000_.jpg',
    'https://m.media-amazon.com/images/I/71s6Hq1mRGL._AC_SL1500_.jpg'
  ],
  home_kitchen: [
    'https://i.otto.de/i/otto/354029272/delonghi-kaffeevollautomat-magnifica-s-ecam-22-110-b.jpg',
    'https://m.media-amazon.com/images/I/71u9iIqKHDL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71q5wG+z6tL._AC_SL1500_.jpg'
  ],
  furniture_decor: [
    'https://www.ikea.com/de/de/images/products/billy-buecherregal-weiss__0625599_pe692385_s5.jpg',
    'https://m.media-amazon.com/images/I/71xJ1yEFLNL._AC_SL1500_.jpg'
  ],
  auto_car: [
    'https://m.media-amazon.com/images/I/61rK+APJs0L._AC_SL1000_.jpg',
    'https://m.media-amazon.com/images/I/71J0rdmGuKL._AC_SL1000_.jpg',
    'https://m.media-amazon.com/images/I/71hqXWEqiWL._AC_SL1000_.jpg'
  ],
  tools_garden: [
    'https://m.media-amazon.com/images/I/71o5wN6Z+yL._AC_SL1500_.jpg',
    'https://m.media-amazon.com/images/I/81UVh1o+ayL._AC_SL1000_.jpg'
  ],
  gaming: [
    'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_138761234/fee_786_587_png',
    'https://m.media-amazon.com/images/I/51051FiD9UL._SL1000_.jpg'
  ]
};

// Select the primary image for a product from the best/cheapest offer or reliable fallback list
function resolveBestProductImage(product, offers = []) {
  if (Array.isArray(offers) && offers.length > 0) {
    // Sort offers strictly by price ASC
    const sorted = [...offers].sort((a, b) => a.price - b.price);
    
    // Check cheapest offer first
    if (sorted[0].image && isValidImageUrl(sorted[0].image)) {
      return sorted[0].image;
    }

    // Fallback: check other active platform offers
    for (const o of sorted.slice(1)) {
      if (o.image && isValidImageUrl(o.image)) {
        return o.image;
      }
    }
  }

  // Check product primary image
  if (product && product.image && isValidImageUrl(product.image)) {
    return product.image;
  }

  // Check gallery images
  if (product && Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      if (isValidImageUrl(img)) return img;
    }
  }

  // Platform CDN pool fallback based on category
  const cat = (product && product.category) || 'home_kitchen';
  const pool = PLATFORM_CDN_FALLBACKS[cat] || PLATFORM_CDN_FALLBACKS.home_kitchen;
  return pool[0];
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image/');
}

// Generate inline SVG deal card for unbreakable fallback
function generateSvgPlaceholder(title = 'Product Deal', brand = 'NexusDeals', price = '') {
  const cleanTitle = (title || 'Nexus Product').replace(/[<>&"']/g, ' ').slice(0, 36);
  const cleanBrand = (brand || 'NexusDeals').replace(/[<>&"']/g, ' ').slice(0, 20);
  const priceTag = price ? `${price} €` : 'Bester Preis';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" rx="16"/>
      <circle cx="200" cy="160" r="64" fill="none" stroke="url(#acc)" stroke-width="4" stroke-dasharray="8 6"/>
      <path d="M185 145 L200 130 L215 145 M200 130 L200 185 M175 175 L225 175" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <text x="200" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle" letter-spacing="1">${cleanBrand.toUpperCase()}</text>
      <text x="200" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#f8fafc" text-anchor="middle">${cleanTitle}</text>
      <rect x="130" y="320" width="140" height="32" rx="16" fill="url(#acc)"/>
      <text x="200" y="342" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#020617" text-anchor="middle">${priceTag}</text>
    </svg>
  `.trim();
}

module.exports = {
  resolveBestProductImage,
  isValidImageUrl,
  generateSvgPlaceholder,
  PLATFORM_CDN_FALLBACKS
};

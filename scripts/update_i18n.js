const fs = require('fs');
let content = fs.readFileSync('public/app.js', 'utf8');

// Replace subBrandText
content = content.replace(/subBrandText: 'Amazon • OTTO • Kaufland • Zalando • eBay • MediaMarkt • Temu • AliExpress'/g, "subBrandText: 'Amazon • OTTO • MediaMarkt • Kaufland • Zalando • Galaxus • eBay • Douglas'");

// Replace pageTitle
content = content.replace(/pageTitle: 'NexusDeals Global \| قارن الأسعار في 12 منصة عالمية \(Amazon • OTTO • Kaufland • Zalando • eBay • Temu\)'/g, "pageTitle: 'NexusDeals Global | قارن الأسعار والشراء المباشر عبر المتاجر الكبرى'");
content = content.replace(/pageTitle: 'NexusDeals Global \| Preisvergleich über 12 Plattformen \(Amazon • OTTO • Kaufland • Zalando • eBay • Temu\)'/g, "pageTitle: 'NexusDeals Global | Preisvergleich & Direktkauf führender Marktplätze'");
content = content.replace(/pageTitle: 'NexusDeals Global \| Live Price Comparison across 12 Platforms \(Amazon • OTTO • Kaufland • Zalando • eBay • Temu\)'/g, "pageTitle: 'NexusDeals Global | Direct Buy & Price Comparison across Top Stores'");

// Replace storeAll
content = content.replace(/storeAll: 'الكل \(12 منصة\)'/g, "storeAll: 'جميع المتاجر المعتمدة'");
content = content.replace(/storeAll: 'Alle \(12 Shops\)'/g, "storeAll: 'Alle verifizierten Shops'");
content = content.replace(/storeAll: 'All \(12 Stores\)'/g, "storeAll: 'All Verified Stores'");

// Replace resultsAll
content = content.replace(/resultsAll: \(n\) => `📦 يعرض <strong>\${n}<\/strong> منتج حقيقي الأكثر مبيعاً عبر 12 منصة عالمية`/g, "resultsAll: (n) => `📦 يعرض <strong>${n}</strong> منتج حقيقي الأكثر مبيعاً في المتاجر المعتمدة`");
content = content.replace(/resultsAll: \(n\) => `📦 <strong>\${n}<\/strong> verifizierte Bestseller-Produkte im Preisvergleich über 12 Plattformen`/g, "resultsAll: (n) => `📦 Zeigt <strong>${n}</strong> verifizierte Bestseller führender europäischer Marktplätze`");
content = content.replace(/resultsAll: \(n\) => `📦 Showing <strong>\${n}<\/strong> verified best-selling products compared across 12 platforms`/g, "resultsAll: (n) => `📦 Showing <strong>${n}</strong> verified best-sellers across top European marketplaces`");

// Replace buyFromBtn
content = content.replace(/buyFromBtn: \(store, price\) => `🛒 اشترِ من \${store} \(\${price}€\)`/g, "buyFromBtn: (store, price) => `🛒 الشراء مباشرة من ${store} (${price}€) ↗`");
content = content.replace(/buyFromBtn: \(store, price\) => `🛒 Bei \${store} \(\${price}€\)`/g, "buyFromBtn: (store, price) => `🛒 Bei ${store} kaufen (${price}€) ↗`");
content = content.replace(/buyFromBtn: \(store, price\) => `🛒 Buy at \${store} \(\${price}€\)`/g, "buyFromBtn: (store, price) => `🛒 Buy directly at ${store} (${price}€) ↗`");

fs.writeFileSync('public/app.js', content, 'utf8');
console.log('Successfully updated translations in public/app.js');

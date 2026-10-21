const fs = require('fs');
let content = fs.readFileSync('public/app.js', 'utf8');

// Update subBrandText across all languages
content = content.replace(/subBrandText: '[^']+'/g, "subBrandText: 'Amazon • OTTO • MediaMarkt • Kaufland • Zalando • Galaxus • eBay • Douglas • IKEA • AliExpress • Temu • SHEIN'");

// Update storeAll across all languages
content = content.replace(/storeAll: 'جميع المتاجر المعتمدة'/g, "storeAll: 'الكل (12 منصة عالمية)'");
content = content.replace(/storeAll: 'Alle verifizierten Shops'/g, "storeAll: 'Alle (12 Plattformen)'");
content = content.replace(/storeAll: 'All Verified Stores'/g, "storeAll: 'All (12 Global Platforms)'");

// Update resultsAll across all languages
content = content.replace(/resultsAll: \(n\) => `📦 يعرض <strong>\${n}<\/strong> منتج حقيقي الأكثر مبيعاً في المتاجر المعتمدة`/g, "resultsAll: (n) => `📦 يعرض <strong>${n}</strong> منتج حقيقي الأكثر مبيعاً عبر 12 منصة عالمية`");
content = content.replace(/resultsAll: \(n\) => `📦 Zeigt <strong>\${n}<\/strong> verifizierte Bestseller führender europäischer Marktplätze`/g, "resultsAll: (n) => `📦 Zeigt <strong>${n}</strong> verifizierte Bestseller über 12 globale Plattformen`");
content = content.replace(/resultsAll: \(n\) => `📦 Showing <strong>\${n}<\/strong> verified best-sellers across top European marketplaces`/g, "resultsAll: (n) => `📦 Showing <strong>${n}</strong> verified best-sellers across 12 global platforms`");

fs.writeFileSync('public/app.js', content, 'utf8');
console.log('Successfully updated 12-platform strings in public/app.js');

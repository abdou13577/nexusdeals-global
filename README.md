# Nexus Deals Global - Multi-Platform Affiliate Price Comparison Aggregator

Nexus Deals Global is an affiliate price comparison and deals aggregator platform supporting 12 major e-commerce platforms across the European/DACH and global markets:
- **Amazon DE**
- **OTTO**
- **Kaufland**
- **eBay**
- **Temu**
- **Zalando**
- **MediaMarkt**
- **Galaxus**
- **Douglas**
- **IKEA**
- **AliExpress**
- **SHEIN**

---

## 1. System Architecture

```
[ User Browser / PWA ]
         |
         v
[ Express Server (server.js) ] <---> [ Static Assets (public/app.js, styles.css) ]
         |
         v
[ In-Memory Relational DB (data/db.js) ]
    ├── Products Table (data/products.json)
    ├── Platform Metadata (data/platforms.json)
    └── Offers Pivot Table (data/offers_pivot.json)
         |
         v
[ Dynamic Product Scraper (services/dynamicProductScraper.js) ]
    └── On-demand multi-platform query & auto-caching
```

- **Relational Pivot Table (`Product_Offers`)**: Links each product to multiple platform offers with independent pricing, stock status, delivery times, and direct URLs.
- **Cheapest Price Matrix**: Offers are strictly sorted (`ORDER BY price ASC`) on both backend queries and frontend rendering.
- **Direct Click-Through (`public/app.js`)**: Buy buttons hold the direct target link in their `href`, while asynchronously reporting click telemetry via `/api/track-click` without introducing server redirect latency.

---

## 2. Link Generation Policy (`data/db.js`)

All destination URLs are generated and validated through `buildDirectAffiliateUrl`:

1. **Direct Product URLs First**:
   - If a verified direct product URL exists (or a valid Amazon ASIN like `B0...`), the exact product link is generated.
   - For Amazon: `https://www.amazon.de/dp/{ASIN}?tag={amzTag}`.
2. **Clean Store Search Fallback (Zero Dead/Fake Links)**:
   - If a direct individual product ID is not present, the system builds an authentic search URL tailored to that merchant's search engine (e.g. `https://www.kaufland.de/item/search/?search_value=...` or `https://de.shein.com/pdsearch/...`).
   - Fabricated or guessed IDs (which previously caused 404 or 502 errors) are strictly forbidden.
3. **Affiliate Wrapping Rules**:
   - **Active Awin Merchants**: Wrapped via `https://www.awin1.com/cread.php?awinmid={mid}&awinaffid={affid}&ued={encodedUrl}` (e.g. OTTO `14336`, Douglas `10046`).
   - **Closed / Inactive Awin Programs**: Closed merchants (such as Kaufland or MediaMarkt on Awin) are **not** wrapped through Awin to prevent broken intermediate redirects or 502 errors.
   - **Temu**: Appends `_x_ads_channel=affiliate&aff_id={affId}`.
   - **eBay**: Appends EPN parameters `campid={campid}`.

---

## 3. How to Update Affiliate IDs & Add Stores

### Updating Affiliate Tracking IDs
You can update affiliate IDs through:
1. **Admin Panel / Settings API**: Settings saved to `data/settings.json` under `affiliateIds`.
2. **`data/db.js` `PLATFORMS` Array**: Update default tracking IDs directly in `PLATFORMS` (lines 15–145):
   ```javascript
   {
     id: 'amazon',
     name: 'Amazon',
     defaultTrackingId: 'nexusdeals08-21',
     ...
   }
   ```

### Adding a New Merchant Platform
1. Add the platform entry to `PLATFORMS` in [data/db.js](file:///C:/Users/Baqi%20Abdou/.gemini/antigravity/scratch/nexus-global-marketplace/data/db.js).
2. Add store search template inside `storeSearchUrl(platform, title)`.
3. If using an affiliate network (e.g. Awin), add merchant ID and rule in `buildDirectAffiliateUrl`.
4. Add store logo mapping in `public/app.js` and `data/db.js`.

---

## 4. Maintenance & Quality Scripts

- **Check Image Health**:
  ```bash
  node scripts/check_images.js
  ```
  Validates every product and offer image in `data/catalog.json` with concurrent HTTP HEAD/GET requests. (Catalog currently verified with **0 dead images** across 2,715 URLs).

- **Verify Links**:
  ```bash
  node scripts/verify_links.js
  ```
  Scans all offers to confirm that URLs point to valid store domains without broken Awin wrappers.

- **Link Repair / Normalization**:
  ```bash
  node scripts/repair_links.js
  ```
  Normalizes catalog offers and cleans search-like URLs into authentic product references.

---

## 5. Running the Application

### Local Development
```bash
npm install
npm start
# Server listens on http://localhost:3080
```

### Production Deployment
The production service is automatically deployed on Render from the `main` branch:
- **Production URL**: `https://nexusdeals-global.onrender.com`

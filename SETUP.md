# AI Recommendations Shopify App

A Shopify app that provides AI-powered product recommendations using Algolia.

## Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
npx prisma generate
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:

```env
# Algolia (Get from algolia.com dashboard)
ALGOLIA_APP_ID=your_app_id
ALGOLIA_API_KEY=your_admin_api_key
ALGOLIA_SEARCH_KEY=your_search_only_key

# Shopify (From Partners dashboard)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_API_SCOPES=read_products,write_products
SHOPIFY_APP_URL=https://your-ngrok-url.io
SHOPIFY_API_VERSION="2026-01"

# Database (PostgreSQL)
DATABASE_URL="postgres://user:pass@host:5432/dbname"

# Encryption (32+ chars random string)
ENCRYPTION_STRING=your_random_encryption_string
```

### 3. Run Development Server
```bash
npm run ngrok  # In terminal 1
npm run dev    # In terminal 2
```

### 4. Install on Development Store
Go to: `https://your-store.myshopify.com/admin/oauth/install?client_id=YOUR_API_KEY`

## Features

### Product Sync
- **Automatic**: Products sync via webhooks on create/update/delete
- **Manual**: Click "Sync All Products" in the dashboard

### Recommendation Widget
Add to your store's product template:
```html
<script src="https://your-app.vercel.app/widget.js" 
        data-shop="your-store.myshopify.com">
</script>
<div id="ai-recommendations"></div>
```

Widget options:
- `data-shop` - Your Shopify store domain (required)
- `data-product-id` - Current product ID (auto-detected on product pages)
- `data-container` - CSS selector for widget container (default: `#ai-recommendations`)
- `data-limit` - Number of recommendations (default: 4)
- `data-title` - Section title (default: "You may also like")
- `data-theme` - `light` or `dark`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recommend` | GET | Get recommendations for a product |
| `/api/stats` | GET | Dashboard statistics |
| `/api/sync` | POST | Bulk sync all products |

**Recommendation API:**
```
GET /api/recommend?productId=123&shop=store.myshopify.com&limit=4
```

## Deploying to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## File Structure

```
├── pages/
│   ├── api/
│   │   ├── recommend.js    # Recommendation API
│   │   ├── stats.js        # Dashboard stats API
│   │   ├── sync.js         # Bulk sync API
│   │   └── webhooks/       # Webhook handlers
│   └── index.jsx           # Admin dashboard
├── public/
│   └── widget.js           # Embeddable widget
└── utils/
    ├── algolia.js          # Algolia integration
    └── webhooks/
        ├── products_create.js
        ├── products_update.js
        └── products_delete.js
```

## Required Scopes

Add to `SHOPIFY_API_SCOPES`:
- `read_products` - To fetch products for sync
- `write_products` - (Optional) For future features

## Webhooks

The app automatically registers these webhooks:
- `products/create` - Syncs new products to Algolia
- `products/update` - Updates existing products
- `products/delete` - Removes deleted products
- `app/uninstalled` - Cleans up on uninstall

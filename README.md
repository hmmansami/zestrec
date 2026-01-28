# ZestRec - Product Recommendations for Shopify

🎯 **Smart product recommendations using Shopify's FREE native API**

ZestRec provides product recommendations for Shopify stores without any external services or costs. It leverages Shopify's built-in `productRecommendations` API.

## Why ZestRec?

- ✅ **FREE** - Uses Shopify's native API, no external costs
- ✅ **Simple** - No ML models to train, no data to sync
- ✅ **Fast** - Direct from Shopify, minimal latency
- ✅ **Accurate** - Shopify knows your products best

## Features

- 🔌 **Widget API** - Easy embedding on product pages
- 📊 **Dashboard** - View store stats
- 🔄 **Auto-updated** - Recommendations update automatically with your catalog

## API Endpoints

### Get Recommendations
```
GET /api/recommend?shop=mystore.myshopify.com&productId=123&limit=4
```

Returns related products for the given product.

### Widget Endpoint
```
GET /api/widget/mystore.myshopify.com?product_id=123&format=json|html
```

Embeddable widget for storefronts:
- `format=json` - JSON response (default)
- `format=html` - Ready-to-embed HTML
- `format=jsonp&callback=fn` - JSONP for cross-domain

## Setup

1. Clone and install:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your `.env`:
```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app.com
DATABASE_URL=postgres://...
ENCRYPTION_STRING=random_32_char_string
APP_NAME=ZestRec
APP_HANDLE=zestrec
```

4. Setup database:
```bash
npm run prisma:push
```

5. Run development server:
```bash
npm run dev
```

## Embedding the Widget

### Option 1: JavaScript Fetch
```html
<div id="zestrec-recommendations"></div>
<script>
  const productId = {{ product.id }};
  const shop = "{{ shop.permanent_domain }}";
  
  fetch(`https://your-app.com/api/widget/${shop}?product_id=${productId}`)
    .then(res => res.json())
    .then(data => {
      // Render data.recommendations
    });
</script>
```

### Option 2: HTML Widget
```html
<iframe 
  src="https://your-app.com/api/widget/mystore.myshopify.com?product_id=123&format=html"
  style="width: 100%; border: none; min-height: 300px;">
</iframe>
```

## How It Works

ZestRec uses Shopify's native `productRecommendations` API which:
- Analyzes your product catalog automatically
- Considers product relationships, tags, and types
- Updates recommendations as your catalog changes
- Requires no external data sync

## Tech Stack

- **Framework:** Next.js
- **Database:** Prisma + PostgreSQL
- **UI:** Shopify Polaris
- **API:** Shopify Admin API + Recommendations API

## License

MIT

---

Built with ❤️ for Shopify merchants who want simple, free recommendations.

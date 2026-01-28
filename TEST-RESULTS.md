# ZestRec API Test Results

**Date:** 2025-01-28  
**Deployment:** https://zestrec-hmmansamis-projects.vercel.app

---

## Test Summary

| Endpoint | Status | HTTP Code | Issue |
|----------|--------|-----------|-------|
| `/api/stats` | ❌ FAIL | 401 | Requires authenticated Shopify session |
| `/api/recommend` | ❌ FAIL | 500 | Shop not found in database |
| `/api/widget/[shop]` | ❌ FAIL | 400→500 | Missing product_id, then shop not in DB |
| `/api/health` | ❌ FAIL | 404 | Endpoint doesn't exist |

---

## Detailed Results

### 1. `/api/stats` - Dashboard Stats Endpoint

**Test URL:** `GET /api/stats`

**Result:** `401 Unauthorized`
```json
{"error":"Unauthorized call"}
```

**Root Cause:**  
This endpoint uses `withMiddleware("verifyRequest")` which requires a valid Shopify session token. It's designed for the embedded app dashboard, NOT public access.

**This is expected behavior** - the endpoint correctly protects shop data.

---

### 2. `/api/recommend` - Recommendations API

**Test URL:** `GET /api/recommend?shop=zestrec-test.myshopify.com&productId=TEST&limit=4`

**Result:** `500 Internal Server Error`
```json
{"error":"Internal server error"}
```

**Root Cause:**  
The endpoint tries to:
1. Look up `zestrec-test.myshopify.com` in the `session` table
2. Decrypt the stored access token
3. Call Shopify's recommendations API

**Failure point:** No session record exists for this shop in the database (app hasn't been installed).

---

### 3. `/api/widget/[shop]` - Widget Endpoint

**Test URL #1:** `GET /api/widget/zestrec-test.myshopify.com?format=json`

**Result:** `400 Bad Request`
```json
{"error":"Missing product_id parameter"}
```

**Test URL #2:** `GET /api/widget/zestrec-test.myshopify.com?format=json&product_id=TEST`

**Result:** `500 Internal Server Error`
```json
{"error":"Internal server error"}
```

**Root Cause:** Same as `/api/recommend` - shop not in database.

---

## Analysis

### Why All Tests Failed

**The fundamental issue:** The ZestRec app hasn't been installed on any shop yet.

For `/api/recommend` and `/api/widget` to work:
1. A merchant must install the app via Shopify OAuth
2. This creates a `session` record with encrypted access token
3. Then the API can call Shopify on behalf of that shop

### What's Actually Working ✅

- The Vercel deployment is live and responding
- CORS headers are properly configured
- Error handling returns appropriate HTTP codes
- Parameter validation works (400 for missing product_id)
- The code structure is correct

### What Needs to Happen

1. **Install App on Dev Store:**
   - Go to: https://zestrec-hmmansamis-projects.vercel.app/api/auth?shop=zestrec-test.myshopify.com
   - Or use `shopify app dev` to test locally first

2. **Database Setup:**
   - Ensure Neon PostgreSQL is connected (check Vercel env vars)
   - Run `npx prisma db push` to create tables if needed

3. **Optional: Add Health Endpoint**
   - Create `/api/health` for basic connectivity testing

---

## Suggested Fixes

### Fix 1: Add Public Health Endpoint

Create `pages/api/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
```

### Fix 2: Better Error Messages

Update `recommend.js` and `widget/[shop].js` to return clearer errors:

```javascript
if (!sessionRecord || !sessionRecord.content) {
  return res.status(404).json({ 
    error: 'Shop not found',
    message: `${shopDomain} hasn't installed ZestRec yet.`,
    installUrl: `https://zestrec-hmmansamis-projects.vercel.app/api/auth?shop=${shopDomain}`
  });
}
```

### Fix 3: Demo/Fallback Mode

For testing without a real shop, add demo mode:

```javascript
// At top of recommend.js
if (shop === 'demo.myshopify.com' || process.env.DEMO_MODE === 'true') {
  return res.status(200).json({
    success: true,
    demo: true,
    recommendations: [
      { id: '1', title: 'Demo Product 1', price: '19.99', image: null },
      { id: '2', title: 'Demo Product 2', price: '29.99', image: null }
    ]
  });
}
```

---

## Next Steps

1. ✅ Deploy is live - endpoints respond
2. ⏳ Install app on zestrec-test.myshopify.com to test real flow
3. ⏳ Verify DATABASE_URL and ENCRYPTION_KEY are set in Vercel
4. ⏳ Add health endpoint for monitoring
5. ⏳ Consider demo mode for testing

---

## Environment Check Needed

Verify these Vercel environment variables are set:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ENCRYPTION_KEY` - For session encryption/decryption
- `SHOPIFY_API_KEY` - App client ID
- `SHOPIFY_API_SECRET` - App client secret

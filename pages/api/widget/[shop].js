/**
 * ZestRec Widget Endpoint
 * 
 * GET /api/widget/[shop]?product_id=xxx&format=json|html
 * 
 * Returns recommended products for embedding in storefront
 * Merchants embed via: <script src="https://app.zestrec.com/api/widget/mystore.myshopify.com?product_id=123"></script>
 */

import prisma from "@/utils/prisma.js";
import { decrypt } from "@/utils/cryption.js";
import { getRecommendations } from "@/utils/recommendations.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export default async function handler(req, res) {
  // CORS headers for widget embedding
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop } = req.query;
  const { product_id, productId, format = 'json', limit = 4, callback } = req.query;
  
  const pid = product_id || productId;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  if (!pid) {
    return res.status(400).json({ error: 'Missing product_id parameter' });
  }

  try {
    // Get shop's access token from database
    const session = await prisma.session.findFirst({
      where: { 
        shop: shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
      },
      orderBy: { id: 'desc' }
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'Shop not found. Please install the ZestRec app first.' 
      });
    }

    const accessToken = decrypt(session.accessToken);
    const shopDomain = session.shop;

    // Get recommendations from Shopify's native API
    const result = await getRecommendations(shopDomain, accessToken, pid, parseInt(limit, 10));

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to get recommendations' 
      });
    }

    // Log for analytics (could store in DB)
    console.log(`[ZestRec] Served ${result.count} recs for product ${pid} on ${shopDomain}`);

    // Return based on format
    if (format === 'html') {
      const html = generateWidgetHtml(result.products, shopDomain);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    if (format === 'jsonp' && callback) {
      res.setHeader('Content-Type', 'application/javascript');
      return res.status(200).send(`${callback}(${JSON.stringify({
        success: true,
        products: result.products,
        count: result.count
      })})`);
    }

    // Default: JSON
    return res.status(200).json({
      success: true,
      shop: shopDomain,
      productId: pid,
      recommendations: result.products,
      count: result.count
    });

  } catch (error) {
    console.error('[ZestRec Widget] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate embeddable HTML widget
 */
function generateWidgetHtml(products, shop) {
  if (!products || products.length === 0) {
    return '<!-- ZestRec: No recommendations available -->';
  }

  const productCards = products.map(product => `
    <div class="zestrec-product">
      <a href="${product.url}" class="zestrec-link">
        ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.title)}" class="zestrec-image" loading="lazy">` : ''}
        <div class="zestrec-info">
          <h4 class="zestrec-title">${escapeHtml(product.title)}</h4>
          <div class="zestrec-price">
            ${product.compareAtPrice ? `<span class="zestrec-compare-price">$${product.compareAtPrice}</span>` : ''}
            <span class="zestrec-current-price">$${product.price}</span>
          </div>
        </div>
      </a>
    </div>
  `).join('');

  return `
<div class="zestrec-widget" data-shop="${escapeHtml(shop)}">
  <style>
    .zestrec-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .zestrec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .zestrec-product {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .zestrec-product:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .zestrec-link {
      text-decoration: none;
      color: inherit;
      display: block;
    }
    .zestrec-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }
    .zestrec-info {
      padding: 12px;
    }
    .zestrec-title {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .zestrec-price {
      font-size: 14px;
    }
    .zestrec-compare-price {
      text-decoration: line-through;
      color: #999;
      margin-right: 8px;
    }
    .zestrec-current-price {
      font-weight: 600;
      color: #111;
    }
  </style>
  <div class="zestrec-grid">
    ${productCards}
  </div>
</div>
  `.trim();
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

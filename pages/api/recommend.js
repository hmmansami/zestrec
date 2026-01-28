/**
 * Product Recommendations API
 * 
 * GET /api/recommend?productId=xxx&shop=mystore.myshopify.com
 * Returns related products from Algolia
 */

import { getRelatedProducts } from "@/utils/algolia.js";

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 */
export default async function handler(req, res) {
  // Set CORS headers for widget access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { productId, shop, limit = 4 } = req.query;
  
  if (!productId) {
    return res.status(400).json({ 
      error: 'Missing productId parameter' 
    });
  }
  
  if (!shop) {
    return res.status(400).json({ 
      error: 'Missing shop parameter' 
    });
  }
  
  try {
    const result = await getRelatedProducts(
      productId, 
      shop, 
      parseInt(limit, 10)
    );
    
    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to get recommendations' 
      });
    }
    
    // Track recommendation served (could log to analytics)
    console.log(`Served ${result.products.length} recommendations for product ${productId} on ${shop}`);
    
    return res.status(200).json({
      success: true,
      productId,
      shop,
      recommendations: result.products,
      count: result.products.length
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
